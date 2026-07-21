"use server";

import { z } from "zod";
import {
  validateCredentials,
  generateOTP,
  storeOTP,
  verifyOTP,
  sendOTPEmail,
} from "@/lib/auth";
import { createSession } from "@/lib/session";
import { redirect } from "next/navigation";

// Schemas de validação
const LoginSchema = z.object({
  email: z.string().email("E-mail inválido."),
  password: z.string().min(1, "Senha obrigatória."),
});

const OTPSchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6, "O código deve ter 6 dígitos."),
});

// Tipos de estado do formulário
export type LoginState = {
  step: "credentials" | "otp";
  email?: string;
  error?: string;
} | undefined;

/**
 * Server Action: Login (Passo 1 — credenciais)
 * Valida email/senha, gera OTP, envia por e-mail.
 */
export async function loginAction(
  state: LoginState,
  formData: FormData
): Promise<LoginState> {
  const parsed = LoginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      step: "credentials",
      error: parsed.error.issues[0]?.message || "Dados inválidos.",
    };
  }

  const { email, password } = parsed.data;

  // Validar credenciais
  const isValid = await validateCredentials(email, password);
  if (!isValid) {
    return {
      step: "credentials",
      error: "Credenciais inválidas.",
    };
  }

  // Gerar e armazenar OTP
  const otp = generateOTP();
  await storeOTP(email, otp);

  // Enviar OTP por e-mail
  const emailResult = await sendOTPEmail(email, otp);
  if (!emailResult.success) {
    return {
      step: "credentials",
      error: emailResult.error || "Falha ao enviar código de verificação.",
    };
  }

  return {
    step: "otp",
    email,
  };
}

/**
 * Server Action: Verificar OTP (Passo 2 — 2FA)
 * Valida o OTP no Redis, cria sessão JWT se correto.
 */
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
      email: formData.get("email") as string,
      error: parsed.error.issues[0]?.message || "Código inválido.",
    };
  }

  const { email, otp } = parsed.data;

  // Verificar OTP no Redis
  const isValid = await verifyOTP(email, otp);
  if (!isValid) {
    return {
      step: "otp",
      email,
      error: "Código inválido ou expirado.",
    };
  }

  // Criar sessão JWT e setar cookie
  await createSession(email);

  // Redirecionar para o painel admin
  redirect("/admin");
}
