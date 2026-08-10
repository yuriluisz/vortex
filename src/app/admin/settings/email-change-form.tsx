"use client";

import { useActionState, useState } from "react";
import { Loader2, CheckCircle2, AlertCircle, Mail, Shield } from "lucide-react";
import { updateUserNameAction, requestEmailChangeAction, verifyEmailChangeAction } from "./actions";
import { FieldTooltip } from "@/components/admin/field-tooltip";

interface AccountFormProps {
  currentEmail: string;
  userName: string;
}

export function AccountForm({ currentEmail, userName }: AccountFormProps) {
  return (
    <div className="space-y-8">
      <UserNameSection userName={userName} />
      <EmailChangeForm currentEmail={currentEmail} />
    </div>
  );
}

// ============================================================================
// NOME DO USUÁRIO
// ============================================================================

function UserNameSection({ userName }: { userName: string }) {
  const [state, formAction, pending] = useActionState(updateUserNameAction, undefined);

  return (
    <div className="glass-panel rounded-xl p-6 shadow-sm relative overflow-hidden">
      <h2 className="text-lg font-semibold text-card-foreground mb-1">
        Dados pessoais
      </h2>
      <p className="text-sm text-muted-foreground mb-6">
        Seu nome de exibição no painel.
      </p>

      <form action={formAction} className="space-y-4">
        <div>
          <label htmlFor="userName" className="block text-sm font-medium text-foreground mb-1.5 flex items-center">
            Seu nome
            <FieldTooltip tooltip="Seu nome de exibição no painel. Visível apenas para você." docsAnchor="conta" />
          </label>
          <input
            id="userName"
            name="userName"
            type="text"
            defaultValue={userName}
            required
            className="block w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors duration-150"
            placeholder="João Silva"
          />
        </div>

        {state?.error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {state.error}
          </div>
        )}
        {state?.success && (
          <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-500">
            Nome atualizado com sucesso!
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={pending}
            className="inline-flex items-center justify-center rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {pending ? "Salvando..." : "Salvar nome"}
          </button>
        </div>
      </form>
    </div>
  );
}

// ============================================================================
// ALTERAÇÃO DE EMAIL (com OTP)
// ============================================================================

function EmailChangeForm({ currentEmail }: { currentEmail: string }) {
  const [step, setStep] = useState<"idle" | "verify">("idle");
  const [newEmail, setNewEmail] = useState("");

  const [requestState, requestAction, requestPending] = useActionState(
    requestEmailChangeAction,
    undefined
  );

  const [verifyState, verifyAction, verifyPending] = useActionState(
    verifyEmailChangeAction,
    undefined
  );

  // Após envio do OTP, ir para verificação
  if (requestState?.success && step === "idle") {
    setStep("verify");
  }

  return (
    <div className="glass-panel rounded-xl p-6 shadow-sm relative overflow-hidden">
      <div className="flex items-center gap-2 mb-1">
        <Shield className="h-5 w-5 text-muted-foreground" />
        <h2 className="text-lg font-semibold text-card-foreground">
          Segurança
        </h2>
      </div>
      <p className="text-sm text-muted-foreground mb-6">
        Gerencie seu email de acesso. Uma verificação por código será enviada ao novo email.
      </p>

      {/* Email atual */}
      <div className="mb-6 rounded-lg border border-border bg-muted/30 px-4 py-3">
        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Email atual:</span>
          <span className="text-sm font-medium text-foreground">{currentEmail}</span>
        </div>
      </div>

      {step === "idle" ? (
        <form action={requestAction} className="space-y-4">
          <div>
            <label htmlFor="newEmail" className="block text-sm font-medium text-foreground mb-1.5 flex items-center">
              Novo email
              <FieldTooltip tooltip="Insira o novo email de acesso. Um código OTP de 6 dígitos será enviado para confirmação." docsAnchor="conta-email" />
            </label>
            <input
              id="newEmail"
              name="newEmail"
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              required
              className="block w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors duration-150"
              placeholder="novo@email.com"
            />
          </div>

          {requestState?.error && (
            <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>{requestState.error}</span>
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={requestPending || !newEmail}
              className="inline-flex items-center justify-center rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {requestPending ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Enviando código...
                </span>
              ) : (
                "Enviar código de verificação"
              )}
            </button>
          </div>
        </form>
      ) : (
        <form action={verifyAction} className="space-y-4">
          <input type="hidden" name="newEmail" value={newEmail} />

          <div className="rounded-lg border border-blue-500/30 bg-blue-500/5 px-4 py-3 text-sm text-blue-700 dark:text-blue-400">
            Enviamos um código de 6 dígitos para <strong>{newEmail}</strong>
          </div>

          <div>
            <label htmlFor="otp" className="block text-sm font-medium text-foreground mb-1.5">
              Código de verificação
            </label>
            <input
              id="otp"
              name="otp"
              type="text"
              maxLength={6}
              pattern="\d{6}"
              required
              className="block w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground text-center tracking-[0.5em] font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors duration-150"
              placeholder="000000"
              autoFocus
            />
          </div>

          {verifyState?.error && (
            <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>{verifyState.error}</span>
            </div>
          )}
          {verifyState?.success && (
            <div className="flex items-start gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-500">
              <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>Email alterado com sucesso!</span>
            </div>
          )}

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setStep("idle")}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              ← Voltar
            </button>
            <button
              type="submit"
              disabled={verifyPending}
              className="inline-flex items-center justify-center rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {verifyPending ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Verificando...
                </span>
              ) : (
                "Confirmar alteração"
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}