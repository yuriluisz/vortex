import "server-only";
import { prisma } from "@/lib/prisma";
import { PLAN_LIMITS } from "@/lib/plans";
import type { Plan } from "@/lib/prisma-types";

// Grace period: 5 dias
const GRACE_PERIOD_DAYS = 5;

export type SubscriptionStatus =
  | "TRIAL"
  | "ACTIVE"
  | "PAST_DUE"
  | "CANCELED"
  | "CANCELING"
  | "PENDING_PAYMENT";

export interface SubscriptionCheck {
  /** Se o tenant pode usar o sistema */
  allowed: boolean;
  /** Plano efetivo (pode diferir do plan do DB se enforcement atuou) */
  planEffective: Plan;
  /** Status da assinatura */
  status: SubscriptionStatus;
  /** Aviso para exibir no painel (banner) */
  warning?: string;
  /** Dias restantes até expiração (cancelamento agendado ou grace period) */
  daysUntilExpiry?: number;
  /** Se o plano foi alterado pelo enforcement nesta checagem */
  enforcementApplied: boolean;
}

/**
 * Desativa campanhas e grupos excedentes quando o tenant é rebaixado.
 * Mantém os mais recentes ativos, desativa o restante.
 */
export async function enforceDowngrade(
  tenantId: string,
  newPlan: Plan
): Promise<void> {
  const limits = PLAN_LIMITS[newPlan];

  // --- Campanhas ---
  if (limits.maxCampaigns !== -1) {
    const activeCampaigns = await prisma.campaign.findMany({
      where: { tenantId, active: true },
      orderBy: { createdAt: "desc" },
      select: { id: true, createdAt: true },
    });

    if (activeCampaigns.length > limits.maxCampaigns) {
      // IDs das campanhas que devem permanecer ativas (as mais recentes)
      const keepIds = activeCampaigns
        .slice(0, limits.maxCampaigns)
        .map((c) => c.id);

      // Desativar as excedentes
      await prisma.campaign.updateMany({
        where: {
          tenantId,
          active: true,
          id: { notIn: keepIds },
        },
        data: { active: false },
      });
    }
  }

  // --- Grupos ---
  if (limits.maxGroups !== -1) {
    const activeGroups = await prisma.group.findMany({
      where: { tenantId, active: true },
      orderBy: { createdAt: "desc" },
      select: { id: true, createdAt: true },
    });

    if (activeGroups.length > limits.maxGroups) {
      const keepIds = activeGroups
        .slice(0, limits.maxGroups)
        .map((g) => g.id);

      await prisma.group.updateMany({
        where: {
          tenantId,
          active: true,
          id: { notIn: keepIds },
        },
        data: { active: false },
      });
    }
  }

  // Marcar que o tenant está com dados excedentes
  const totalCampaigns = await prisma.campaign.count({ where: { tenantId } });
  const totalGroups = await prisma.group.count({ where: { tenantId } });
  const totalLeads = await prisma.lead.count({ where: { tenantId } });

  const overLimit =
    (limits.maxCampaigns !== -1 && totalCampaigns > limits.maxCampaigns) ||
    (limits.maxGroups !== -1 && totalGroups > limits.maxGroups) ||
    (limits.maxLeads !== -1 && totalLeads > limits.maxLeads);

  await prisma.tenant.update({
    where: { id: tenantId },
    data: { overLimit },
  });
}

/**
 * Verifica o status da assinatura de um tenant e aplica enforcement quando necessário.
 *
 * Deve ser chamada em toda rota admin e páginas públicas para garantir que:
 * 1. Tenants com assinatura CANCELING e cancelAt expirado são rebaixados para FREE
 * 2. Tenants com PAST_DUE e grace period expirado são rebaixados para FREE
 * 3. Durante o grace period, o acesso é permitido (apenas com aviso)
 * 4. Banners de aviso são exibidos para status intermediários
 */
export async function enforceSubscription(tenantId: string): Promise<SubscriptionCheck> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: {
      plan: true,
      subscriptionStatus: true,
      currentPeriodEnd: true,
      cancelAt: true,
      gracePeriodEnd: true,
      pendingPlan: true,
      maxCampaigns: true,
      maxGroups: true,
      maxLeads: true,
    },
  });

  if (!tenant) {
    return {
      allowed: false,
      planEffective: "FREE",
      status: "CANCELED",
      warning: "Tenant não encontrado.",
      enforcementApplied: false,
    };
  }

  const now = new Date();
  const status = tenant.subscriptionStatus as SubscriptionStatus;
  const plan = tenant.plan as Plan;

  // ================================================================
  // CASE 1: CANCELING — Cancelamento agendado
  // O tenant mantém acesso ao plano pago até cancelAt
  // ================================================================
  if (status === "CANCELING" && tenant.cancelAt) {
    if (now >= tenant.cancelAt) {
      // Prazo expirou → Efetivar downgrade para FREE
      const freeLimits = PLAN_LIMITS["FREE"];
      await prisma.tenant.update({
        where: { id: tenantId },
        data: {
          plan: "FREE",
          subscriptionStatus: "CANCELED",
          asaasSubscriptionId: null,
          cancelAt: null,
          gracePeriodEnd: null,
          pendingPlan: null,
          currentPeriodEnd: null,
          downgradeReason: "CANCELAMENTO_VOLUNTARIO",
          maxCampaigns: freeLimits.maxCampaigns,
          maxGroups: freeLimits.maxGroups,
          maxLeads: freeLimits.maxLeads,
        },
      });

      // Aplicar downgrade nos recursos
      await enforceDowngrade(tenantId, "FREE");

      return {
        allowed: true,
        planEffective: "FREE",
        status: "CANCELED",
        warning: "Sua assinatura foi cancelada. Você está no plano Free.",
        enforcementApplied: true,
      };
    }

    // Ainda dentro do prazo — mostrar aviso com dias restantes
    const daysUntilExpiry = Math.ceil(
      (tenant.cancelAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    return {
      allowed: true,
      planEffective: plan,
      status: "CANCELING",
      warning: `Seu plano será rebaixado para Free em ${daysUntilExpiry} dia${daysUntilExpiry !== 1 ? "s" : ""}. Você pode reativar a qualquer momento.`,
      daysUntilExpiry,
      enforcementApplied: false,
    };
  }

  // ================================================================
  // CASE 2: PAST_DUE — Pagamento vencido (grace period de 5 dias)
  // ================================================================
  if (status === "PAST_DUE") {
    const graceEnd = tenant.gracePeriodEnd;

    if (graceEnd && now >= graceEnd) {
      // Grace period expirou → Forçar downgrade para FREE
      const freeLimits = PLAN_LIMITS["FREE"];
      await prisma.tenant.update({
        where: { id: tenantId },
        data: {
          plan: "FREE",
          subscriptionStatus: "CANCELED",
          asaasSubscriptionId: null,
          cancelAt: null,
          gracePeriodEnd: null,
          pendingPlan: null,
          currentPeriodEnd: null,
          downgradeReason: "INADIMPLENCIA",
          maxCampaigns: freeLimits.maxCampaigns,
          maxGroups: freeLimits.maxGroups,
          maxLeads: freeLimits.maxLeads,
        },
      });

      // Aplicar downgrade nos recursos
      await enforceDowngrade(tenantId, "FREE");

      return {
        allowed: true,
        planEffective: "FREE",
        status: "CANCELED",
        warning: "Sua assinatura foi cancelada por falta de pagamento. Você está no plano Free.",
        enforcementApplied: true,
      };
    }

    // Dentro do grace period — permitir acesso com aviso
    const daysUntilExpiry = graceEnd
      ? Math.ceil((graceEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      : GRACE_PERIOD_DAYS;

    return {
      allowed: true,
      planEffective: plan,
      status: "PAST_DUE",
      warning: `Seu pagamento está vencido. Regularize em ${daysUntilExpiry} dia${daysUntilExpiry !== 1 ? "s" : ""} para manter seu plano.`,
      daysUntilExpiry,
      enforcementApplied: false,
    };
  }

  // ================================================================
  // CASE 3: PENDING_PAYMENT — Aguardando confirmação de pagamento
  // ================================================================
  if (status === "PENDING_PAYMENT") {
    return {
      allowed: true,
      planEffective: plan,
      status: "PENDING_PAYMENT",
      warning: tenant.pendingPlan
        ? `Aguardando confirmação de pagamento para o plano ${tenant.pendingPlan}.`
        : "Aguardando confirmação de pagamento.",
      enforcementApplied: false,
    };
  }

  // ================================================================
  // CASE 4: ACTIVE — Tudo ok
  // ================================================================
  if (status === "ACTIVE") {
    return {
      allowed: true,
      planEffective: plan,
      status: "ACTIVE",
      enforcementApplied: false,
    };
  }

  // ================================================================
  // CASE 5: TRIAL / CANCELED / default — Plano FREE funcional
  // ================================================================
  return {
    allowed: true,
    planEffective: plan,
    status: status || "TRIAL",
    enforcementApplied: false,
  };
}

/**
 * Calcula quantos dias restam até o currentPeriodEnd.
 */
export function daysUntilPeriodEnd(currentPeriodEnd: Date | null): number | null {
  if (!currentPeriodEnd) return null;
  const now = new Date();
  const diff = currentPeriodEnd.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

/**
 * Calcula a porcentagem do ciclo atual já decorrida.
 */
export function cycleProgressPercent(currentPeriodEnd: Date | null): number {
  if (!currentPeriodEnd) return 0;
  const now = new Date();
  const periodStart = new Date(currentPeriodEnd.getTime() - 30 * 24 * 60 * 60 * 1000);
  const totalDays = 30;
  const elapsed = (now.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24);
  return Math.min(100, Math.max(0, Math.round((elapsed / totalDays) * 100)));
}