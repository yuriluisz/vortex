import "server-only";

import { redis } from "@/lib/redis";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/notifications";
import { renderVortexEmail, renderEmailOtpBox } from "@/lib/email-template";

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
    const otpBox = renderEmailOtpBox(otp, 5);

    const html = renderVortexEmail({
      title: "Seu Código de Acesso",
      category: "Segurança de Acesso",
      badgeType: "primary",
      bodyHtml: `
        <p style="margin: 0 0 16px; color: #d1d5db;">
          Utilize o código de segurança abaixo para confirmar sua identidade e acessar a plataforma:
        </p>
        ${otpBox}
        <p style="margin: 0; color: #94a3b8; font-size: 13px; text-align: center;">
          Se você não solicitou este código, ignore esta mensagem com segurança.
        </p>
      `,
      footerNote: "Nunca compartilhe este código com ninguém. A equipe do Vórtex+ nunca solicitará sua senha ou código por chat.",
    });

    return await sendEmail({
      to: email,
      subject: "Seu código de verificação — Vórtex+",
      html,
    });
  } catch (error) {
    console.error("Failed to send OTP email:", error);
    return {
      success: false,
      error: "Falha ao enviar e-mail de verificação.",
    };
  }
}

