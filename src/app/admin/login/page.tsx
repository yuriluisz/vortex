"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { loginAction, registerAction, verifyOTPAction } from "./actions";
import type { LoginState } from "./actions";
import { Loader2, Mail, ArrowRight, Building2, User } from "lucide-react";

export default function AdminLoginPage() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const planParam = searchParams.get("plan");
  const modeParam = searchParams.get("mode");

  // Toggle entre login e registro
  const [mode, setMode] = useState<"login" | "register">(
    tabParam === "register" || modeParam === "register" ? "register" : "login"
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
  const [prevLoginState, setPrevLoginState] = useState(loginState);
  if (loginState !== prevLoginState) {
    setPrevLoginState(loginState);
    if (loginState?.step === "register" && loginState?.mode === "register") {
      setMode("register");
    }
  }

  useEffect(() => {
    if (isOTPStep && otpInputRef.current) {
      otpInputRef.current.focus();
    }
  }, [isOTPStep]);

  return (
    <div className="flex min-h-screen items-center justify-center px-4 bg-black text-white relative overflow-hidden">
      {/* Background global effects */}
      <div className="pointer-events-none absolute inset-0 z-0">
        <div className="absolute -left-1/4 -top-1/4 h-[800px] w-[800px] rounded-full bg-primary/20 blur-[128px]" />
        <div className="absolute -bottom-1/4 -right-1/4 h-[800px] w-[800px] rounded-full bg-accent/20 blur-[128px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[100vw] h-[100vh] bg-[url('/noise.png')] opacity-[0.03] pointer-events-none mix-blend-overlay"></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="mb-10 text-center animate-fade-in-up" style={{ animationDelay: "100ms" }}>
          <Link href="/" className="inline-block relative">
            <Image
              src="/Vortex Padrão.svg"
              alt="Vórtex+"
              width={196}
              height={40}
              priority
              className="h-10 w-auto mx-auto invert drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]"
            />
          </Link>
          <p className="mt-3 text-sm text-neutral-400">
            Painel Administrativo
          </p>
        </div>

        {/* Card */}
        <div className="glass-panel rounded-2xl p-8 animate-fade-in-up" style={{ animationDelay: "200ms" }}>
          {!isOTPStep ? (
            <>
              {/* Toggle Login / Registro */}
              <div className="flex mb-8 p-1 rounded-xl bg-black/40 border border-white/10 backdrop-blur-md">
                <button
                  type="button"
                  onClick={() => setMode("login")}
                  className={`flex-1 rounded-lg py-2.5 text-sm font-semibold transition-all duration-300 ${
                    mode === "login"
                      ? "bg-primary/20 text-primary shadow-[0_0_10px_rgba(var(--primary),0.3)] border border-primary/30"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Entrar
                </button>
                <button
                  type="button"
                  onClick={() => setMode("register")}
                  className={`flex-1 rounded-lg py-2.5 text-sm font-semibold transition-all duration-300 ${
                    mode === "register"
                      ? "bg-primary/20 text-primary shadow-[0_0_10px_rgba(var(--primary),0.3)] border border-primary/30"
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
                    <h2 className="text-xl font-bold text-foreground">
                      Acessar painel
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                      Insira seu e-mail para receber um código de acesso.
                    </p>
                  </div>

                  <div className="space-y-2.5">
                    <label
                      htmlFor="login-email"
                      className="block text-sm font-medium text-foreground/90"
                    >
                      E-mail
                    </label>
                    <div className="relative group">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                      <input
                        id="login-email"
                        name="email"
                        type="email"
                        required
                        autoComplete="email"
                        placeholder="seu@email.com"
                        className="w-full rounded-xl border border-white/10 bg-black/50 pl-10 pr-4 py-3.5 text-sm text-foreground placeholder-muted-foreground outline-none transition-all duration-300 focus:border-primary focus:ring-4 focus:ring-primary/20 focus:bg-black/70 backdrop-blur-md"
                      />
                    </div>
                  </div>

                  {currentError && (
                    <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive font-medium">
                      {currentError}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loginPending}
                    className="w-full rounded-xl bg-primary px-4 py-3.5 text-sm font-bold text-primary-foreground shadow-[0_0_20px_rgba(var(--primary),0.4)] transition-all duration-300 hover:bg-primary/90 hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(var(--primary),0.6)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2"
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
                    <h2 className="text-xl font-bold text-foreground">
                      Criar nova conta
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                      Preencha os dados para criar seu ambiente.
                    </p>
                  </div>

                  {/* Intent for checkout */}
                  {planParam && <input type="hidden" name="plan" value={planParam} />}

                  {/* Nome */}
                  <div className="space-y-2">
                    <label
                      htmlFor="reg-name"
                      className="block text-sm font-medium text-foreground/90"
                    >
                      Seu nome
                    </label>
                    <div className="relative group">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                      <input
                        id="reg-name"
                        name="name"
                        type="text"
                        required
                        defaultValue={registerState?.name || ""}
                        placeholder="Ex: João Silva"
                        className="w-full rounded-xl border border-white/10 bg-black/50 pl-10 pr-4 py-3 text-sm text-foreground placeholder-muted-foreground outline-none transition-all duration-300 focus:border-primary focus:ring-4 focus:ring-primary/20 focus:bg-black/70 backdrop-blur-md"
                      />
                    </div>
                  </div>

                  {/* E-mail */}
                  <div className="space-y-2">
                    <label
                      htmlFor="reg-email"
                      className="block text-sm font-medium text-foreground/90"
                    >
                      Seu e-mail
                    </label>
                    <div className="relative group">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                      <input
                        id="reg-email"
                        name="email"
                        type="email"
                        required
                        autoComplete="email"
                        defaultValue={registerState?.email || ""}
                        placeholder="joao@minhaempresa.com"
                        className="w-full rounded-xl border border-white/10 bg-black/50 pl-10 pr-4 py-3 text-sm text-foreground placeholder-muted-foreground outline-none transition-all duration-300 focus:border-primary focus:ring-4 focus:ring-primary/20 focus:bg-black/70 backdrop-blur-md"
                      />
                    </div>
                  </div>

                  {/* Nome da Empresa */}
                  <div className="space-y-2">
                    <label
                      htmlFor="reg-tenant"
                      className="block text-sm font-medium text-foreground/90"
                    >
                      Nome da empresa
                    </label>
                    <div className="relative group">
                      <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                      <input
                        id="reg-tenant"
                        name="tenantName"
                        type="text"
                        required
                        defaultValue={registerState?.tenantName || ""}
                        placeholder="Ex: Minha Empresa"
                        className="w-full rounded-xl border border-white/10 bg-black/50 pl-10 pr-4 py-3 text-sm text-foreground placeholder-muted-foreground outline-none transition-all duration-300 focus:border-primary focus:ring-4 focus:ring-primary/20 focus:bg-black/70 backdrop-blur-md"
                      />
                    </div>
                  </div>

                  {currentError && (
                    <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive font-medium">
                      {currentError}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={registerPending}
                    className="w-full rounded-xl bg-primary px-4 py-3.5 text-sm font-bold text-primary-foreground shadow-[0_0_20px_rgba(var(--primary),0.4)] transition-all duration-300 hover:bg-primary/90 hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(var(--primary),0.6)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2 mt-2"
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
                <h2 className="text-xl font-bold text-foreground">
                  Verificação
                </h2>
                <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                  Insira o código de 6 dígitos enviado para{" "}
                  <span className="font-medium text-foreground">
                    {activeState?.email}
                  </span>
                </p>
              </div>

              {/* Email and Plan hidden */}
              <input type="hidden" name="email" value={activeState?.email || ""} />
              {planParam && <input type="hidden" name="plan" value={planParam} />}

              {/* OTP Input */}
              <div className="space-y-2">
                <label
                  htmlFor="otp-code"
                  className="block text-sm font-medium text-foreground/90"
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
                  className="w-full rounded-xl border border-white/10 bg-black/50 px-4 py-4 text-center text-3xl font-bold tracking-[0.5em] text-foreground placeholder-muted-foreground/30 outline-none transition-all duration-300 focus:border-primary focus:ring-4 focus:ring-primary/20 focus:bg-black/70 backdrop-blur-md font-mono"
                />
              </div>

              {otpState?.error && (
                <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive font-medium">
                  {otpState.error}
                </div>
              )}

              <p className="text-xs text-muted-foreground text-center">
                O código expira em 5 minutos.
              </p>

              <button
                type="submit"
                disabled={otpPending}
                className="w-full rounded-xl bg-primary px-4 py-3.5 text-sm font-bold text-primary-foreground shadow-[0_0_20px_rgba(var(--primary),0.4)] transition-all duration-300 hover:bg-primary/90 hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(var(--primary),0.6)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
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
      </div>
    </div>
  );
}