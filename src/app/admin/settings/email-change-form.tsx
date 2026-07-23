"use client";

import { useActionState, useState } from "react";
import {
  requestEmailChangeAction,
  verifyEmailChangeAction,
} from "./actions";

interface EmailChangeFormProps {
  currentEmail: string;
}

export function EmailChangeForm({ currentEmail }: EmailChangeFormProps) {
  const [step, setStep] = useState<"email" | "otp">("email");
  const [newEmail, setNewEmail] = useState("");

  const [requestState, requestAction, requestPending] = useActionState(
    requestEmailChangeAction,
    undefined
  );

  const [verifyState, verifyAction, verifyPending] = useActionState(
    verifyEmailChangeAction,
    undefined
  );

  // If request succeeded, move to OTP step
  if (requestState?.success && step === "email") {
    setStep("otp");
  }

  // If verify succeeded, show success
  if (verifyState?.success) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-card-foreground mb-1">
          E-mail de acesso
        </h2>
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-500 mt-4">
          E-mail alterado com sucesso! Sua sessão foi atualizada.
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-card-foreground mb-1">
        E-mail de acesso
      </h2>
      <p className="text-sm text-muted-foreground mb-6">
        Seu e-mail atual:{" "}
        <span className="font-medium text-foreground">{currentEmail}</span>
      </p>

      {step === "email" ? (
        <form action={requestAction} className="space-y-4">
          <div>
            <label
              htmlFor="newEmail"
              className="block text-sm font-medium text-foreground mb-1.5"
            >
              Novo e-mail
            </label>
            <input
              id="newEmail"
              name="newEmail"
              type="email"
              required
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className="block w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors duration-150"
              placeholder="novo@email.com"
            />
            {requestState?.fieldErrors?.newEmail && (
              <p className="mt-1 text-xs text-destructive">
                {requestState.fieldErrors.newEmail[0]}
              </p>
            )}
          </div>

          {requestState?.error && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {requestState.error}
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={requestPending}
              className="inline-flex items-center justify-center rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-all duration-150 hover:bg-primary/90 active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {requestPending ? "Enviando..." : "Alterar e-mail"}
            </button>
          </div>
        </form>
      ) : (
        <form action={verifyAction} className="space-y-4">
          <input type="hidden" name="newEmail" value={newEmail} />

          <div>
            <label
              htmlFor="otp"
              className="block text-sm font-medium text-foreground mb-1.5"
            >
              Código de verificação
            </label>
            <p className="text-xs text-muted-foreground mb-3">
              Enviamos um código de 6 dígitos para{" "}
              <span className="font-medium text-foreground">{newEmail}</span>.
              Verifique sua caixa de entrada.
            </p>
            <input
              id="otp"
              name="otp"
              type="text"
              required
              maxLength={6}
              pattern="[0-9]{6}"
              inputMode="numeric"
              autoComplete="one-time-code"
              className="block w-full max-w-[200px] rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground text-center tracking-[0.5em] font-mono focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors duration-150"
              placeholder="000000"
            />
            {verifyState?.fieldErrors?.otp && (
              <p className="mt-1 text-xs text-destructive">
                {verifyState.fieldErrors.otp[0]}
              </p>
            )}
          </div>

          {verifyState?.error && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {verifyState.error}
            </div>
          )}

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setStep("email")}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-150"
            >
              Voltar
            </button>
            <button
              type="submit"
              disabled={verifyPending}
              className="inline-flex items-center justify-center rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-all duration-150 hover:bg-primary/90 active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {verifyPending ? "Verificando..." : "Confirmar"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}