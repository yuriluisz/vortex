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

export async function sendOTPEmail(
  email: string,
  otp: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const fromEmail =
      process.env.RESEND_FROM_EMAIL || "Vórtex+ <onboarding@resend.dev>";

    await resend.emails.send({
      from: fromEmail,
      to: email,
      subject: "Seu código de verificação — Vórtex+",
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 24px; background: #0a0a0a; color: #e5e5e5; border-radius: 12px;">
          <h1 style="font-size: 24px; font-weight: 700; margin-bottom: 8px; color: #ffffff;">Vórtex+</h1>
          <p style="font-size: 14px; color: #a3a3a3; margin-bottom: 32px;">Painel Administrativo</p>
          <p style="font-size: 16px; margin-bottom: 24px;">Seu código de verificação 2FA:</p>
          <div style="background: #171717; border: 1px solid #262626; border-radius: 8px; padding: 20px; text-align: center; margin-bottom: 24px;">
            <span style="font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #ffffff;">${otp}</span>
          </div>
          <p style="font-size: 14px; color: #a3a3a3;">Este código expira em <strong>5 minutos</strong>.</p>
          <p style="font-size: 12px; color: #525252; margin-top: 32px;">Se você não solicitou este código, ignore este e-mail.</p>
        </div>
      `,
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
