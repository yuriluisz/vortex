import "server-only";

import bcrypt from "bcryptjs";
import { redis } from "@/lib/redis";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const OTP_TTL_SECONDS = 300; // 5 minutos
const OTP_KEY_PREFIX = "admin:otp:";

/**
 * Valida as credenciais do admin contra as variáveis de ambiente.
 * Compara email exato e senha via bcrypt hash.
 */
export async function validateCredentials(
  email: string,
  password: string
): Promise<boolean> {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH;

  console.log("DEBUG: ADMIN_EMAIL =", adminEmail);
  console.log("DEBUG: ADMIN_PASSWORD_HASH =", adminPasswordHash);

  if (!adminEmail || !adminPasswordHash) {
    console.error("ADMIN_EMAIL or ADMIN_PASSWORD_HASH not configured");
    return false;
  }

  if (email.toLowerCase() !== adminEmail.toLowerCase()) {
    return false;
  }

  return bcrypt.compare(password, adminPasswordHash);
}

/**
 * Gera um código OTP de 6 dígitos aleatórios.
 */
export function generateOTP(): string {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  return otp;
}

/**
 * Salva o OTP no Redis com TTL de 5 minutos.
 * Chave: admin:otp:{email}
 */
export async function storeOTP(email: string, otp: string): Promise<void> {
  const key = `${OTP_KEY_PREFIX}${email.toLowerCase()}`;
  await redis.set(key, otp, "EX", OTP_TTL_SECONDS);
}

/**
 * Verifica o OTP no Redis.
 * Se válido, deleta a chave (uso único) e retorna true.
 */
export async function verifyOTP(
  email: string,
  otp: string
): Promise<boolean> {
  const key = `${OTP_KEY_PREFIX}${email.toLowerCase()}`;
  const storedOTP = await redis.get(key);

  if (!storedOTP || storedOTP !== otp) {
    return false;
  }

  // OTP consumido — deletar do Redis
  await redis.del(key);
  return true;
}

/**
 * Envia o OTP por e-mail via Resend.
 */
export async function sendOTPEmail(
  email: string,
  otp: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const fromEmail = process.env.RESEND_FROM_EMAIL || "Vórtex+ <onboarding@resend.dev>";
    
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
