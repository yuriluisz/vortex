"use client";

import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Settings2,
  FileText,
  Link as LinkIcon,
  Shield,
  ShieldOff,
  Trash2,
  Copy,
  Check,
  ExternalLink,
  RefreshCcw,
} from "lucide-react";
import { CampaignFormBuilder } from "./campaign-form-builder";
import { FieldTooltip } from "./field-tooltip";

// ============================================================================
// Types
// ============================================================================

export interface CampaignSettings {
  name: string;
  slug: string;
  pixelId: string;
  gtmId: string;
  customDomain: string;
  formSchema: string;
  metaTitle: string;
  metaDescription: string;
  ogImageUrl: string;
  faviconUrl: string;
  // Group settings (edit only)
  groupMaxCapacity: number;
  groupSupportPhones: string;
  groupDescription: string;
  groupImageUrl: string;
}

export interface CampaignLinks {
  defaultCaptureUrl: string;
  defaultRedirectUrl: string;
  protectedCaptureUrl: string | null;
  protectedRedirectUrl: string | null;
  customCaptureUrl: string | null;
  customRedirectUrl: string | null;
}

export interface CampaignControlsState {
  active: boolean;
  protected: boolean;
  accessCode: string | null;
  customDomain: string | null;
}

interface CampaignSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  plan: string;
  settings: CampaignSettings;
  onSettingsChange: (settings: Partial<CampaignSettings>) => void;
  // Edit-only props
  campaignId?: string;
  controls?: CampaignControlsState;
  links?: CampaignLinks;
  onToggleActive?: () => void;
  onToggleProtection?: () => void;
  onDelete?: () => void;
  onCheckDomainStatus?: () => Promise<string | null>;
  groups?: Array<{
    id: string;
    name: string;
    url: string;
    currentCount: number;
    maxCapacity: number;
    active: boolean;
  }>;
  tenantMaxGroups?: number;
}

// ============================================================================
// ============================================================================
// Tab definitions
// ============================================================================

type TabId = "general" | "form" | "links";

interface TabDef {
  id: TabId;
  label: string;
  icon: React.ReactNode;
  editOnly?: boolean;
  ultraOnly?: boolean;
}

const TABS: TabDef[] = [
  { id: "general", label: "Geral", icon: <Settings2 className="w-4 h-4" /> },
  { id: "form", label: "Formulário", icon: <FileText className="w-4 h-4" /> },
  { id: "links", label: "Links e Acesso", icon: <LinkIcon className="w-4 h-4" />, editOnly: true },
];

// ============================================================================
// Component
// ============================================================================

export function CampaignSettingsModal({
  open,
  onOpenChange,
  mode,
  plan,
  settings,
  onSettingsChange,
  campaignId: _campaignId,
  controls,
  links,
  onToggleActive: _onToggleActive,
  onToggleProtection,
  onDelete,
  onCheckDomainStatus,
  groups: _groups,
  tenantMaxGroups: _tenantMaxGroups = 3,
}: CampaignSettingsModalProps) {
  const [activeTab, setActiveTab] = useState<TabId>("general");
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [domainStatus, setDomainStatus] = useState<string | null>(null);
  const [isCheckingDomain, setIsCheckingDomain] = useState(false);

  const visibleTabs = TABS.filter((t) => {
    if (t.editOnly && mode === "create") return false;
    return true;
  });

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onOpenChange]);

  const updateField = useCallback(
    (field: keyof CampaignSettings, value: string | number) => {
      onSettingsChange({ [field]: value });
    },
    [onSettingsChange]
  );

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedUrl(text);
      setTimeout(() => setCopiedUrl(null), 2000);
    } catch {
      const el = document.createElement("textarea");
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopiedUrl(text);
      setTimeout(() => setCopiedUrl(null), 2000);
    }
  };

  const checkDomainStatus = async () => {
    if (!onCheckDomainStatus) return;
    setIsCheckingDomain(true);
    try {
      const status = await onCheckDomainStatus();
      setDomainStatus(status);
    } catch {
      // ignore
    } finally {
      setIsCheckingDomain(false);
    }
  };

  if (!open) return null;

  const isLocked = plan !== "PRO" && plan !== "ULTRA";
  const inputClass =
    "w-full rounded-xl border border-white/15 bg-white/[0.05] px-4 py-3 text-base md:text-sm text-foreground outline-none transition-all duration-200 focus:border-primary/50 focus:ring-4 focus:ring-primary/20 focus:bg-white/[0.08] shadow-inner";
  const disabledInputClass = `${inputClass} opacity-50 cursor-not-allowed`;

  // ──────────────────────────────────────────────────────────────────────────
  // Render helpers per tab
  // ──────────────────────────────────────────────────────────────────────────

  const renderGeneral = () => (
    <div className="space-y-8 sm:space-y-10">
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-1">Configurações Gerais</h3>
          <p className="text-sm text-muted-foreground">Informações básicas da sua campanha.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
          <div className="space-y-2">
            <label htmlFor="settings-name" className="block text-sm font-medium text-foreground/80 flex items-center">
              Nome da Campanha *
              <FieldTooltip tooltip="Identifique sua campanha de forma clara. Este nome é exibido apenas no painel admin." docsAnchor="campo-nome" />
            </label>
            <input
              id="settings-name"
              type="text"
              required
              value={settings.name}
              onChange={(e) => updateField("name", e.target.value)}
              placeholder="Ex: Lançamento Mentoria 2026"
              className={inputClass}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="settings-slug" className="block text-sm font-medium text-foreground/80 flex items-center">
              Slug (URL) *
              <FieldTooltip tooltip="O slug é o endereço público da sua página de captura (vortexpages.online/seu-slug)." docsAnchor="campo-slug" />
            </label>
            <div className="flex flex-col sm:flex-row rounded-xl border border-white/10 bg-black/20 overflow-hidden focus-within:border-primary/50 focus-within:ring-4 focus-within:ring-primary/20 focus-within:bg-black/40 transition-all duration-200 shadow-inner">
              <span className="flex items-center px-3 sm:px-4 py-2 sm:py-0 border-b sm:border-b-0 sm:border-r border-white/10 text-xs sm:text-sm text-muted-foreground bg-white/5 whitespace-nowrap">
                vortexpages.online/
              </span>
              <input
                id="settings-slug"
                type="text"
                required
                value={settings.slug}
                onChange={(e) =>
                  updateField("slug", e.target.value.toLowerCase().replace(/\s+/g, "-"))
                }
                placeholder="mentoria-2026"
                className="w-full bg-transparent px-3 sm:px-4 py-2.5 sm:py-3 text-base md:text-sm text-foreground outline-none"
              />
            </div>
          </div>
        </div>

        {/* Rastreamento & Pixels */}
        <div className="space-y-4 pt-2">
          <div className="border-b border-white/10 pb-2">
            <h4 className="text-sm font-semibold text-foreground">
              Rastreamento & Pixels
            </h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              Dispare eventos de conversão no Meta Ads e Google Tag Manager.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
            <div className="space-y-2">
              <label htmlFor="settings-pixelId" className="block text-sm font-medium text-foreground/80 flex items-center justify-between">
                <span>Meta Pixel ID</span>
                <FieldTooltip tooltip="ID do pixel do Meta para rastreamento de conversões." docsAnchor="campo-pixel" />
              </label>
              <input
                id="settings-pixelId"
                type="text"
                value={settings.pixelId}
                onChange={(e) => updateField("pixelId", e.target.value)}
                placeholder="1234567890"
                className={inputClass}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="settings-gtmId" className="block text-sm font-medium text-foreground/80 flex items-center justify-between">
                <span>Google Tag Manager ID</span>
                <FieldTooltip tooltip="ID do contêiner GTM para tags e dataLayer." docsAnchor="campo-gtm" />
              </label>
              <input
                id="settings-gtmId"
                type="text"
                value={settings.gtmId}
                onChange={(e) => updateField("gtmId", e.target.value.toUpperCase())}
                placeholder="GTM-XXXXXXX"
                className={inputClass}
              />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="settings-customDomain" className="block text-sm font-medium text-foreground/80 flex items-center">
            Domínio Customizado
            <FieldTooltip tooltip="Use um domínio próprio (ex: campanha.meudominio.com.br). Requer apontamento DNS." docsAnchor="campo-dominio" />
          </label>
          <div className="relative">
            <input
              id="settings-customDomain"
              type="text"
              value={settings.customDomain}
              onChange={(e) =>
                updateField(
                  "customDomain",
                  e.target.value
                    .toLowerCase()
                    .replace(/^https?:\/\//i, "")
                    .replace(/\/+$/, "")
                    .replace(/\s+/g, "")
                )
              }
              placeholder={plan === "ULTRA" ? "Ex: campanha.meudominio.com.br" : "Disponível apenas no plano ULTRA"}
              disabled={plan !== "ULTRA"}
              className={plan !== "ULTRA" ? disabledInputClass : inputClass}
            />
            {plan !== "ULTRA" && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-primary/20 text-primary px-2 py-1 rounded-full">
                  Ultra
                </span>
              </div>
            )}
          </div>
          {plan === "ULTRA" && (
            <p className="text-[11px] text-muted-foreground mt-1">
              Apontamento DNS: crie uma entrada <strong>CNAME</strong> no seu provedor apontando para <code className="font-mono text-primary font-semibold">vortexpages.online</code>
            </p>
          )}
        </div>
      </div>

      <div className="space-y-6 pt-6 border-t border-border">
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-1">Identidade Visual do Link (SEO)</h3>
          <p className="text-sm text-muted-foreground">
            Personalize como sua página aparece ao compartilhar no WhatsApp, redes sociais e na aba do navegador.
          </p>
        </div>

        {isLocked && (
          <div className="rounded-lg border border-border bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
            Recurso exclusivo dos planos{" "}
            <span className="text-[10px] font-bold uppercase tracking-wider bg-primary/20 text-primary px-2 py-1 rounded-full">Pro</span>{" "}
            e{" "}
            <span className="text-[10px] font-bold uppercase tracking-wider bg-primary/20 text-primary px-2 py-1 rounded-full">Ultra</span>.
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label htmlFor="settings-metaTitle" className="block text-sm font-medium text-foreground/80 flex items-center">
              Título do Link
              <FieldTooltip tooltip="O título no card ao compartilhar o link." docsAnchor="campo-meta-titulo" />
            </label>
            <input
              id="settings-metaTitle"
              type="text"
              disabled={isLocked}
              value={settings.metaTitle}
              onChange={(e) => updateField("metaTitle", e.target.value)}
              placeholder="Ex: Lançamento Mentoria 2026"
              className={isLocked ? disabledInputClass : inputClass}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="settings-metaDescription" className="block text-sm font-medium text-foreground/80 flex items-center">
              Descrição do Link
              <FieldTooltip tooltip="A descrição exibida no card ao compartilhar o link." docsAnchor="campo-meta-descricao" />
            </label>
            <input
              id="settings-metaDescription"
              type="text"
              disabled={isLocked}
              value={settings.metaDescription}
              onChange={(e) => updateField("metaDescription", e.target.value)}
              placeholder="Ex: Garanta sua vaga e receba conteúdos exclusivos."
              className={isLocked ? disabledInputClass : inputClass}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label htmlFor="settings-ogImageUrl" className="block text-sm font-medium text-foreground/80 flex items-center">
              Imagem do Card (URL)
              <FieldTooltip tooltip="A imagem do card quando o link é compartilhado. Recomendado 1200x630." docsAnchor="campo-meta-imagem" />
            </label>
            <input
              id="settings-ogImageUrl"
              type="url"
              disabled={isLocked}
              value={settings.ogImageUrl}
              onChange={(e) => updateField("ogImageUrl", e.target.value)}
              placeholder="https://meusite.com/imagem-card.jpg"
              className={isLocked ? disabledInputClass : inputClass}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="settings-faviconUrl" className="block text-sm font-medium text-foreground/80 flex items-center">
              Favicon (URL)
              <FieldTooltip tooltip="O ícone na aba do navegador. Imagem quadrada (32x32 ou 64x64)." docsAnchor="campo-meta-favicon" />
            </label>
            <input
              id="settings-faviconUrl"
              type="url"
              disabled={isLocked}
              value={settings.faviconUrl}
              onChange={(e) => updateField("faviconUrl", e.target.value)}
              placeholder="https://meusite.com/favicon.png"
              className={isLocked ? disabledInputClass : inputClass}
            />
          </div>
        </div>

        {/* Preview card mock */}
        {!isLocked && (settings.metaTitle || settings.ogImageUrl) && (
          <div className="mt-4">
            <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider font-medium">Preview do Card</p>
            <div className="rounded-xl border border-border bg-muted/30 overflow-hidden max-w-sm">
              {settings.ogImageUrl && (
                <div className="h-32 bg-muted flex items-center justify-center overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={settings.ogImageUrl} alt="OG Preview" className="w-full h-full object-cover" />
                </div>
              )}
              <div className="p-3">
                <p className="text-xs text-muted-foreground truncate">vortexpages.online</p>
                <p className="text-sm font-semibold text-foreground truncate">{settings.metaTitle || "Título do Link"}</p>
                {settings.metaDescription && (
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{settings.metaDescription}</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {mode === "edit" && onDelete && (
        <div className="space-y-4 pt-6 border-t border-border">
          <div>
            <h3 className="text-lg font-semibold text-destructive mb-1">Zona de Perigo</h3>
            <p className="text-sm text-muted-foreground">Ações irreversíveis para esta campanha.</p>
          </div>
          
          <button
            type="button"
            onClick={onDelete}
            className="w-full md:w-auto flex items-center justify-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-5 py-3 text-sm font-medium text-destructive transition-colors hover:bg-destructive/20"
          >
            <Trash2 className="h-4 w-4" />
            Excluir Campanha
          </button>
        </div>
      )}
    </div>
  );

  const renderForm = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-1">Formulário de Captura</h3>
        <p className="text-sm text-muted-foreground">
          Configure as perguntas que aparecem na sua página de captura. O campo WhatsApp é obrigatório.
        </p>
      </div>

      <CampaignFormBuilder
        defaultValue={settings.formSchema}
        onChange={(schema) => updateField("formSchema", schema)}
      />
    </div>
  );

  const renderLinkRow = (label: string, url: string) => (
    <div>
      <p className="text-xs text-muted-foreground mb-1.5">{label}</p>
      <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/60 px-3 py-2.5 min-w-0">
        <LinkIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        <code className="text-xs sm:text-sm text-card-foreground flex-1 select-all font-mono truncate min-w-0">
          {url}
        </code>
        <div className="flex items-center gap-1 flex-shrink-0">
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors"
            title="Abrir em nova aba"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
          <button
            type="button"
            onClick={() => copyToClipboard(url)}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors"
            title="Copiar link"
          >
            {copiedUrl === url ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </div>
  );

  const renderLinks = () => {
    if (!links || !controls) return null;
    return (
      <div className="space-y-8">
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-1">Acesso e Links</h3>
          <p className="text-sm text-muted-foreground">
            Gerencie o acesso à sua página e as URLs de captura e redirecionamento.
          </p>
        </div>

        {/* Proteção (Movido da antiga aba Controles) */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-foreground border-b border-border pb-2">Controle de Acesso</h4>
          <button
            type="button"
            onClick={onToggleProtection}
            className={`group w-full flex items-center justify-between rounded-2xl px-6 py-5 text-sm font-medium transition-all duration-300 relative overflow-hidden ${
              controls.protected
                ? "bg-purple-500/10 text-purple-400 hover:bg-purple-500/15 border border-purple-500/30 hover:border-purple-500/50 shadow-[0_0_30px_rgba(168,85,247,0.1)]"
                : "bg-white/5 text-muted-foreground hover:bg-white/10 border border-white/10 hover:border-white/20"
            }`}
          >
            {controls.protected && (
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/0 via-purple-500/5 to-purple-500/0 translate-x-[-100%] animate-shimmer" />
            )}
            <div className="flex items-center gap-4 relative z-10">
              <div className={`p-2 rounded-xl transition-colors ${controls.protected ? "bg-purple-500/20 text-purple-400" : "bg-white/10 text-muted-foreground"}`}>
                {controls.protected ? <Shield className="h-5 w-5" /> : <ShieldOff className="h-5 w-5" />}
              </div>
              <div className="text-left">
                <div className="font-semibold text-base">{controls.protected ? "Campanha Protegida" : "Sem Proteção"}</div>
                <div className={`text-xs mt-1 transition-colors ${controls.protected ? "text-purple-400/70" : "text-muted-foreground/70"}`}>
                  {controls.protected ? "Apenas com código único na URL" : "Acessível pelo slug público"}
                </div>
              </div>
            </div>
            <div className={`w-14 h-8 rounded-full relative transition-all duration-300 shadow-inner ${controls.protected ? "bg-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.5)]" : "bg-white/10"}`}>
              <div className={`absolute top-1 bottom-1 w-6 bg-white rounded-full transition-all duration-300 shadow-md ${controls.protected ? "right-1" : "left-1"}`} />
            </div>
          </button>
        </div>

        {/* Domínio Padrão */}
        <div className="space-y-4 pt-4">
          <h4 className="text-sm font-semibold text-foreground border-b border-border pb-2">Domínio Padrão</h4>
          {renderLinkRow("Página de Captura", links.defaultCaptureUrl)}
          {renderLinkRow("Redirecionamento (Grupos)", links.defaultRedirectUrl)}
        </div>

        {/* Domínio Protegido */}
        {links.protectedCaptureUrl && links.protectedRedirectUrl && (
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-emerald-500 border-b border-border pb-2 flex items-center gap-2">
              <Shield className="w-4 h-4" /> Domínio Protegido
              {!controls?.protected && (
                <span className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full font-normal">
                  Inativo
                </span>
              )}
            </h4>
            <div className={!controls?.protected ? "opacity-50" : ""}>
              {renderLinkRow("Página de Captura Oculta", links.protectedCaptureUrl)}
              {renderLinkRow("Redirecionamento Protegido", links.protectedRedirectUrl)}
            </div>
          </div>
        )}

        {/* Domínio Customizado */}
        {links.customCaptureUrl && links.customRedirectUrl && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <h4 className="text-sm font-semibold text-purple-400">Domínio Customizado (ULTRA)</h4>
              <div className="flex items-center gap-2">
                {domainStatus && (
                  <span
                    className={`text-[10px] px-2 py-0.5 uppercase tracking-wider font-bold rounded-full ${
                      domainStatus === "active"
                        ? "bg-green-500/10 text-green-500"
                        : domainStatus === "pending" || domainStatus === "initializing"
                        ? "bg-yellow-500/10 text-yellow-500"
                        : "bg-red-500/10 text-red-500"
                    }`}
                  >
                    {domainStatus === "active" ? "Ativo" : domainStatus === "pending" || domainStatus === "initializing" ? "Validando" : "Erro"}
                  </span>
                )}
                <button
                  onClick={checkDomainStatus}
                  disabled={isCheckingDomain}
                  className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                >
                  <RefreshCcw className={`w-3 h-3 ${isCheckingDomain ? "animate-spin" : ""}`} />
                  Atualizar
                </button>
              </div>
            </div>
            {renderLinkRow("Sua Página de Captura", links.customCaptureUrl)}
            {renderLinkRow("Seu Redirecionamento", links.customRedirectUrl)}
            <p className="text-xs text-muted-foreground bg-muted/40 p-3 rounded-xl border border-white/5 leading-relaxed">
              💡 <strong>Dica de Propagação:</strong> Certifique-se de que o CNAME no seu DNS está apontando para <code className="font-mono text-primary font-semibold">vortexpages.online</code>. A emissão do SSL pela Cloudflare pode levar alguns minutos.
            </p>
          </div>
        )}
      </div>
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "general":
        return renderGeneral();
      case "form":
        return renderForm();
      case "links":
        return renderLinks();
    }
  };

  const modal = (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-xl">
      <div className="bg-zinc-950 border border-white/15 rounded-2xl sm:rounded-3xl w-full max-w-5xl h-[94dvh] sm:h-[90vh] max-h-[900px] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300 relative">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-8 py-3.5 sm:py-6 border-b border-white/10 shrink-0 relative z-10 bg-black/40">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/20 shadow-inner flex-shrink-0">
              <Settings2 className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-xl font-bold text-foreground tracking-tight truncate">
                {mode === "create" ? "Configurações da Nova Campanha" : "Configurações"}
              </h2>

              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 truncate">
                {settings.name || "Sem nome"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="p-2 sm:p-2.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-white/10 transition-all duration-200 flex-shrink-0"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mobile Tab Bar - Static flow above content */}
        <div className="md:hidden flex overflow-x-auto border-b border-white/10 bg-black/40 shrink-0 px-2 py-1 gap-1 no-scrollbar">
          {visibleTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg whitespace-nowrap transition-all duration-150 ${
                activeTab === tab.id
                  ? "text-primary bg-primary/10 border border-primary/20 shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/5 border border-transparent"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Body: Sidebar + Content */}
        <div className="flex flex-1 min-h-0 relative z-10">
          {/* Tab Sidebar (Desktop) */}
          <div className="w-56 border-r border-white/5 bg-black/20 p-4 shrink-0 overflow-y-auto hidden md:block space-y-1">
            {visibleTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold transition-all duration-300 rounded-xl group ${
                  activeTab === tab.id
                    ? "text-primary bg-primary/10 shadow-inner border border-primary/20"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/5 border border-transparent"
                }`}
              >
                <div className={`transition-transform duration-300 ${activeTab === tab.id ? "scale-110 text-primary" : "group-hover:scale-110"}`}>
                  {tab.icon}
                </div>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
            {renderTabContent()}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-4 sm:px-8 py-3 sm:py-5 border-t border-white/10 shrink-0 bg-black/40 relative z-10">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 sm:px-8 py-2.5 sm:py-3 text-sm font-bold text-primary-foreground shadow-[0_0_20px_rgba(var(--primary),0.3)] transition-all hover:bg-primary/90 active:scale-[0.97] hover:shadow-[0_0_25px_rgba(var(--primary),0.5)]"
          >
            <Check className="w-4 h-4" />
            Concluído
          </button>
        </div>
      </div>
    </div>
  );

  return typeof window !== "undefined" ? createPortal(modal, document.body) : null;
}
