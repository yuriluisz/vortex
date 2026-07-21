"use client";

import { useActionState, useEffect, useRef } from "react";
import { loginAction, verifyOTPAction } from "./actions";
import type { LoginState } from "./actions";
import { Loader2 } from "lucide-react";

export default function AdminLoginPage() {
  const [loginState, loginFormAction, loginPending] = useActionState<
    LoginState,
    FormData
  >(loginAction, undefined);

  const [otpState, otpFormAction, otpPending] = useActionState<
    LoginState,
    FormData
  >(verifyOTPAction, undefined);

  const otpInputRef = useRef<HTMLInputElement>(null);

  // Determinar o passo atual
  const isOTPStep = loginState?.step === "otp";
  const currentError = isOTPStep
    ? otpState?.error
    : loginState?.error;

  // Auto-focus no input OTP quando transicionar
  useEffect(() => {
    if (isOTPStep && otpInputRef.current) {
      otpInputRef.current.focus();
    }
  }, [isOTPStep]);

  return (
    <div className="flex min-h-screen items-center justify-center px-4 bg-background">
      {/* Background gradient */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-1/4 -top-1/4 h-[600px] w-[600px] rounded-full bg-primary/15 blur-[128px]" />
        <div className="absolute -bottom-1/4 -right-1/4 h-[600px] w-[600px] rounded-full bg-accent/20 blur-[128px]" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight">
            <span className="text-primary">
              Vórtex+
            </span>
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Painel Administrativo
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-border bg-card p-8 shadow-xl">
          {!isOTPStep ? (
            /* ===== FORMULÁRIO DE CREDENCIAIS ===== */
            <form action={loginFormAction} className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-card-foreground">
                  Acessar painel
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Insira suas credenciais de administrador.
                </p>
              </div>

              {/* E-mail */}
              <div className="space-y-2">
                <label
                  htmlFor="login-email"
                  className="block text-sm font-medium text-foreground/80"
                >
                  E-mail
                </label>
                <input
                  id="login-email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="admin@vortex.com.br"
                  className="w-full rounded-lg border border-input bg-secondary px-4 py-3 text-sm text-foreground placeholder-muted-foreground outline-none transition-all duration-200 focus:border-ring focus:ring-2 focus:ring-ring/20"
                />
              </div>

              {/* Senha */}
              <div className="space-y-2">
                <label
                  htmlFor="login-password"
                  className="block text-sm font-medium text-foreground/80"
                >
                  Senha
                </label>
                <input
                  id="login-password"
                  name="password"
                  type="password"
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-input bg-secondary px-4 py-3 text-sm text-foreground placeholder-muted-foreground outline-none transition-all duration-200 focus:border-ring focus:ring-2 focus:ring-ring/20"
                />
              </div>

              {/* Erro */}
              {currentError && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {currentError}
                </div>
              )}

              {/* Botão */}
              <button
                type="submit"
                disabled={loginPending}
                className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-md transition-all duration-200 hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loginPending ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Verificando...
                  </span>
                ) : (
                  "Entrar"
                )}
              </button>
            </form>
          ) : (
            /* ===== FORMULÁRIO DE OTP ===== */
            <form action={otpFormAction} className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-card-foreground">
                  Verificação 2FA
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Insira o código de 6 dígitos enviado para{" "}
                  <span className="font-medium text-foreground">
                    {loginState?.email}
                  </span>
                </p>
              </div>

              {/* Email hidden */}
              <input type="hidden" name="email" value={loginState?.email || ""} />

              {/* OTP Input */}
              <div className="space-y-2">
                <label
                  htmlFor="otp-code"
                  className="block text-sm font-medium text-foreground/80"
                >
                  Código de verificação
                </label>
                <input
                  ref={otpInputRef}
                  id="otp-code"
                  name="otp"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  required
                  autoComplete="one-time-code"
                  placeholder="000000"
                  className="w-full rounded-lg border border-input bg-secondary px-4 py-3 text-center text-2xl font-bold tracking-[0.5em] text-foreground placeholder-muted-foreground outline-none transition-all duration-200 focus:border-ring focus:ring-2 focus:ring-ring/20 font-mono"
                />
              </div>

              {/* Erro */}
              {otpState?.error && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {otpState.error}
                </div>
              )}

              {/* Info */}
              <p className="text-xs text-muted-foreground">
                O código expira em 5 minutos.
              </p>

              {/* Botão */}
              <button
                type="submit"
                disabled={otpPending}
                className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-md transition-all duration-200 hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {otpPending ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Verificando...
                  </span>
                ) : (
                  "Verificar código"
                )}
              </button>
            </form>
          )}
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-muted-foreground/60">
          Vórtex+ — Gerenciador de Lançamentos
        </p>
      </div>
    </div>
  );
}
