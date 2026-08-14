"use client";

import { useActionState } from "react";
import { updateCombinedSettingsAction } from "./actions";
import { FieldTooltip } from "@/components/admin/field-tooltip";
import { Loader2, CheckCircle2, AlertCircle, Camera, Trash2, Shield, Mail } from "lucide-react";
import { requestEmailChangeAction, verifyEmailChangeAction } from "./actions";
import { useState } from "react";

interface BillingInfo {
  billingCpfCnpj: string | null;
  billingPersonType: string | null;
  billingBusinessName: string | null;
  billingPhone: string | null;
  billingAddress: {
    street?: string;
    number?: string;
    complement?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
    zipCode?: string;
  } | null;
}

interface ProfileFormProps {
  companyName: string;
  userName: string;
  email: string;
  billingInfo: BillingInfo | null;
  displayName?: string | null;
  handle?: string | null;
  bio?: string | null;
  publicProfile?: boolean;
  profileLinks?: Record<string, string> | null;
}

export function ProfileForm({
  companyName,
  userName,
  email,
  billingInfo,
  displayName,
  handle,
  bio,
  publicProfile = false,
  profileLinks,
}: ProfileFormProps) {
  const [state, formAction, pending] = useActionState(
    updateCombinedSettingsAction,
    undefined
  );

  return (
    <form action={formAction} className="space-y-8">
      {/* 1. Perfil Público */}
      <div className="glass-panel rounded-xl p-6 shadow-sm relative overflow-hidden">
        <h2 className="text-lg font-semibold text-card-foreground mb-1">
          Perfil Público
        </h2>
        <p className="text-sm text-muted-foreground mb-6">
          Estes dados são visíveis publicamente no seu perfil e templates.
        </p>

        <div className="space-y-5">
          {/* Avatar */}
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center overflow-hidden">
              {displayName || userName ? (displayName || userName)!.charAt(0).toUpperCase() : "?"}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium bg-secondary text-secondary-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                <Camera className="h-4 w-4" />
                Alterar foto
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
                Remover
              </button>
            </div>
          </div>

          {/* Nome da Empresa */}
          <div>
            <label
              htmlFor="companyName"
              className="block text-sm font-medium text-foreground mb-1.5 flex items-center"
            >
              Nome da empresa
              <FieldTooltip tooltip="O nome da sua empresa que aparece na sidebar do painel e identifica o seu ambiente." docsAnchor="perfil-nome" />
            </label>
            <input
              id="companyName"
              name="companyName"
              type="text"
              defaultValue={companyName}
              required
              className="block w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors duration-150"
              placeholder="Minha Empresa Ltda"
            />
            {state?.fieldErrors?.companyName && (
              <p className="mt-1 text-xs text-destructive">
                {state.fieldErrors.companyName[0]}
              </p>
            )}
          </div>

          {/* Nome de Exibição */}
          <div>
            <label
              htmlFor="displayName"
              className="block text-sm font-medium text-foreground mb-1.5 flex items-center"
            >
              Nome de exibição
              <FieldTooltip tooltip="Seu nome público que aparece no perfil e nos templates publicados." docsAnchor="perfil-nome" />
            </label>
            <input
              id="displayName"
              name="displayName"
              type="text"
              defaultValue={displayName ?? userName}
              className="block w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors duration-150"
              placeholder="Seu nome público"
            />
          </div>

          {/* Handle */}
          <div>
            <label
              htmlFor="handle"
              className="block text-sm font-medium text-foreground mb-1.5 flex items-center"
            >
              Handle (URL do perfil)
              <FieldTooltip tooltip="Seu identificador único na comunidade. Ex: /community/seu-nome" docsAnchor="perfil-handle" />
            </label>
            <div className="flex items-center rounded-lg border border-border bg-background focus-within:ring-2 focus-within:ring-primary/40 focus-within:border-primary transition-colors duration-150">
              <span className="pl-4 text-sm text-muted-foreground">@</span>
              <input
                id="handle"
                name="handle"
                type="text"
                defaultValue={handle ?? ""}
                className="block w-full rounded-r-lg border-0 bg-transparent px-2 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-0"
                placeholder="seu-nome"
              />
            </div>
            {state?.fieldErrors?.handle && (
              <p className="mt-1 text-xs text-destructive">
                {state.fieldErrors.handle[0]}
              </p>
            )}
          </div>

          {/* Perfil público ativo */}
          <label className="flex items-start gap-3 rounded-lg border border-border bg-muted/30 p-4 cursor-pointer">
            <input
              type="checkbox"
              name="publicProfile"
              defaultChecked={publicProfile}
              className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-primary"
            />
            <span>
              <span className="block text-sm font-medium text-foreground">Ativar perfil público</span>
              <span className="block text-xs text-muted-foreground mt-0.5">
                Permite que outros usuários vejam seu perfil e templates publicados.
              </span>
            </span>
          </label>

          {/* Bio */}
          <div>
            <label
              htmlFor="bio"
              className="block text-sm font-medium text-foreground mb-1.5 flex items-center"
            >
              Bio
              <FieldTooltip tooltip="Breve descrição sobre você ou sua empresa. Visível no perfil público." docsAnchor="perfil-bio" />
            </label>
            <textarea
              id="bio"
              name="bio"
              rows={3}
              defaultValue={bio ?? ""}
              className="block w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors duration-150 resize-none"
              placeholder="Fale um pouco sobre você..."
            />
          </div>

          {/* Links Sociais */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-3 flex items-center">
              Links Sociais
              <FieldTooltip tooltip="Links do seu website e redes sociais. Visíveis no perfil público." docsAnchor="perfil-links" />
            </label>
            <div className="space-y-3">
              <div className="grid grid-cols-[100px_1fr] gap-3 items-center">
                <span className="text-sm text-muted-foreground">Website</span>
                <input
                  type="url"
                  name="profileWebsite"
                  defaultValue={profileLinks?.website ?? ""}
                  className="block w-full rounded-lg border border-border bg-background px-4 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                  placeholder="https://seusite.com"
                />
              </div>
              <div className="grid grid-cols-[100px_1fr] gap-3 items-center">
                <span className="text-sm text-muted-foreground">Instagram</span>
                <input
                  type="url"
                  name="profileInstagram"
                  defaultValue={profileLinks?.instagram ?? ""}
                  className="block w-full rounded-lg border border-border bg-background px-4 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                  placeholder="https://instagram.com/seuperfil"
                />
              </div>
              <div className="grid grid-cols-[100px_1fr] gap-3 items-center">
                <span className="text-sm text-muted-foreground">YouTube</span>
                <input
                  type="url"
                  name="profileYoutube"
                  defaultValue={profileLinks?.youtube ?? ""}
                  className="block w-full rounded-lg border border-border bg-background px-4 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                  placeholder="https://youtube.com/@seucanal"
                />
              </div>
              <div className="grid grid-cols-[100px_1fr] gap-3 items-center">
                <span className="text-sm text-muted-foreground">WhatsApp</span>
                <input
                  type="url"
                  name="profileWhatsapp"
                  defaultValue={profileLinks?.whatsapp ?? ""}
                  className="block w-full rounded-lg border border-border bg-background px-4 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                  placeholder="https://wa.me/5511999999999"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Segurança — Email com OTP */}
      <div className="glass-panel rounded-xl p-6 shadow-sm relative overflow-hidden">
        <div className="flex items-center gap-2 mb-1">
          <Shield className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold text-card-foreground">
            Segurança
          </h2>
        </div>
        <p className="text-sm text-muted-foreground mb-6">
          Gerencie seu email de acesso. Uma verificação por código OTP será enviada ao novo email.
        </p>

        {/* Email atual */}
        <div className="mb-6 rounded-lg border border-border bg-muted/30 px-4 py-3">
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Email atual:</span>
            <span className="text-sm font-medium text-foreground">{email}</span>
          </div>
        </div>

        <EmailChangeSection currentEmail={email} />
      </div>

      {/* Feedback e Botão */}
      <div className="sticky bottom-4 z-10 p-4 glass-panel rounded-xl shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4 mt-8">
        <div className="flex-1">
          {state?.error && (
            <div className="flex items-start gap-2 text-sm text-destructive font-medium">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>{state.error}</span>
            </div>
          )}
          {state?.success && (
            <div className="flex items-start gap-2 text-sm text-emerald-600 font-medium">
              <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>Configurações salvas com sucesso!</span>
            </div>
          )}
        </div>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center justify-center rounded-lg bg-primary px-8 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-all duration-150 hover:bg-primary/90 active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
        >
          {pending ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Salvando...
            </span>
          ) : (
            "Salvar alterações"
          )}
        </button>
      </div>
    </form>
  );
}

// ============================================================================
// ALTERAÇÃO DE EMAIL (com OTP) — Componente reutilizável
// ============================================================================

function EmailChangeSection({ currentEmail }: { currentEmail: string }) {
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
    <>
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
    </>
  );
}