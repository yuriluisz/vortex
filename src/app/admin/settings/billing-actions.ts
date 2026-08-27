"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { revalidatePath } from "next/cache";
import { logAudit } from "@/lib/audit";
import {
  createCustomer,
  updateCustomer,
  createSubscription,
  createSubscriptionWithDate,
  upgradeSubscription,
  cancelSubscription,
  PLAN_PRICES,
  getSubscriptionPayments,
} from "@/services/asaas.service";
import { PLAN_LIMITS } from "@/lib/plans";
import type { Plan } from "@/lib/prisma-types";
import type { Plan as PrismaPlan } from "@prisma/client";
import type { ActionState } from "./actions";

// ============================================================================
// SEGURANÇA: Validação de sessão reutilizável
// ============================================================================
async function requireAuth() {
  const session = await getSession();
  if (!session?.email || !session.tenantId) {
    throw new Error("Não autorizado.");
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: session.tenantId },
    select: { id: true, name: true, slug: true, plan: true },
  });

  if (!tenant) {
    throw new Error("Sessão inválida. Faça login novamente.");
  }

  return {
    userId: session.userId,
    email: session.email,
    tenantId: tenant.id,
    tenantName: tenant.name,
    tenantSlug: tenant.slug,
    plan: tenant.plan as Plan,
    role: session.role,
  };
}

// ============================================================================
// SCHEMAS
// ============================================================================

const BillingInfoSchema = z.object({
  personType: z.enum(["FISICA", "JURIDICA"]),
  cpfCnpj: z.string().min(11, "CPF/CNPJ inválido"),
  businessName: z.string().optional(),
  phone: z.string().min(8, "Telefone inválido"),
  zipCode: z.string().optional(),
  street: z.string().optional(),
  number: z.string().optional(),
  complement: z.string().optional(),
  neighborhood: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
});

const PlanChangeSchema = z.object({
  plan: z.enum(["FREE", "PRO", "ULTRA"]),
});

// ============================================================================
// ACTIONS: BILLING & SUBSCRIPTIONS
// ============================================================================

export async function saveBillingInfoAction(
  state: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { tenantId } = await requireAuth();

  const parsed = BillingInfoSchema.safeParse({
    personType: formData.get("personType"),
    cpfCnpj: formData.get("cpfCnpj"),
    businessName: formData.get("businessName") || undefined,
    phone: formData.get("phone"),
    zipCode: formData.get("zipCode") || undefined,
    street: formData.get("street") || undefined,
    number: formData.get("number") || undefined,
    complement: formData.get("complement") || undefined,
    neighborhood: formData.get("neighborhood") || undefined,
    city: formData.get("city") || undefined,
    state: formData.get("state") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Dados inválidos." };
  }

  try {
    const address: Record<string, string> = {};
    if (parsed.data.zipCode) address.zipCode = parsed.data.zipCode;
    if (parsed.data.street) address.street = parsed.data.street;
    if (parsed.data.number) address.number = parsed.data.number;
    if (parsed.data.complement) address.complement = parsed.data.complement;
    if (parsed.data.neighborhood) address.neighborhood = parsed.data.neighborhood;
    if (parsed.data.city) address.city = parsed.data.city;
    if (parsed.data.state) address.state = parsed.data.state;

    await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        billingCpfCnpj: parsed.data.cpfCnpj,
        billingPersonType: parsed.data.personType,
        billingBusinessName: parsed.data.businessName || null,
        billingPhone: parsed.data.phone,
        billingAddress: Object.keys(address).length > 0 ? address : undefined,
      },
    });

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { asaasCustomerId: true },
    });

    if (tenant?.asaasCustomerId) {
      try {
        await updateCustomer(tenant.asaasCustomerId, {
          cpfCnpj: parsed.data.cpfCnpj,
          personType: parsed.data.personType,
          phone: parsed.data.phone,
          address: Object.keys(address).length > 0 ? address as any : undefined,
        });
      } catch (error) {
        console.warn("[BillingInfo] Falha ao atualizar customer ASAAS:", error);
      }
    }

    revalidatePath("/admin/settings");
    return { success: true };
  } catch (error) {
    console.error("[BillingInfo] Erro ao salvar:", error);
    return { error: "Erro ao salvar dados. Tente novamente." };
  }
}

export async function verifyPaymentAction(): Promise<ActionState> {
  const { tenantId, userId } = await requireAuth();

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: {
      asaasSubscriptionId: true,
      asaasCustomerId: true,
      pendingPlan: true,
      plan: true,
      subscriptionStatus: true,
      lastPaymentId: true,
    },
  });

  if (!tenant) return { error: "Tenant não encontrado." };

  if (tenant.subscriptionStatus !== "PENDING_PAYMENT") {
    return { error: "Nenhum pagamento pendente encontrado." };
  }

  if (!tenant.asaasSubscriptionId) {
    return { error: "Nenhuma assinatura encontrada no ASAAS." };
  }

  if (!tenant.pendingPlan) {
    return { error: "Nenhum plano pendente para ativar." };
  }

  try {
    const paymentsResponse = await getSubscriptionPayments(tenant.asaasSubscriptionId);
    const payments = paymentsResponse.data || [];

    const confirmedPayment = payments.find((p: any) =>
      p.status === "RECEIVED" || p.status === "CONFIRMED"
    );

    if (!confirmedPayment) {
      return { error: "Pagamento ainda não confirmado. Tente novamente em alguns instantes." };
    }

    const planToActivate = tenant.pendingPlan;
    const planLimits = PLAN_LIMITS[planToActivate as Plan];

    const updateData: Record<string, any> = {
      plan: planToActivate,
      subscriptionStatus: "ACTIVE",
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      pendingPlan: null,
      cancelAt: null,
      gracePeriodEnd: null,
      lastPaymentId: confirmedPayment.id,
    };

    if (planLimits) {
      updateData.maxCampaigns = planLimits.maxCampaigns;
      updateData.maxGroups = planLimits.maxGroups;
      updateData.maxLeads = planLimits.maxLeads;
    }

    if (confirmedPayment.subscription) {
      updateData.asaasSubscriptionId = confirmedPayment.subscription;
    }

    await prisma.tenant.update({
      where: { id: tenantId },
      data: updateData,
    });

    await logAudit("PLAN_CHANGED", {
      from: tenant.plan,
      to: planToActivate,
      type: "PAYMENT_VERIFIED",
      paymentId: confirmedPayment.id,
    }, userId, tenantId);

    revalidatePath("/admin/settings");
    return { success: true };
  } catch (error) {
    console.error("[VerifyPayment] Erro:", error);
    const message = error instanceof Error ? error.message : "Erro ao verificar pagamento.";
    return { error: message };
  }
}

export async function changePlanCheckoutAction(
  state: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { plan: currentPlan, tenantId, userId } = await requireAuth();

  const parsed = PlanChangeSchema.safeParse({
    plan: formData.get("plan"),
  });

  if (!parsed.success) {
    return { error: "Plano inválido." };
  }

  const { plan: targetPlan } = parsed.data;

  if (targetPlan === currentPlan) {
    return { error: "Você já está neste plano." };
  }

  if (targetPlan === "FREE") {
    return handleDowngradeToFree(tenantId, userId);
  }

  if (!process.env.ASAAS_API_KEY || !process.env.ASAAS_API_URL) {
    return { error: "Pagamento indisponível no momento (Asaas não configurado)." };
  }

  try {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: { users: true },
    });

    if (!tenant) return { error: "Tenant não encontrado." };

    if (!tenant.billingCpfCnpj || !tenant.billingPhone) {
      return { error: "Preencha seus dados de cobrança antes de alterar o plano.", needsBilling: true };
    }

    let asaasCustomerId = tenant.asaasCustomerId;

    if (!asaasCustomerId) {
      asaasCustomerId = await ensureAsaasCustomer(tenant);
    } else {
      await syncCustomerData(asaasCustomerId, tenant);
    }

    if (!asaasCustomerId) {
      return { error: "Falha ao criar cliente no Asaas." };
    }

    const currentPrice = PLAN_PRICES[currentPlan] || 0;
    const targetPrice = PLAN_PRICES[targetPlan] || 0;

    // Upgrade com prorate (PRO → ULTRA)
    if (currentPrice > 0 && targetPrice > currentPrice && tenant.asaasSubscriptionId && tenant.currentPeriodEnd) {
      const result = await upgradeSubscription(
        asaasCustomerId,
        tenant.asaasSubscriptionId,
        tenant.currentPeriodEnd,
        currentPlan,
        targetPlan
      );

      await prisma.tenant.update({
        where: { id: tenantId },
        data: {
          pendingPlan: targetPlan as PrismaPlan,
          subscriptionStatus: "PENDING_PAYMENT",
        },
      });

      await logAudit("PLAN_CHANGED", { from: currentPlan, to: targetPlan, type: "UPGRADE" }, userId, tenantId);

      if (result.invoiceUrl) {
        return { invoiceUrl: result.invoiceUrl };
      }

      const planLimits = PLAN_LIMITS[targetPlan as Plan];
      await prisma.tenant.update({
        where: { id: tenantId },
        data: {
          plan: targetPlan as PrismaPlan,
          pendingPlan: null,
          subscriptionStatus: "ACTIVE",
          maxCampaigns: planLimits.maxCampaigns,
          maxGroups: planLimits.maxGroups,
          maxLeads: planLimits.maxLeads,
        },
      });

      revalidatePath("/admin/settings");
      return { success: true };
    }

    // Nova assinatura (FREE → PRO/ULTRA)
    const subResult = await createSubscription(asaasCustomerId, targetPlan);

    await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        asaasSubscriptionId: subResult.subscriptionId,
        pendingPlan: targetPlan as PrismaPlan,
        subscriptionStatus: "PENDING_PAYMENT",
      },
    });

    await logAudit("PLAN_CHANGED", { from: currentPlan, to: targetPlan, type: "NEW_SUBSCRIPTION" }, userId, tenantId);

    if (subResult.invoiceUrl) {
      return { invoiceUrl: subResult.invoiceUrl };
    }

    revalidatePath("/admin/settings");
    return { success: true };

  } catch (error) {
    console.error("[ChangePlan] Erro:", error);
    const message = error instanceof Error ? error.message : "Erro inesperado ao processar pagamento.";
    return { error: message };
  }
}

export async function cancelSubscriptionAction(): Promise<ActionState> {
  const { tenantId, userId } = await requireAuth();

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: {
      asaasSubscriptionId: true,
      currentPeriodEnd: true,
      plan: true,
      subscriptionStatus: true,
    },
  });

  if (!tenant) return { error: "Tenant não encontrado." };

  if (!tenant.asaasSubscriptionId) {
    return { error: "Nenhuma assinatura ativa encontrada." };
  }

  if (tenant.subscriptionStatus === "CANCELING" || tenant.subscriptionStatus === "CANCELED") {
    return { error: "A assinatura já está cancelada ou em cancelamento." };
  }

  try {
    await cancelSubscription(tenant.asaasSubscriptionId);

    const cancelAt = tenant.currentPeriodEnd || new Date();

    await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        subscriptionStatus: "CANCELING",
        cancelAt,
        pendingPlan: null,
      },
    });

    await logAudit("PLAN_CHANGED", {
      from: tenant.plan,
      to: "FREE",
      type: "CANCELLATION",
      cancelAt: cancelAt.toISOString(),
    }, userId, tenantId);

    revalidatePath("/admin/settings");
    return { success: true };
  } catch (error) {
    console.error("[CancelSubscription] Erro:", error);
    return { error: error instanceof Error ? error.message : "Erro ao cancelar assinatura." };
  }
}

export async function reactivateSubscriptionAction(): Promise<ActionState> {
  const { tenantId, userId } = await requireAuth();

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: {
      asaasSubscriptionId: true,
      currentPeriodEnd: true,
      plan: true,
      subscriptionStatus: true,
      asaasCustomerId: true,
      billingCpfCnpj: true,
      billingPhone: true,
    },
  });

  if (!tenant) return { error: "Tenant não encontrado." };

  if (tenant.subscriptionStatus !== "CANCELING") {
    return { error: "A assinatura não está em processo de cancelamento." };
  }

  if (!tenant.currentPeriodEnd || new Date() >= tenant.currentPeriodEnd) {
    return { error: "O período de acesso já expirou. Faça uma nova assinatura." };
  }

  if (!tenant.asaasCustomerId) {
    return { error: "Cliente não encontrado no Asaas. Entre em contato com o suporte." };
  }

  if (!process.env.ASAAS_API_KEY || !process.env.ASAAS_API_URL) {
    return { error: "Pagamento indisponível no momento (Asaas não configurado)." };
  }

  try {
    const plan = tenant.plan;
    const planPrice = PLAN_PRICES[plan] || 0;

    if (planPrice <= 0) {
      return { error: "Não é possível reativar plano gratuito." };
    }

    const nextDueDate = new Date(tenant.currentPeriodEnd).toISOString().split("T")[0];

    const subData = await createSubscriptionWithDate(
      tenant.asaasCustomerId,
      plan,
      nextDueDate
    );

    await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        subscriptionStatus: "ACTIVE",
        cancelAt: null,
        asaasSubscriptionId: subData.subscriptionId,
        pendingPlan: null,
      },
    });

    await logAudit("PLAN_CHANGED", {
      from: plan,
      to: plan,
      type: "REACTIVATION",
    }, userId, tenantId);

    revalidatePath("/admin/settings");
    return { success: true };
  } catch (error) {
    console.error("[ReactivateSubscription] Erro:", error);
    return { error: error instanceof Error ? error.message : "Erro ao reativar assinatura." };
  }
}

// ============================================================================
// HELPERS
// ============================================================================

async function handleDowngradeToFree(tenantId: string, userId: string): Promise<ActionState> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: {
      asaasSubscriptionId: true,
      currentPeriodEnd: true,
      plan: true,
    },
  });

  if (!tenant) return { error: "Tenant não encontrado." };

  try {
    if (tenant.asaasSubscriptionId) {
      try {
        await cancelSubscription(tenant.asaasSubscriptionId);
      } catch (error) {
        console.warn("[DowngradeToFree] Falha ao cancelar no ASAAS:", error);
      }
    }

    if (tenant.currentPeriodEnd && new Date() < tenant.currentPeriodEnd) {
      await prisma.tenant.update({
        where: { id: tenantId },
        data: {
          subscriptionStatus: "CANCELING",
          cancelAt: tenant.currentPeriodEnd,
          pendingPlan: null,
        },
      });

      await logAudit("PLAN_CHANGED", {
        from: tenant.plan,
        to: "FREE",
        type: "DOWNGRADE_SCHEDULED",
        cancelAt: tenant.currentPeriodEnd.toISOString(),
      }, userId, tenantId);
    } else {
      const freeLimits = PLAN_LIMITS["FREE"];
      await prisma.tenant.update({
        where: { id: tenantId },
        data: {
          plan: "FREE",
          subscriptionStatus: "CANCELED",
          asaasSubscriptionId: null,
          pendingPlan: null,
          cancelAt: null,
          gracePeriodEnd: null,
          currentPeriodEnd: null,
          maxCampaigns: freeLimits.maxCampaigns,
          maxGroups: freeLimits.maxGroups,
          maxLeads: freeLimits.maxLeads,
        },
      });

      await logAudit("PLAN_CHANGED", {
        from: tenant.plan,
        to: "FREE",
        type: "DOWNGRADE_IMMEDIATE",
      }, userId, tenantId);
    }

    revalidatePath("/admin/settings");
    return { success: true };
  } catch (error) {
    console.error("[DowngradeToFree] Erro:", error);
    return { error: "Erro ao alterar para plano Free." };
  }
}

async function ensureAsaasCustomer(tenant: any): Promise<string | null> {
  const adminUser = tenant.users.find((u: any) => u.role === "SUPER_ADMIN" || u.role === "ADMIN") || tenant.users[0];
  const billingAddress = tenant.billingAddress as Record<string, string> | null;

  try {
    const customer = await createCustomer(tenant.name, adminUser.email, {
      cpfCnpj: tenant.billingCpfCnpj!,
      personType: tenant.billingPersonType || "FISICA",
      phone: tenant.billingPhone!,
      address: billingAddress || undefined,
    });

    await prisma.tenant.update({
      where: { id: tenant.id },
      data: { asaasCustomerId: customer.id },
    });

    return customer.id;
  } catch (error) {
    console.error("[EnsureCustomer] Falha:", error);
    return null;
  }
}

async function syncCustomerData(customerId: string, tenant: any): Promise<void> {
  if (!tenant.billingCpfCnpj || !tenant.billingPhone) return;

  try {
    await updateCustomer(customerId, {
      cpfCnpj: tenant.billingCpfCnpj,
      personType: tenant.billingPersonType || "FISICA",
      phone: tenant.billingPhone,
      address: tenant.billingAddress as any || undefined,
    });
  } catch (error) {
    console.warn("[SyncCustomer] Falha:", error);
  }
}
