import "server-only";

import { redis } from "@/lib/redis";
import { Resend } from "resend";
import { prisma } from "@/lib/prisma";

const resend = new Resend(process.env.RESEND_API_KEY);

const OTP_TTL_SECONDS = 300; // 5 minutos
const OTP_KEY_PREFIX = "auth:otp:";
const OTP_RATE_LIMIT_PREFIX = "auth:otp_rate:";
const MAX_OTP_ATTEMPTS = 3;

// ============================================================================
// BUSCA TENANT DO USUÁRIO (simplificado: User.tenantId direto)
// ============================================================================

export async function getUserTenant(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      tenantId: true,
      role: true,
      tenant: { select: { id: true, name: true, slug: true, plan: true, active: true } },
    },
  });

  if (!user?.tenant) return null;

  // 🔒 S1: Bloquear login se o tenant estiver inativo (desativado pelo super admin)
  if (!user.tenant.active) return null;

  return {
    tenantId: user.tenant.id,
    tenantName: user.tenant.name,
    tenantSlug: user.tenant.slug,
    plan: user.tenant.plan,
    role: user.role,
  };
}

// ============================================================================
// OTP (Autenticação de Dois Fatores)
// ============================================================================

export function generateOTP(): string {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  const otp = (array[0] % 900000 + 100000).toString();
  return otp;
}

export async function storeOTP(email: string, otp: string): Promise<void> {
  const key = `${OTP_KEY_PREFIX}${email.toLowerCase()}`;
  await redis.set(key, otp, "EX", OTP_TTL_SECONDS);
}

export async function verifyOTP(
  email: string,
  otp: string
): Promise<boolean> {
  const key = `${OTP_KEY_PREFIX}${email.toLowerCase()}`;
  const rateKey = `${OTP_RATE_LIMIT_PREFIX}${email.toLowerCase()}`;

  const attempts = await redis.incr(rateKey);
  if (attempts === 1) {
    await redis.expire(rateKey, OTP_TTL_SECONDS);
  }
  if (attempts > MAX_OTP_ATTEMPTS) {
    throw new Error("Muitas tentativas. Aguarde 5 minutos.");
  }

  const storedOTP = await redis.get(key);

  if (!storedOTP || storedOTP !== otp) {
    return false;
  }

  await redis.del(key);
  await redis.del(rateKey);
  return true;
}

import { renderVortexEmail } from "@/lib/email-template";

export async function sendOTPEmail(
  email: string,
  otp: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const fromEmail =
      process.env.RESEND_FROM_EMAIL || "Vórtex+ <onboarding@resend.dev>";

    const html = renderVortexEmail({
      title: "Seu Código de Verificação 2FA",
      category: "Segurança de Acesso",
      badgeType: "primary",
      bodyHtml: `
        <p style="margin: 0 0 16px; color: #d1d5db;">
          Utilize o código de segurança abaixo para confirmar sua identidade e acessar o painel administrativo:
        </p>
        <div style="background: #111827; border: 1px solid #374151; border-radius: 12px; padding: 24px; text-align: center; margin: 20px 0;">
          <span class="code-block" style="font-size: 38px; font-weight: 800; letter-spacing: 10px; color: #ffffff; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;">${otp}</span>
        </div>
        <p style="margin: 0; color: #9ca3af; font-size: 14px;">
          ⏱️ Este código expira em <strong>5 minutos</strong> e é de uso único.
        </p>
      `,
      footerNote: "Nunca compartilhe este código com ninguém. Se você não solicitou este acesso, sua senha pode estar segura, mas recomendamos verificar sua conta.",
    });

    await resend.emails.send({
      from: fromEmail,
      to: email,
      subject: "Seu código de verificação — Vórtex+",
      html,
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to send OTP email:", error);
    return {
      success: false,
      error: "Falha ao enviar e-mail de verificação.",
    };
  }
}

