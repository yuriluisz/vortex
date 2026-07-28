"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { loginAction, registerAction, verifyOTPAction } from "./actions";
import type { LoginState } from "./actions";
import { Loader2, Mail, ArrowRight, Building2, User } from "lucide-react";

export default function AdminLoginPage() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");

  // Toggle entre login e registro
  const [mode, setMode] = useState<"login" | "register">(
    tabParam === "register" ? "register" : "login"
  );

  // Login form
  const [loginState, loginFormAction, loginPending] = useActionState<
    LoginState,
    FormData
  >(loginAction, undefined);

  // Register form
  const [registerState, registerFormAction, registerPending] = useActionState<
    LoginState,
    FormData
  >(registerAction, undefined);

  // OTP verification
  const [otpState, otpFormAction, otpPending] = useActionState<
    LoginState,
    FormData
  >(verifyOTPAction, undefined);

  const otpInputRef = useRef<HTMLInputElement>(null);

  // Determinar o passo atual baseado no state
  const activeState = mode === "login" ? loginState : registerState;
  const isOTPStep = activeState?.step === "otp";
  const currentError = isOTPStep
    ? otpState?.error
    : activeState?.error;

  // Trocar automaticamente para registro se o login retornar step=register
  useEffect(() => {
    if (loginState?.step === "register" && loginState?.mode === "register") {
      setMode("register");
    }
  }, [loginState]);

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
          <Link href="/" className="inline-block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/Vortex Padrão.svg" alt="Vórtex+" className="h-10 mx-auto invert" />
          </Link>
          <p className="mt-2 text-sm text-muted-foreground">
            Painel Administrativo
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-border bg-card p-8 shadow-xl">
          {!isOTPStep ? (
            <>
              {/* Toggle Login / Registro */}
              <div className="flex mb-6 p-1 rounded-lg bg-muted">
                <button
                  type="button"
                  onClick={() => setMode("login")}
                  className={`flex-1 rounded-md py-2 text-sm font-medium transition-all ${
                    mode === "login"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Entrar
                </button>
                <button
                  type="button"
                  onClick={() => setMode("register")}
                  className={`flex-1 rounded-md py-2 text-sm font-medium transition-all ${
                    mode === "register"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Criar conta
                </button>
              </div>

              {mode === "login" ? (
                /* ===== LOGIN: EMAIL ===== */
                <form action={loginFormAction} className="space-y-6">
                  <div>
                    <h2 className="text-lg font-semibold text-card-foreground">
                      Acessar painel
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Insira seu e-mail para receber um código de verificação.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="login-email"
                      className="block text-sm font-medium text-foreground/80"
                    >
                      E-mail
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <input
                        id="login-email"
                        name="email"
                        type="email"
                        required
                        autoComplete="email"
                        placeholder="seu@email.com"
                        className="w-full rounded-lg border border-input bg-secondary pl-10 pr-4 py-3 text-sm text-foreground placeholder-muted-foreground outline-none transition-[border-color,box-shadow] duration-200 focus:border-ring focus:ring-2 focus:ring-ring/20"
                      />
                    </div>
                  </div>

                  {currentError && (
                    <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                      {currentError}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loginPending}
                    className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-md transition-all duration-200 hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loginPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Enviando código...
                      </>
                    ) : (
                      <>
                        Enviar código
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </form>
              ) : (
                /* ===== REGISTRO: DADOS DA CONTA ===== */
                <form action={registerFormAction} className="space-y-5">
                  <div>
                    <h2 className="text-lg font-semibold text-card-foreground">
                      Criar nova conta
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Preencha os dados para criar seu ambiente.
                    </p>
                  </div>

                  {/* Nome */}
                  <div className="space-y-2">
                    <label
                      htmlFor="reg-name"
                      className="block text-sm font-medium text-foreground/80"
                    >
                      Seu nome
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <input
                        id="reg-name"
                        name="name"
                        type="text"
                        required
                        defaultValue={registerState?.name || ""}
                        placeholder="Ex: João Silva"
                        className="w-full rounded-lg border border-input bg-secondary pl-10 pr-4 py-3 text-sm text-foreground placeholder-muted-foreground outline-none transition-all duration-200 focus:border-ring focus:ring-2 focus:ring-ring/20"
                      />
                    </div>
                  </div>

                  {/* E-mail */}
                  <div className="space-y-2">
                    <label
                      htmlFor="reg-email"
                      className="block text-sm font-medium text-foreground/80"
                    >
                      Seu e-mail
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <input
                        id="reg-email"
                        name="email"
                        type="email"
                        required
                        autoComplete="email"
                        defaultValue={registerState?.email || ""}
                        placeholder="joao@minhaempresa.com"
                        className="w-full rounded-lg border border-input bg-secondary pl-10 pr-4 py-3 text-sm text-foreground placeholder-muted-foreground outline-none transition-all duration-200 focus:border-ring focus:ring-2 focus:ring-ring/20"
                      />
                    </div>
                  </div>

                  {/* Nome da Empresa */}
                  <div className="space-y-2">
                    <label
                      htmlFor="reg-tenant"
                      className="block text-sm font-medium text-foreground/80"
                    >
                      Nome da empresa
                    </label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <input
                        id="reg-tenant"
                        name="tenantName"
                        type="text"
                        required
                        defaultValue={registerState?.tenantName || ""}
                        placeholder="Ex: Minha Empresa"
                        className="w-full rounded-lg border border-input bg-secondary pl-10 pr-4 py-3 text-sm text-foreground placeholder-muted-foreground outline-none transition-all duration-200 focus:border-ring focus:ring-2 focus:ring-ring/20"
                      />
                    </div>
                  </div>

                  {currentError && (
                    <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                      {currentError}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={registerPending}
                    className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-md transition-all duration-200 hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {registerPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Criando conta...
                      </>
                    ) : (
                      "Criar conta gratuita"
                    )}
                  </button>
                </form>
              )}
            </>
          ) : (
            /* ===== VERIFICAÇÃO OTP ===== */
            <form action={otpFormAction} className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-card-foreground">
                  Verificação
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Insira o código de 6 dígitos enviado para{" "}
                  <span className="font-medium text-foreground">
                    {activeState?.email}
                  </span>
                </p>
              </div>

              {/* Email hidden */}
              <input type="hidden" name="email" value={activeState?.email || ""} />

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

              {otpState?.error && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {otpState.error}
                </div>
              )}

              <p className="text-xs text-muted-foreground">
                O código expira em 5 minutos.
              </p>

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
        <div className="mt-6 flex justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/Vortex Padrão.svg" alt="Vórtex+" className="h-4 w-auto invert opacity-60" />
        </div>
      </div>
    </div>
  );
}