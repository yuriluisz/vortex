"use server";

import { z } from "zod";
import {
  generateOTP,
  storeOTP,
  verifyOTP,
  sendOTPEmail,
  getUserTenant,
} from "@/lib/auth";
import { createSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { logAudit } from "@/lib/audit";
import { rateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";

// ============================================================================
// SCHEMAS
// ============================================================================
const EmailSchema = z.object({
  email: z.string().email("E-mail inválido."),
});

const OTPSchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6, "O código deve ter 6 dígitos."),
});

const RegisterSchema = z.object({
  name: z.string().min(1, "Seu nome é obrigatório."),
  email: z.string().email("E-mail inválido."),
  tenantName: z.string().min(1, "O nome da empresa é obrigatório."),
  subdomain: z
    .string()
    .min(3, "O subdomínio deve ter no mínimo 3 caracteres.")
    .regex(
      /^[a-z0-9-]+$/,
      "Apenas letras minúsculas, números e hífens."
    ),
});

// ============================================================================
// TYPES
// ============================================================================
export type LoginState = {
  step: "email" | "register" | "otp";
  mode: "login" | "register";
  email?: string;
  error?: string;
} | undefined;

// ============================================================================
// PASSO 1: LOGIN — Enviar OTP
// ============================================================================
export async function loginAction(
  state: LoginState,
  formData: FormData
): Promise<LoginState> {
  const headersList = await headers();
  const ip =
    headersList.get("x-forwarded-for") ||
    headersList.get("cf-connecting-ip") ||
    "unknown";
  const rateKey = `login:ip:${ip}`;
  const rateResult = await rateLimit(rateKey, RATE_LIMITS.LOGIN);

  if (!rateResult.allowed) {
    return {
      step: "email",
      mode: "login",
      error: "Muitas tentativas. Aguarde 1 minuto antes de tentar novamente.",
    };
  }

  const parsed = EmailSchema.safeParse({
    email: formData.get("email"),
  });

  if (!parsed.success) {
    return {
      step: "email",
      mode: "login",
      error: parsed.error.issues[0]?.message || "E-mail inválido.",
    };
  }

  const { email } = parsed.data;
  const normalizedEmail = email.toLowerCase();

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: { id: true, email: true },
  });

  // 🔒 S2: Anti-enumeration — sempre responder a mesma mensagem
  // Se o email não existir, ainda geramos OTP (mas não enviamos)
  // para não vazar se o email existe ou não.
  if (!user) {
    // Gera OTP mesmo para email inexistente para evitar timing attack
    const fakeOtp = generateOTP();
    await storeOTP(normalizedEmail, fakeOtp);

    return {
      step: "otp",
      mode: "login",
      email: normalizedEmail,
    };
  }

  // 🔒 S3: Rate limit por email — no máximo 1 OTP a cada 60s
  const otpRateKey = `otp:send:${normalizedEmail}`;
  const otpRateResult = await rateLimit(otpRateKey, { windowSeconds: 60, maxRequests: 1 });
  if (!otpRateResult.allowed) {
    return {
      step: "email",
      mode: "login",
      error: "Aguarde 1 minuto antes de solicitar um novo código.",
    };
  }

  const otp = generateOTP();
  await storeOTP(normalizedEmail, otp);

  const emailResult = await sendOTPEmail(normalizedEmail, otp);
  if (!emailResult.success) {
    return {
      step: "email",
      mode: "login",
      error: emailResult.error || "Falha ao enviar código de verificação.",
    };
  }

  await logAudit("OTP_SENT", { email: normalizedEmail }, user.id);

  return {
    step: "otp",
    mode: "login",
    email: normalizedEmail,
  };
}

// ============================================================================
// PASSO 1 (alt): REGISTRO — Criar tenant + user + enviar OTP
// ============================================================================
export async function registerAction(
  state: LoginState,
  formData: FormData
): Promise<LoginState> {
  const headersList = await headers();
  const ip =
    headersList.get("x-forwarded-for") ||
    headersList.get("cf-connecting-ip") ||
    "unknown";
  const rateKey = `register:ip:${ip}`;
  const rateResult = await rateLimit(rateKey, RATE_LIMITS.TENANT_CREATION);

  if (!rateResult.allowed) {
    return {
      step: "register",
      mode: "register",
      error: "Muitas tentativas. Aguarde 1 hora antes de criar outra conta.",
    };
  }

  const parsed = RegisterSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    tenantName: formData.get("tenantName"),
    subdomain: formData.get("subdomain"),
  });

  if (!parsed.success) {
    return {
      step: "register",
      mode: "register",
      error: parsed.error.issues[0]?.message || "Verifique os campos.",
    };
  }

  const { name, email, tenantName, subdomain } = parsed.data;
  const normalizedEmail = email.toLowerCase();

  // Verificar email único
  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });
  if (existingUser) {
    return {
      step: "register",
      mode: "register",
      error: "Este e-mail já está cadastrado. Faça login em vez disso.",
    };
  }

  // Verificar subdomínio único
  const existingTenant = await prisma.tenant.findUnique({
    where: { slug: subdomain },
  });
  if (existingTenant) {
    return {
      step: "register",
      mode: "register",
      error: "Este subdomínio já está em uso. Escolha outro.",
    };
  }

  try {
    await prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          name: tenantName,
          slug: subdomain,
          plan: "FREE",
          maxCampaigns: 1,
          maxGroups: 3,
          maxLeads: 100,
          trialEndsAt: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 dias a partir de agora
        },
      });

      // User ganha tenantId direto — sem tabela intermediária
      const user = await tx.user.create({
        data: {
          email: normalizedEmail,
          name,
          passwordHash: "",
          tenantId: tenant.id,
          role: "ADMIN",
        },
      });

      await logAudit(
        "TENANT_CREATED",
        { tenantName, tenantSlug: subdomain, plan: "FREE" },
        user.id,
        tenant.id
      );

      // Gerar e enviar OTP automaticamente
      const otp = generateOTP();
      await storeOTP(normalizedEmail, otp);
      const emailResult = await sendOTPEmail(normalizedEmail, otp);
      if (!emailResult.success) {
        console.warn("Failed to send OTP after registration:", emailResult.error);
      }
    });

    return {
      step: "otp",
      mode: "register",
      email: normalizedEmail,
    };
  } catch (error) {
    console.error("Error in registration:", error);
    return {
      step: "register",
      mode: "register",
      error: "Erro interno ao criar conta. Tente novamente.",
    };
  }
}

// ============================================================================
// PASSO 2: Verificar OTP e criar sessão
// ============================================================================
export async function verifyOTPAction(
  state: LoginState,
  formData: FormData
): Promise<LoginState> {
  const parsed = OTPSchema.safeParse({
    email: formData.get("email"),
    otp: formData.get("otp"),
  });

  if (!parsed.success) {
    return {
      step: "otp",
      mode: state?.mode || "login",
      email: formData.get("email") as string,
      error: parsed.error.issues[0]?.message || "Código inválido.",
    };
  }

  const { email, otp } = parsed.data;

  let isValid: boolean;
  try {
    isValid = await verifyOTP(email, otp);
  } catch (error) {
    return {
      step: "otp",
      mode: state?.mode || "login",
      email,
      error: (error as Error).message || "Erro ao verificar código.",
    };
  }

  if (!isValid) {
    return {
      step: "otp",
      mode: state?.mode || "login",
      email,
      error: "Código inválido ou expirado.",
    };
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, name: true },
  });

  if (!user) {
    return {
      step: "email",
      mode: "login",
      error: "Usuário não encontrado.",
    };
  }

  // Usa getUserTenant (simplificado — User.tenantId direto)
  const tenant = await getUserTenant(user.id);
  if (!tenant) {
    return {
      step: "email",
      mode: "login",
      error: "Você não possui acesso a nenhum tenant.",
    };
  }

  await logAudit("OTP_VERIFIED", { email }, user.id);

  await createSession(
    user.id,
    email,
    tenant.tenantId,
    tenant.tenantSlug,
    tenant.plan,
    tenant.role
  );

  await logAudit(
    "LOGIN",
    { email, tenantId: tenant.tenantId },
    user.id,
    tenant.tenantId
  );

  redirect("/admin");
}