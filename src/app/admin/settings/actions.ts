"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession, createSession, deleteSession } from "@/lib/session";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { logAudit } from "@/lib/audit";
import { rateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { headers } from "next/headers";
import { generateOTP, storeOTP, verifyOTP, sendOTPEmail } from "@/lib/auth";
import { Plan } from "@prisma/client";

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
} | undefined;

// ============================================================================
// ATUALIZAR PERFIL (nome da empresa, nome do usuário, subdomínio)
// ============================================================================

const ProfileSchema = z.object({
  companyName: z.string().min(1, "O nome da empresa é obrigatório"),
  userName: z.string().min(1, "O nome do usuário é obrigatório"),
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
  const { userId, tenantId, tenantSlug, email, role, plan } =
    await requireAuth();

  const parsed = ProfileSchema.safeParse({
    companyName: formData.get("companyName"),
    userName: formData.get("userName"),
    slug: formData.get("slug"),
  });

  if (!parsed.success) {
    return {
      error: "Verifique os erros no formulário.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { companyName, userName, slug } = parsed.data;

  // Se o slug mudou, verificar unicidade
  if (slug !== tenantSlug) {
    const existing = await prisma.tenant.findUnique({
      where: { slug },
    });
    if (existing) {
      return { error: "Este subdomínio já está em uso." };
    }
  }

  try {
    // Atualizar tenant
    await prisma.tenant.update({
      where: { id: tenantId },
      data: { name: companyName, slug },
    });

    // Atualizar user
    await prisma.user.update({
      where: { id: userId },
      data: { name: userName },
    });

    // Se o slug mudou, regenerar sessão com o novo slug
    if (slug !== tenantSlug) {
      await deleteSession();
      await createSession(userId, email, tenantId, slug, plan, role);
    }

    await logAudit(
      "TENANT_UPDATED",
      { companyName, slug, userName },
      userId,
      tenantId
    );
  } catch (error) {
    console.error(error);
    return { error: "Erro interno ao atualizar perfil." };
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

  // Não pode ser o mesmo email
  if (normalizedEmail === currentEmail.toLowerCase()) {
    return { error: "O novo email deve ser diferente do atual." };
  }

  // Verificar se o email já está em uso
  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });
  if (existingUser) {
    return { error: "Este email já está em uso por outra conta." };
  }

  // Rate limit
  const ip = (await headers()).get("x-forwarded-for") || "unknown";
  const rateKey = `email_change:${ip}`;
  const rateResult = await rateLimit(rateKey, RATE_LIMITS.OTP);
  if (!rateResult.allowed) {
    return { error: "Muitas tentativas. Aguarde antes de tentar novamente." };
  }

  // Gerar e armazenar OTP
  const otp = generateOTP();
  await storeOTP(`email_change:${normalizedEmail}`, otp);

  // Enviar email com OTP
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

  // Verificar OTP
  try {
    const isValid = await verifyOTP(`email_change:${normalizedEmail}`, otp);
    if (!isValid) {
      return { error: "Código inválido ou expirado." };
    }
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Erro ao verificar código.",
    };
  }

  // Atualizar email do usuário
  try {
    await prisma.user.update({
      where: { id: userId },
      data: { email: normalizedEmail },
    });

    // Regenerar sessão com o novo email
    await deleteSession();
    await createSession(userId, normalizedEmail, tenantId, tenantSlug, plan, role);

    await logAudit(
      "EMAIL_CHANGED",
      { newEmail: normalizedEmail },
      userId,
      tenantId
    );
  } catch (error) {
    console.error(error);
    return { error: "Erro interno ao atualizar email." };
  }

  revalidatePath("/admin/settings");
  return { success: true };
}

// ============================================================================
// MUDANÇA DE PLANO → Redireciona para página de checkout
// ============================================================================

const PlanChangeSchema = z.object({
  plan: z.enum(["FREE", "PRO", "ENTERPRISE"]),
});

export async function changePlanCheckoutAction(
  state: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { plan: currentPlan } = await requireAuth();

  const parsed = PlanChangeSchema.safeParse({
    plan: formData.get("plan"),
  });

  if (!parsed.success) {
    return { error: "Plano inválido." };
  }

  const { plan: targetPlan } = parsed.data;

  // Se for o mesmo plano, não faz nada
  if (targetPlan === currentPlan) {
    return { error: "Você já está neste plano." };
  }

  // Redirecionar para página de checkout
  redirect(`/admin/settings/checkout?plan=${targetPlan}`);
}