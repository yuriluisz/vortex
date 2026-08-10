"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession, createSession, deleteSession } from "@/lib/session";
import { revalidatePath } from "next/cache";
import { logAudit } from "@/lib/audit";
import { rateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { headers } from "next/headers";
import { generateOTP, storeOTP, verifyOTP, sendOTPEmail } from "@/lib/auth";
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

// ============================================================================
// SEGURANÇA: Lista de nomes reservados (bloqueia variações de "vortex")
// ============================================================================

const RESERVED_NAMES = [
  // Exatas
  "vortex", "vortexpages", "vortex-pages", "vortex_pages",
  "vortexplus", "vortex_plus",
  // Com números
  "vortex1", "vortex2", "vortex3", "vortexapp", "vortexapp",
  "vortexpages1", "vortexpages2",
  // Variações com caracteres especiais/acentos
  "vórtex", "vórTEX", "v0rtex", "v0rt3x", "vort3x",
  "vortexbr", "vortexbrasil", "vortexbr",
  "myvortex", "meuvortex", "seuvortex",
];

/**
 * Verifica se um nome/slug contém variações reservadas de "vortex".
 * Apenas o admin (yulusica@gmail.com) pode usar esses nomes.
 */
function isReservedName(name: string, email: string): boolean {
  const normalized = name.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase() || "yulusica@gmail.com";

  // Admin pode usar qualquer nome reservado
  if (email.toLowerCase() === adminEmail) return false;

  // Verifica correspondência exata ou parcial
  for (const reserved of RESERVED_NAMES) {
    const reservedNormalized = reserved.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    if (normalized === reservedNormalized || normalized.includes(reservedNormalized) || reservedNormalized.includes(normalized)) {
      return true;
    }
  }

  // Regex para capturar variações criativas (v0rtex, vort3x, etc.)
  const vortexRegex = /^v[o0òóõ]r[t7]e?[x×]?[a-z0-9]*$/i;
  if (vortexRegex.test(normalized.replace(/[^a-z0-9]/g, ""))) {
    return true;
  }

  return false;
}

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

export type ActionState = {
  success?: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
  invoiceUrl?: string;
  needsBilling?: boolean;
} | undefined;

// ============================================================================
// ATUALIZAR PERFIL (nome da empresa, subdomínio)
// ============================================================================

const ProfileSchema = z.object({
  companyName: z.string().min(1, "O nome da empresa é obrigatório"),
  slug: z
    .string()
    .min(1, "O subdomínio é obrigatório")
    .transform((val) => val.toLowerCase().replace(/\s+/g, "-"))
    .refine(
      (val) => /^[a-z0-9-]+$/.test(val),
      "O subdomínio deve conter apenas letras minúsculas, números e hífens"
    ),
});

export async function updateProfileAction(
  state: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { userId, tenantId, tenantSlug, email, role, plan } = await requireAuth();

  const parsed = ProfileSchema.safeParse({
    companyName: formData.get("companyName"),
    slug: formData.get("slug"),
  });

  if (!parsed.success) {
    return {
      error: "Verifique os erros no formulário.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { companyName, slug } = parsed.data;

  // Verificar se o nome da empresa contém variações reservadas de "vortex"
  if (isReservedName(companyName, email)) {
    return { error: "Este nome está reservado. Escolha outro." };
  }

  if (slug !== tenantSlug) {
    const existing = await prisma.tenant.findUnique({ where: { slug } });
    if (existing) {
      return { error: "Este subdomínio já está em uso." };
    }
  }

  try {
    await prisma.tenant.update({
      where: { id: tenantId },
      data: { name: companyName, slug },
    });

    if (slug !== tenantSlug) {
      await deleteSession();
      await createSession(userId, email, tenantId, slug, plan, role);
    }

    await logAudit("TENANT_UPDATED", { companyName, slug }, userId, tenantId);
  } catch (error) {
    console.error(error);
    return { error: "Erro interno ao atualizar perfil." };
  }

  revalidatePath("/admin/settings");
  return { success: true };
}

export async function updateCombinedSettingsAction(
  state: ActionState,
  formData: FormData
): Promise<ActionState> {
  const profileResult = await updateProfileAction(state, formData);
  if (profileResult?.error || profileResult?.fieldErrors) {
    return profileResult;
  }

  const billingResult = await saveBillingInfoAction(state, formData);
  if (billingResult?.error || billingResult?.fieldErrors) {
    return billingResult;
  }

  return { success: true };
}

// ============================================================================
// ATUALIZAR NOME DO USUÁRIO
// ============================================================================

const UserNameSchema = z.object({
  userName: z.string().min(1, "O nome é obrigatório"),
});

export async function updateUserNameAction(
  state: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { userId } = await requireAuth();

  const parsed = UserNameSchema.safeParse({
    userName: formData.get("userName"),
  });

  if (!parsed.success) {
    return {
      error: "Verifique os erros no formulário.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    await prisma.user.update({
      where: { id: userId },
      data: { name: parsed.data.userName },
    });
  } catch (error) {
    console.error(error);
    return { error: "Erro ao atualizar nome." };
  }

  revalidatePath("/admin/settings");
  return { success: true };
}

// ============================================================================
// ALTERAÇÃO DE EMAIL (2 passos: solicitar → verificar OTP)
// ============================================================================

const EmailChangeSchema = z.object({
  newEmail: z.string().email("E-mail inválido"),
});

export async function requestEmailChangeAction(
  state: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { userId, tenantId, email: currentEmail } = await requireAuth();

  const parsed = EmailChangeSchema.safeParse({
    newEmail: formData.get("newEmail"),
  });

  if (!parsed.success) {
    return {
      error: "Verifique os erros no formulário.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { newEmail } = parsed.data;
  const normalizedEmail = newEmail.toLowerCase();

  if (normalizedEmail === currentEmail.toLowerCase()) {
    return { error: "O novo email deve ser diferente do atual." };
  }

  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });
  if (existingUser) {
    return { error: "Este email já está em uso por outra conta." };
  }

  const ip = (await headers()).get("cf-connecting-ip") || (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const rateKey = `email_change:${ip}`;
  const rateResult = await rateLimit(rateKey, RATE_LIMITS.OTP);
  if (!rateResult.allowed) {
    return { error: "Muitas tentativas. Aguarde antes de tentar novamente." };
  }

  const otp = generateOTP();
  await storeOTP(`email_change:${normalizedEmail}`, otp);

  const emailResult = await sendOTPEmail(normalizedEmail, otp);
  if (!emailResult.success) {
    return { error: emailResult.error || "Falha ao enviar e-mail." };
  }

  return { success: true };
}

const VerifyEmailSchema = z.object({
  newEmail: z.string().email("E-mail inválido"),
  otp: z.string().length(6, "O código deve ter 6 dígitos"),
});

export async function verifyEmailChangeAction(
  state: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { userId, tenantId, role, plan, tenantSlug } = await requireAuth();

  const parsed = VerifyEmailSchema.safeParse({
    newEmail: formData.get("newEmail"),
    otp: formData.get("otp"),
  });

  if (!parsed.success) {
    return {
      error: "Verifique os erros no formulário.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { newEmail, otp } = parsed.data;
  const normalizedEmail = newEmail.toLowerCase();

  try {
    const isValid = await verifyOTP(`email_change:${normalizedEmail}`, otp);
    if (!isValid) {
      return { error: "Código inválido ou expirado." };
    }
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Erro ao verificar código.",
    };
  }

  try {
    await prisma.user.update({
      where: { id: userId },
      data: { email: normalizedEmail },
    });

    await deleteSession();
    await createSession(userId, normalizedEmail, tenantId, tenantSlug, plan, role);

    await logAudit("EMAIL_CHANGED", { newEmail: normalizedEmail }, userId, tenantId);
  } catch (error) {
    console.error(error);
    return { error: "Erro interno ao atualizar email." };
  }

  revalidatePath("/admin/settings");
  return { success: true };
}

// ============================================================================
// SALVAR DADOS FISCAIS (CPF/CNPJ, Telefone, Endereço)
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

    // Se já tem customer no ASAAS, atualizar lá também
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
        // Não bloqueia — dados locais foram salvos
      }
    }

    revalidatePath("/admin/settings");
    return { success: true };
  } catch (error) {
    console.error("[BillingInfo] Erro ao salvar:", error);
    return { error: "Erro ao salvar dados. Tente novamente." };
  }
}

// ============================================================================
// VERIFICAR PAGAMENTO — Polling / Botão "Já paguei"
// ============================================================================

/**
 * Verifica se o pagamento foi confirmado no ASAAS e ativa o plano.
 * Pode ser chamado via:
 * - Polling automático na página de checkout
 * - Botão "Já paguei — Verificar agora" na página de assinatura
 * - Webhook (fallback)
 */
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
    console.log("[VerifyPayment] Consultando pagamentos da subscription:", tenant.asaasSubscriptionId);

    const paymentsResponse = await getSubscriptionPayments(tenant.asaasSubscriptionId);
    const payments = paymentsResponse.data || [];

    console.log(`[VerifyPayment] ${payments.length} pagamento(s) encontrados`);

    // Procurar pagamento com status RECEIVED ou CONFIRMED
    const confirmedPayment = payments.find((p: any) =>
      p.status === "RECEIVED" || p.status === "CONFIRMED"
    );

    if (!confirmedPayment) {
      console.log("[VerifyPayment] ❌ Nenhum pagamento confirmado encontrado.");
      return { error: "Pagamento ainda não confirmado. Tente novamente em alguns instantes." };
    }

    console.log(`[VerifyPayment] ✅ Pagamento confirmado: ${confirmedPayment.id} (${confirmedPayment.status})`);

    // Ativar o plano
    const planToActivate = tenant.pendingPlan;
    const planLimits = PLAN_LIMITS[planToActivate as Plan];

    const updateData: Record<string, any> = {
      plan: planToActivate,
      subscriptionStatus: "ACTIVE",
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // +30 dias
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

    // Atualizar subscriptionId se veio no payment
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

    console.log(`[VerifyPayment] ✅ Plano ativado: ${tenantId} → ${planToActivate}`);

    revalidatePath("/admin/settings");
    return { success: true };
  } catch (error) {
    console.error("[VerifyPayment] Erro:", error);
    const message = error instanceof Error ? error.message : "Erro ao verificar pagamento.";
    return { error: message };
  }
}

// ============================================================================
// MUDANÇA DE PLANO — Fluxo principal
// ============================================================================

const PlanChangeSchema = z.object({
  plan: z.enum(["FREE", "PRO", "ULTRA"]),
});

/**
 * Action principal para mudança de plano.
 * 
 * REGRA FUNDAMENTAL: O plano NÃO muda até o pagamento ser confirmado via webhook.
 * 
 * Cenários:
 * 1. FREE → PRO/ULTRA: Cria assinatura, redireciona para checkout
 * 2. PRO → ULTRA: Upgrade com prorate, redireciona para checkout
 * 3. PRO/ULTRA → FREE: Cancela assinatura, mantém acesso até fim do período
 */
export async function changePlanCheckoutAction(
  state: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { plan: currentPlan, tenantId, userId, email } = await requireAuth();

  const parsed = PlanChangeSchema.safeParse({
    plan: formData.get("plan"),
  });

  if (!parsed.success) {
    return { error: "Plano inválido." };
  }

  const { plan: targetPlan } = parsed.data;

  console.log("[ChangePlan] Iniciando", { currentPlan, targetPlan, tenantId });

  if (targetPlan === currentPlan) {
    return { error: "Você já está neste plano." };
  }

  // ================================================================
  // CENÁRIO 4: Downgrade para FREE (cancelar assinatura)
  // ================================================================
  if (targetPlan === "FREE") {
    return handleDowngradeToFree(tenantId, userId);
  }

  // Verificar ASAAS configurado
  if (!process.env.ASAAS_API_KEY || !process.env.ASAAS_API_URL) {
    return { error: "Pagamento indisponível no momento (Asaas não configurado)." };
  }

  try {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: { users: true },
    });

    if (!tenant) return { error: "Tenant não encontrado." };

    // Verificar dados fiscais
    if (!tenant.billingCpfCnpj || !tenant.billingPhone) {
      return { error: "Preencha seus dados de cobrança antes de alterar o plano.", needsBilling: true };
    }

    let asaasCustomerId = tenant.asaasCustomerId;

    // Criar Customer no ASAAS se necessário
    if (!asaasCustomerId) {
      asaasCustomerId = await ensureAsaasCustomer(tenant);
    } else {
      // Atualizar dados do customer existente
      await syncCustomerData(asaasCustomerId, tenant);
    }

    if (!asaasCustomerId) {
      return { error: "Falha ao criar cliente no Asaas." };
    }

    const currentPrice = PLAN_PRICES[currentPlan] || 0;
    const targetPrice = PLAN_PRICES[targetPlan] || 0;

    // ================================================================
    // CENÁRIO 2: Upgrade com prorate (PRO → ULTRA)
    // ================================================================
    if (currentPrice > 0 && targetPrice > currentPrice && tenant.asaasSubscriptionId && tenant.currentPeriodEnd) {
      console.log("[ChangePlan] Upgrade com prorate", { currentPlan, targetPlan });

      const result = await upgradeSubscription(
        asaasCustomerId,
        tenant.asaasSubscriptionId,
        tenant.currentPeriodEnd,
        currentPlan,
        targetPlan
      );

      // Guardar pendingPlan — NÃO mudar plan ainda
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

      // Se não há cobrança adicional (diferença muito pequena), ativar direto
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

    // ================================================================
    // CENÁRIO 1: Nova assinatura (FREE → PRO/ULTRA)
    // ================================================================
    console.log("[ChangePlan] Criando nova assinatura", { targetPlan });

    const subResult = await createSubscription(asaasCustomerId, targetPlan);

    // Guardar pendingPlan — NÃO mudar plan ainda
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

// ============================================================================
// CANCELAR ASSINATURA
// ============================================================================

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
    // Cancelar no ASAAS
    await cancelSubscription(tenant.asaasSubscriptionId);

    // Definir cancelAt: fim do ciclo pago atual
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

// ============================================================================
// REATIVAR ASSINATURA
// ============================================================================

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

    // Criar nova assinatura no ASAAS com nextDueDate = currentPeriodEnd
    // para não cobrar duas vezes no mesmo ciclo
    const nextDueDate = new Date(tenant.currentPeriodEnd).toISOString().split("T")[0];

    const subData = await createSubscriptionWithDate(
      tenant.asaasCustomerId,
      plan,
      nextDueDate
    );

    // Atualizar tenant: remover cancelamento, voltar para ACTIVE
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

/**
 * Downgrade para FREE: Cancela assinatura no ASAAS e mantém acesso até currentPeriodEnd.
 */
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
    // Se tem assinatura ativa, cancelar no ASAAS
    if (tenant.asaasSubscriptionId) {
      try {
        await cancelSubscription(tenant.asaasSubscriptionId);
      } catch (error) {
        console.warn("[DowngradeToFree] Falha ao cancelar no ASAAS:", error);
        // Continua mesmo assim — pode já estar cancelada
      }
    }

    // Se tem período pago restante, agendar cancelamento
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
      // Sem período pago — rebaixar imediatamente
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

/**
 * Cria ou encontra customer no ASAAS.
 */
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

/**
 * Sincroniza dados do customer com ASAAS.
 */
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