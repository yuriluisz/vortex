"use client";

import { useActionState, useState, useRef, useTransition } from "react";
import {
  updateCombinedSettingsAction,
  requestEmailChangeAction,
  verifyEmailChangeAction,
  uploadAvatarAction,
  removeAvatarAction,
} from "./actions";
import { FieldTooltip } from "@/components/admin/field-tooltip";
import {
  Loader2,
  CheckCircle2,
  AlertCircle,
  Camera,
  Trash2,
  Shield,
  Mail,
  User,
  Globe,
  MessageSquare,
  Sparkles,
  Building,
} from "lucide-react";

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

function YoutubeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" />
      <polygon points="10 15 15 12 10 9 10 15" fill="currentColor" />
    </svg>
  );
}

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
  avatarUrl?: string | null;
  publicProfile?: boolean;
  profileLinks?: Record<string, string> | null;
}

export function ProfileForm({
  companyName,
  userName,
  email,
  billingInfo: _billingInfo,
  displayName,
  handle,
  bio,
  avatarUrl,
  publicProfile = false,
  profileLinks,
}: ProfileFormProps) {
  const [state, formAction, pending] = useActionState(
    updateCombinedSettingsAction,
    undefined
  );

  const [avatar, setAvatar] = useState<string | null>(avatarUrl || null);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [avatarSuccess, setAvatarSuccess] = useState(false);
  const [isAvatarPending, startAvatarTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setAvatarError("A imagem deve ter no máximo 5MB.");
      return;
    }

    setAvatarError(null);
    setAvatarSuccess(false);

    // Instant local preview
    const previewUrl = URL.createObjectURL(file);
    setAvatar(previewUrl);

    const formData = new FormData();
    formData.append("avatar", file);

    startAvatarTransition(async () => {
      const res = await uploadAvatarAction(undefined, formData);
      if (res?.error) {
        setAvatarError(res.error);
        setAvatar(avatarUrl || null);
      } else if (res?.success) {
        if (res.avatarUrl) setAvatar(res.avatarUrl);
        setAvatarSuccess(true);
        setTimeout(() => setAvatarSuccess(false), 3000);
      }
    });
  };

  const handleRemoveAvatar = () => {
    if (!confirm("Tem certeza que deseja remover sua foto de perfil?")) return;
    setAvatarError(null);
    setAvatarSuccess(false);

    startAvatarTransition(async () => {
      const res = await removeAvatarAction();
      if (res?.error) {
        setAvatarError(res.error);
      } else {
        setAvatar(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    });
  };

  return (
    <form action={formAction} className="space-y-8 pb-16">
      {/* ------------------------------------------------------------------- */}
      {/* 1. PERFIL PÚBLICO & IDENTIDADE                                      */}
      {/* ------------------------------------------------------------------- */}
      <div className="glass-panel rounded-2xl p-6 sm:p-7 border border-white/10 bg-zinc-950/70 backdrop-blur-xl shadow-xl space-y-6">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-primary/15 border border-primary/25 text-primary flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">
                Perfil & Identidade
              </h2>
              <p className="text-xs text-muted-foreground">
                Informações da empresa e dados do seu perfil público no Vórtex+.
              </p>
            </div>
          </div>
          {handle && (
            <span className="hidden sm:inline-flex items-center px-3 py-1 rounded-full text-xs font-mono font-semibold bg-white/5 border border-white/10 text-primary">
              @{handle}
            </span>
          )}
        </div>

        {/* Avatar Presentation with Real Upload */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 p-4 rounded-xl border border-white/5 bg-white/[0.02]">
          <input
            type="file"
            ref={fileInputRef}
            accept="image/png,image/jpeg,image/webp,image/gif"
            onChange={handleAvatarSelect}
            className="hidden"
          />

          <div className="relative h-16 w-16 rounded-2xl overflow-hidden border-2 border-primary/40 bg-gradient-to-br from-primary/30 via-primary/20 to-primary/5 flex items-center justify-center text-xl font-black text-primary shadow-lg shadow-primary/20 shrink-0">
            {isAvatarPending ? (
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            ) : avatar ? (
              <img
                src={avatar}
                alt="Foto de perfil"
                className="h-full w-full object-cover"
              />
            ) : displayName || userName ? (
              (displayName || userName)!.charAt(0).toUpperCase()
            ) : (
              "?"
            )}
          </div>

          <div className="space-y-1">
            <h4 className="text-sm font-bold text-foreground">
              {displayName || userName || "Seu Nome"}
            </h4>
            <p className="text-xs text-muted-foreground">
              Foto de perfil associada à sua conta e templates publicados (JPEG, PNG, WEBP até 5MB).
            </p>

            {avatarError && (
              <p className="text-xs text-destructive font-semibold pt-1">
                {avatarError}
              </p>
            )}
            {avatarSuccess && (
              <p className="text-xs text-emerald-400 font-semibold pt-1">
                Foto de perfil atualizada com sucesso!
              </p>
            )}

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isAvatarPending}
                className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold bg-white/5 hover:bg-white/10 border border-white/10 text-foreground transition-all active:scale-95 disabled:opacity-50"
              >
                {isAvatarPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Camera className="h-3.5 w-3.5 text-muted-foreground" />
                )}
                Alterar foto
              </button>

              {avatar && (
                <button
                  type="button"
                  onClick={handleRemoveAvatar}
                  disabled={isAvatarPending}
                  className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold bg-destructive/10 text-destructive hover:bg-destructive/20 border border-destructive/20 transition-all active:scale-95 disabled:opacity-50"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Remover
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Nome da Empresa */}
          <div>
            <label
              htmlFor="companyName"
              className="text-xs font-semibold text-foreground/80 mb-1.5 flex items-center justify-between"
            >
              <span className="flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-muted-foreground" />
                Nome da Empresa
              </span>
              <FieldTooltip tooltip="O nome da sua empresa que identifica o seu ambiente e aparece no menu lateral." docsAnchor="perfil-nome" />
            </label>
            <input
              id="companyName"
              name="companyName"
              type="text"
              defaultValue={companyName}
              required
              className="block w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-4 focus:ring-primary/20 focus:border-primary/50 transition-all"
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
              className="text-xs font-semibold text-foreground/80 mb-1.5 flex items-center justify-between"
            >
              <span>Nome de Exibição</span>
              <FieldTooltip tooltip="Seu nome público que aparece no perfil e nos templates publicados." docsAnchor="perfil-nome" />
            </label>
            <input
              id="displayName"
              name="displayName"
              type="text"
              defaultValue={displayName ?? userName}
              className="block w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-4 focus:ring-primary/20 focus:border-primary/50 transition-all"
              placeholder="Seu nome público"
            />
          </div>

          {/* Handle */}
          <div className="sm:col-span-2">
            <label
              htmlFor="handle"
              className="text-xs font-semibold text-foreground/80 mb-1.5 flex items-center justify-between"
            >
              <span>Handle Público (@username)</span>
              <FieldTooltip tooltip="Seu identificador único na comunidade. Ex: /community/seu-nome" docsAnchor="perfil-handle" />
            </label>
            <div className="flex items-center rounded-xl border border-white/10 bg-white/[0.04] focus-within:ring-4 focus-within:ring-primary/20 focus-within:border-primary/50 transition-all">
              <span className="pl-4 text-xs font-mono font-bold text-primary">@</span>
              <input
                id="handle"
                name="handle"
                type="text"
                defaultValue={handle ?? ""}
                className="block w-full rounded-r-xl border-0 bg-transparent px-2.5 py-2.5 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-0 font-mono"
                placeholder="seunome"
              />
            </div>
            {state?.fieldErrors?.handle && (
              <p className="mt-1 text-xs text-destructive">
                {state.fieldErrors.handle[0]}
              </p>
            )}
          </div>

          {/* Ativar Perfil Público Switch */}
          <div className="sm:col-span-2">
            <label className="flex items-start gap-3.5 rounded-xl border border-white/10 bg-white/[0.02] p-4 cursor-pointer hover:bg-white/[0.04] transition-colors">
              <input
                type="checkbox"
                name="publicProfile"
                defaultChecked={publicProfile}
                className="mt-0.5 h-4 w-4 rounded border-white/20 text-primary focus:ring-primary/20 bg-transparent cursor-pointer"
              />
              <div>
                <span className="block text-xs sm:text-sm font-bold text-foreground flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-primary" />
                  Ativar Perfil Público na Comunidade
                </span>
                <span className="block text-xs text-muted-foreground mt-0.5">
                  Permite que outros membros do Vórtex+ vejam seus templates publicados e seu perfil de criador.
                </span>
              </div>
            </label>
          </div>

          {/* Bio */}
          <div className="sm:col-span-2">
            <label
              htmlFor="bio"
              className="text-xs font-semibold text-foreground/80 mb-1.5 flex items-center justify-between"
            >
              <span>Biografia / Sobre Você</span>
              <FieldTooltip tooltip="Breve descrição sobre você ou sua empresa. Visível no perfil público." docsAnchor="perfil-bio" />
            </label>
            <textarea
              id="bio"
              name="bio"
              rows={3}
              defaultValue={bio ?? ""}
              className="block w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-4 focus:ring-primary/20 focus:border-primary/50 transition-all resize-none shadow-inner"
              placeholder="Fale um pouco sobre você, seu negócio e seus lançamentos..."
            />
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------- */}
      {/* 2. REDES SOCIAIS & PRESENÇA ONLINE                                  */}
      {/* ------------------------------------------------------------------- */}
      <div className="glass-panel rounded-2xl p-6 sm:p-7 border border-white/10 bg-zinc-950/70 backdrop-blur-xl shadow-xl space-y-5">
        <div className="border-b border-white/10 pb-4">
          <h3 className="text-base font-bold text-foreground">
            Presença Online & Redes Sociais
          </h3>
          <p className="text-xs text-muted-foreground">
            Links públicos para seus canais e páginas oficiais.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Website */}
          <div>
            <label className="text-xs font-semibold text-foreground/80 mb-1.5 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-blue-400" />
              Website Oficial
            </label>
            <input
              type="url"
              name="profileWebsite"
              defaultValue={profileLinks?.website ?? ""}
              className="block w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-xs sm:text-sm text-foreground focus:outline-none focus:ring-4 focus:ring-primary/20 focus:border-primary/50 placeholder:text-muted-foreground"
              placeholder="https://seusite.com.br"
            />
          </div>

          {/* Instagram */}
          <div>
            <label className="text-xs font-semibold text-foreground/80 mb-1.5 flex items-center gap-1.5">
              <InstagramIcon className="w-3.5 h-3.5 text-pink-400" />
              Instagram
            </label>
            <input
              type="url"
              name="profileInstagram"
              defaultValue={profileLinks?.instagram ?? ""}
              className="block w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-xs sm:text-sm text-foreground focus:outline-none focus:ring-4 focus:ring-primary/20 focus:border-primary/50 placeholder:text-muted-foreground"
              placeholder="https://instagram.com/seuperfil"
            />
          </div>

          {/* YouTube */}
          <div>
            <label className="text-xs font-semibold text-foreground/80 mb-1.5 flex items-center gap-1.5">
              <YoutubeIcon className="w-3.5 h-3.5 text-red-400" />
              YouTube
            </label>
            <input
              type="url"
              name="profileYoutube"
              defaultValue={profileLinks?.youtube ?? ""}
              className="block w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-xs sm:text-sm text-foreground focus:outline-none focus:ring-4 focus:ring-primary/20 focus:border-primary/50 placeholder:text-muted-foreground"
              placeholder="https://youtube.com/@seucanal"
            />
          </div>

          {/* WhatsApp */}
          <div>
            <label className="text-xs font-semibold text-foreground/80 mb-1.5 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
              WhatsApp Direto
            </label>
            <input
              type="url"
              name="profileWhatsapp"
              defaultValue={profileLinks?.whatsapp ?? ""}
              className="block w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-xs sm:text-sm text-foreground focus:outline-none focus:ring-4 focus:ring-primary/20 focus:border-primary/50 placeholder:text-muted-foreground"
              placeholder="https://wa.me/5511999999999"
            />
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------- */}
      {/* 3. SEGURANÇA & ACESSO (EMAIL COM OTP)                               */}
      {/* ------------------------------------------------------------------- */}
      <div className="glass-panel rounded-2xl p-6 sm:p-7 border border-white/10 bg-zinc-950/70 backdrop-blur-xl shadow-xl space-y-5">
        <div className="flex items-center gap-3 border-b border-white/10 pb-4">
          <div className="h-9 w-9 rounded-xl bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 flex items-center justify-center">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground">
              Segurança & Email de Acesso
            </h3>
            <p className="text-xs text-muted-foreground">
              Altere seu email de login com validação segura por código OTP.
            </p>
          </div>
        </div>

        {/* Email Atual */}
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <div>
              <span className="text-[11px] uppercase tracking-wider font-bold text-muted-foreground block">
                Email Atual Cadastrado
              </span>
              <span className="text-sm font-semibold text-foreground font-mono">
                {email}
              </span>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Verificado
          </span>
        </div>

        <EmailChangeSection currentEmail={email} />
      </div>

      {/* ------------------------------------------------------------------- */}
      {/* BARRA DE AÇÕES FLUTUANTE (STICKY SAVE BAR)                          */}
      {/* ------------------------------------------------------------------- */}
      <div className="sticky bottom-4 z-40 p-4 rounded-2xl border border-white/15 bg-zinc-950/90 backdrop-blur-2xl shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex-1 w-full sm:w-auto">
          {state?.error && (
            <div className="flex items-center gap-2 text-xs font-semibold text-destructive bg-destructive/10 border border-destructive/20 rounded-xl px-3.5 py-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{state.error}</span>
            </div>
          )}
          {state?.success && (
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-3.5 py-2">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>Configurações salvas com sucesso!</span>
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={pending}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-7 py-3 text-xs sm:text-sm font-bold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:bg-primary/90 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {pending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Salvando...
            </>
          ) : (
            "Salvar Alterações"
          )}
        </button>
      </div>
    </form>
  );
}

// ============================================================================
// COMPONENTE OTP DE ALTERAÇÃO DE EMAIL
// ============================================================================

function EmailChangeSection({ currentEmail: _currentEmail }: { currentEmail: string }) {
  const [step, setStep] = useState<"idle" | "verify">("idle");
  const [newEmail, setNewEmail] = useState("");
  const [otp, setOtp] = useState("");

  const [requestError, setRequestError] = useState<string | null>(null);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [verifySuccess, setVerifySuccess] = useState(false);

  const [requestPending, startRequestTransition] = useTransition();
  const [verifyPending, startVerifyTransition] = useTransition();

  const handleSendOTP = () => {
    if (!newEmail) return;
    setRequestError(null);

    const formData = new FormData();
    formData.append("newEmail", newEmail);

    startRequestTransition(async () => {
      const res = await requestEmailChangeAction(undefined, formData);
      if (res?.error) {
        setRequestError(res.error);
      } else if (res?.success) {
        setStep("verify");
      }
    });
  };

  const handleVerifyOTP = () => {
    if (!otp || !newEmail) return;
    setVerifyError(null);

    const formData = new FormData();
    formData.append("newEmail", newEmail);
    formData.append("otp", otp);

    startVerifyTransition(async () => {
      const res = await verifyEmailChangeAction(undefined, formData);
      if (res?.error) {
        setVerifyError(res.error);
      } else if (res?.success) {
        setVerifySuccess(true);
      }
    });
  };

  return (
    <div className="pt-2">
      {step === "idle" ? (
        <div className="space-y-4">
          <div>
            <label htmlFor="newEmail" className="block text-xs font-semibold text-foreground/80 mb-1.5 flex items-center justify-between">
              <span>Alterar para Novo Email</span>
              <FieldTooltip tooltip="Insira o novo email de acesso. Um código OTP de 6 dígitos será enviado para confirmação." docsAnchor="conta-email" />
            </label>
            <div className="flex gap-2">
              <input
                id="newEmail"
                name="newEmail"
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleSendOTP();
                  }
                }}
                className="flex-1 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-4 focus:ring-primary/20 focus:border-primary/50 transition-all"
                placeholder="novo.email@empresa.com"
              />
              <button
                type="button"
                onClick={handleSendOTP}
                disabled={requestPending || !newEmail}
                className="inline-flex items-center justify-center rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground shadow-md shadow-primary/20 transition-all hover:bg-primary/90 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
              >
                {requestPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Enviar OTP"
                )}
              </button>
            </div>
          </div>

          {requestError && (
            <div className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-2.5 text-xs text-destructive">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{requestError}</span>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4 p-4 rounded-xl border border-primary/20 bg-primary/5">
          <div className="text-xs text-primary font-medium">
            Enviamos um código de 6 dígitos para <strong className="font-mono">{newEmail}</strong>
          </div>

          <div>
            <label htmlFor="otp" className="block text-xs font-semibold text-foreground mb-1.5">
              Código de Verificação (OTP)
            </label>
            <input
              id="otp"
              name="otp"
              type="text"
              maxLength={6}
              pattern="\d{6}"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleVerifyOTP();
                }
              }}
              className="block w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-foreground text-center tracking-[0.5em] font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-4 focus:ring-primary/20 focus:border-primary transition-all"
              placeholder="000000"
              autoFocus
            />
          </div>

          {verifyError && (
            <div className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-2.5 text-xs text-destructive">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{verifyError}</span>
            </div>
          )}
          {verifySuccess && (
            <div className="flex items-start gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-xs text-emerald-400 font-semibold">
              <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
              <span>Email alterado com sucesso!</span>
            </div>
          )}

          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={() => {
                setStep("idle");
                setOtp("");
                setVerifyError(null);
              }}
              className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
            >
              ← Cancelar
            </button>
            <button
              type="button"
              onClick={handleVerifyOTP}
              disabled={verifyPending || otp.length < 6}
              className="inline-flex items-center justify-center rounded-xl bg-primary px-5 py-2 text-xs font-bold text-primary-foreground shadow-md transition-all hover:bg-primary/90 active:scale-95 disabled:opacity-50"
            >
              {verifyPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Confirmar Alteração"
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}