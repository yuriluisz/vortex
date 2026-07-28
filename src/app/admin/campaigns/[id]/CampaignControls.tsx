"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Power,
  PowerOff,
  Shield,
  ShieldOff,
  Trash2,
  Link as LinkIcon,
  Copy,
  Check,
  Loader2,
} from "lucide-react";
import {
  toggleCampaignStatusAction,
  toggleCampaignProtectionAction,
  deleteCampaignAction,
} from "../../actions";
import { FieldTooltip } from "@/components/admin/field-tooltip";

interface CampaignControlsProps {
  campaignId: string;
  initialActive: boolean;
  initialProtected: boolean;
  slug: string;
  accessCode: string | null;
}

export function CampaignControls({
  campaignId,
  initialActive,
  initialProtected,
  slug,
  accessCode,
}: CampaignControlsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [copiedCapture, setCopiedCapture] = useState(false);
  const [copiedRedirect, setCopiedRedirect] = useState(false);
  const [active, setActive] = useState(initialActive);
  const [protected_, setProtected_] = useState(initialProtected);
  const [currentAccessCode, setCurrentAccessCode] = useState(accessCode);

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://vortexpages.online";

  const captureUrl =
    protected_ && currentAccessCode
      ? `${baseUrl}/c/${currentAccessCode}`
      : `${baseUrl}/${slug}`;

  const redirectUrl =
    protected_ && currentAccessCode
      ? `${baseUrl}/c/${currentAccessCode}/redirect`
      : `${baseUrl}/${slug}/redirect`;

  const handleToggleActive = () => {
    const newActive = !active;
    setActive(newActive);
    startTransition(async () => {
      await toggleCampaignStatusAction(campaignId, newActive);
      router.refresh();
    });
  };

  const handleToggleProtection = () => {
    const newProtected = !protected_;
    setProtected_(newProtected);
    // Se está ativando proteção e não tem accessCode, gerar um localmente
    if (newProtected && !currentAccessCode) {
      setCurrentAccessCode(crypto.randomUUID());
    }
    startTransition(async () => {
      await toggleCampaignProtectionAction(campaignId, newProtected);
      router.refresh();
    });
  };

  const handleDelete = () => {
    if (!window.confirm("Tem certeza que deseja excluir esta campanha? Esta ação é irreversível.")) {
      return;
    }
    startTransition(async () => {
      await deleteCampaignAction(campaignId);
    });
  };

  const copyToClipboard = async (text: string, setCopy: (v: boolean) => void) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopy(true);
      setTimeout(() => setCopy(false), 2000);
    } catch {
      // fallback
      const el = document.createElement("textarea");
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopy(true);
      setTimeout(() => setCopy(false), 2000);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Coluna Principal: Links */}
      <div className="lg:col-span-2 space-y-6">
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm transition-all duration-300 hover:shadow-md hover:border-primary/20">
          <h3 className="text-lg font-medium text-card-foreground mb-4">Links Importantes</h3>

          <div className="space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <p className="text-sm text-muted-foreground">URL da Página de Captura</p>
                <FieldTooltip tooltip="Envie este link para seus leads se cadastrarem. Divulgue em anúncios, redes sociais, emails, etc." docsAnchor="campanha-links" />
              </div>
              <div className="flex items-center gap-2 rounded-lg border border-border bg-muted px-3 py-2">
                <LinkIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <code className="text-sm text-card-foreground flex-1 select-all font-mono truncate">
                  {captureUrl}
                </code>
                <button
                  type="button"
                  onClick={() => copyToClipboard(captureUrl, setCopiedCapture)}
                  className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors flex-shrink-0"
                  title="Copiar link"
                >
                  {copiedCapture ? (
                    <Check className="h-4 w-4 text-chart-1" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
              </div>
              {protected_ && (
                <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400">
                  🔒 Protegida — acessível apenas pelo código único
                </p>
              )}
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1">
                <p className="text-sm text-muted-foreground">URL de Redirecionamento (Grupos)</p>
                <FieldTooltip tooltip="Após o cadastro, o lead é levado a este endereço para entrar no grupo do WhatsApp correspondente." docsAnchor="campanha-links" />
              </div>
              <div className="flex items-center gap-2 rounded-lg border border-border bg-muted px-3 py-2">
                <LinkIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <code className="text-sm text-card-foreground flex-1 select-all font-mono truncate">
                  {redirectUrl}
                </code>
                <button
                  type="button"
                  onClick={() => copyToClipboard(redirectUrl, setCopiedRedirect)}
                  className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors flex-shrink-0"
                  title="Copiar link"
                >
                  {copiedRedirect ? (
                    <Check className="h-4 w-4 text-chart-1" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Coluna Lateral: Ações */}
      <div className="space-y-6 lg:sticky lg:top-8 self-start">
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm transition-all duration-300 hover:shadow-md hover:border-primary/20">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-card-foreground">Controles</h3>
            <FieldTooltip tooltip="Gerencie o status e segurança da campanha." docsAnchor="campanha-ativar-pausar" />
          </div>

          <div className="space-y-4">
            {isPending && (
              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" />
                Aguarde...
              </div>
            )}

            <button
              type="button"
              onClick={handleToggleActive}
              disabled={isPending}
              className={`w-full flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 ${
                active
                  ? "bg-chart-1/10 text-chart-1 hover:bg-chart-1/20"
                  : "bg-chart-2/10 text-chart-2 hover:bg-chart-2/20"
              }`}
            >
              {active ? (
                <><PowerOff className="h-4 w-4" /> Pausar Campanha</>
              ) : (
                <><Power className="h-4 w-4" /> Ativar Campanha</>
              )}
            </button>

            <button
              type="button"
              onClick={handleToggleProtection}
              disabled={isPending}
              className={`w-full flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 ${
                protected_
                  ? "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 dark:text-emerald-400"
                  : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              }`}
            >
              {protected_ ? (
                <><Shield className="h-4 w-4" /> Desproteger Campanha</>
              ) : (
                <><ShieldOff className="h-4 w-4" /> Proteger Campanha</>
              )}
            </button>

            <button
              type="button"
              onClick={handleDelete}
              disabled={isPending}
              className="w-full flex items-center justify-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive/20 disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" />
              Excluir Campanha
            </button>
          </div>
        </div>

        {/* Info de proteção */}
        {protected_ && (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-emerald-500 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-card-foreground">Campanha Protegida</h4>
                <p className="mt-1 text-xs text-muted-foreground">
                  Sua página não é acessível através do nome e sim através de um código identificador único na URL, dificultando cópia e scraping do seu funil.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}