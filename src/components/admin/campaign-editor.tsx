"use client";

import { useState, useCallback, useRef, useEffect, useTransition, useMemo } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import Editor, { OnMount } from "@monaco-editor/react";
import HtmlRenderer from "@/app/[slug]/HtmlRenderer";
import {
  Code,
  Eye,
  Columns2,
  Save,
  Settings,
  Plus,
  Users,
  Copy,
  Check,
  Globe,
  Share2,
  Sparkles,
  RefreshCw,
  ExternalLink,
  MessageCircle,
  HelpCircle,
  CheckCircle2,
  LayoutTemplate,
  ArrowLeft,
  ChevronDown,
  Power,
  PowerOff,
  MoreVertical,
  Loader2,
  Monitor,
  Tablet,
  Smartphone,
  AlertTriangle,
  X,
  Trash2,
  Video,
} from "lucide-react";
import { CampaignShareModal } from "@/components/admin/campaign-share-modal";
import { TemplatePicker } from "@/components/templates/template-picker";
import {
  CampaignSettingsModal,
  type CampaignSettings,
  type CampaignLinks,
  type CampaignControlsState,
} from "./campaign-settings-modal";
import {
  saveCampaignAction,
  toggleCampaignStatusAction,
  toggleCampaignProtectionAction,
  deleteCampaignAction,
  checkCustomHostnameStatusAction,
} from "@/app/admin/actions";
import { CopyCampaignLink } from "@/components/admin/copy-campaign-link";
import Link from "next/link";

// ============================================================================
// Types
// ============================================================================

interface CampaignData {
  id: string;
  name: string;
  slug: string;
  rawHtml: string;
  formSchema: unknown;
  pixelId: string | null;
  gtmId: string | null;
  customDomain: string | null;
  active: boolean;
  protected: boolean;
  accessCode: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  ogImageUrl: string | null;
  faviconUrl: string | null;
  groupMaxCapacity: number;
  groupSupportPhones: string[];
  groupDescription: string | null;
  groupImageUrl: string | null;
  sessionRecordingEnabled?: boolean;
  groups?: Array<{
    id: string;
    name: string;
    url: string;
    currentCount: number;
    maxCapacity: number;
    active: boolean;
  }>;
}

interface CampaignEditorProps {
  mode: "create" | "edit";
  plan: string;
  campaign?: CampaignData;
  tenantId?: string;
  tenantMaxGroups?: number;
}

// ============================================================================
// Constants
// ============================================================================

const DEBOUNCE_MS = 400;
const DEFAULT_FORM_SCHEMA = JSON.stringify([
  { id: "name", type: "text", label: "Nome Completo", placeholder: "Seu nome", required: true },
  { id: "whatsapp", type: "tel", label: "WhatsApp", placeholder: "(11) 99999-9999", required: true },
]);

const PLACEHOLDER_HTML = `<div class="min-h-screen bg-[#050505] text-white selection:bg-purple-500/30 selection:text-purple-200 overflow-hidden font-sans">
  <div class="max-w-6xl mx-auto px-6 py-12 md:py-20 lg:py-24 grid lg:grid-cols-2 gap-12 items-center min-h-screen">
    
    <!-- Lado Esquerdo: Copy e Detalhes -->
    <div class="space-y-8 relative z-10">
      <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-bold tracking-widest uppercase shadow-[0_0_15px_rgba(168,85,247,0.15)]">
        <span class="w-2 h-2 rounded-full bg-purple-400 animate-pulse"></span>
        Alta Conversão Automática
      </div>
      
      <h1 class="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1]">
        Valide Suas <br />
        <span class="bg-gradient-to-r from-purple-400 via-fuchsia-400 to-indigo-500 bg-clip-text text-transparent">
          Ofertas em Tempo Recorde
        </span>
      </h1>
      
      <p class="text-lg md:text-xl text-neutral-400 leading-relaxed max-w-lg">
        Construa páginas de alta conversão, capture leads em massa e lote seus grupos de WhatsApp de forma inteligente com o Vórtex.
      </p>

      <div class="flex flex-col gap-4">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 font-bold">✓</div>
          <span class="text-neutral-300">Rotacionador Inteligente de Grupos</span>
        </div>
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 font-bold">✓</div>
          <span class="text-neutral-300">Formulários Otimizados e Rápidos</span>
        </div>
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 font-bold">✓</div>
          <span class="text-neutral-300">Testes e Escala com Pixel Nativo</span>
        </div>
      </div>
    </div>
    
    <!-- Lado Direito: Formulário -->
    <div class="relative w-full max-w-md mx-auto lg:ml-auto lg:mr-0">
      <div class="absolute -inset-1 bg-gradient-to-br from-purple-500/30 to-indigo-600/30 rounded-3xl blur-2xl z-0 pointer-events-none"></div>
      
      <div class="relative z-10 bg-neutral-900/80 backdrop-blur-2xl border border-white/10 p-8 md:p-10 rounded-3xl shadow-[0_0_40px_rgba(0,0,0,0.5)]">
        <div class="text-center mb-8">
          <h3 class="text-2xl font-bold mb-2">Acesso Exclusivo</h3>
          <p class="text-sm text-neutral-400">Preencha os dados abaixo para entrar na lista VIP ou receber o link.</p>
        </div>
        
        {{FORM_SLOT}}
      </div>
    </div>
    
  </div>
</div>`;

// ============================================================================
// Helpers
// ============================================================================

const PREVIEW_BASE_DOCUMENT = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    html,body{width:100%;height:100%;font-family:system-ui,-apple-system,sans-serif;color-scheme:dark}
    /* Ensure forms inherit color for dark themes */
    input,select,textarea,button{font-family:inherit;color:inherit}
  </style>
  <script>
    // Interceptar cliques para rolagem suave em âncoras (#) e impedir navegação indesejada do iframe
    document.addEventListener('click', function(e) {
      var link = e.target.closest('a');
      if (!link) return;
      var href = link.getAttribute('href');
      if (!href) return;

      if (href.startsWith('#')) {
        e.preventDefault();
        e.stopPropagation();
        var targetId = href.substring(1);
        var targetEl = targetId ? (document.getElementById(targetId) || document.querySelector(href)) : null;
        if (targetEl) {
          targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else if (href === '#' || href === '#inicio') {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
        return false;
      }

      if (href.startsWith('http://') || href.startsWith('https://') || href.startsWith('//') || href.startsWith('tel:') || href.startsWith('mailto:')) {
        link.setAttribute('target', '_blank');
      } else {
        // Prevenir rotas relativas de navegarem o iframe para o painel admin
        e.preventDefault();
        e.stopPropagation();
      }
    }, true);
  </script>
</head>
<body><div id="portal-root"></div></body>
</html>`;

// ============================================================================
// Component
// ============================================================================

export function CampaignEditor({ mode, plan, campaign, tenantId: _tenantId, tenantMaxGroups }: CampaignEditorProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // ── HTML State ──
  const [html, setHtml] = useState(campaign?.rawHtml || PLACEHOLDER_HTML);
  const [previewHtml, setPreviewHtml] = useState(campaign?.rawHtml || PLACEHOLDER_HTML);

  // ── UI State ──
  const [settingsOpen, setSettingsOpen] = useState(mode === "create");
  const [showPicker, setShowPicker] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [activeTab, setActiveTab] = useState<"code" | "preview" | "split">("split");
  const [viewport, setViewport] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [isMobile, setIsMobile] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [saveError, setSaveError] = useState<string | null>(null);

  // ── Settings State (controlled) ──
  const [settings, setSettings] = useState<CampaignSettings>({
    name: campaign?.name || "",
    slug: campaign?.slug || "",
    pixelId: campaign?.pixelId || "",
    gtmId: campaign?.gtmId || "",
    customDomain: campaign?.customDomain || "",
    formSchema: campaign?.formSchema ? JSON.stringify(campaign.formSchema) : DEFAULT_FORM_SCHEMA,
    metaTitle: campaign?.metaTitle || "",
    metaDescription: campaign?.metaDescription || "",
    ogImageUrl: campaign?.ogImageUrl || "",
    faviconUrl: campaign?.faviconUrl || "",
    groupMaxCapacity: campaign?.groupMaxCapacity || 1000,
    groupSupportPhones: campaign?.groupSupportPhones?.join(", ") || "",
    groupDescription: campaign?.groupDescription || "",
    groupImageUrl: campaign?.groupImageUrl || "",
    sessionRecordingEnabled: campaign?.sessionRecordingEnabled ?? false,
  });

  // ── Controls State (edit only) ──
  const [controls, setControls] = useState<CampaignControlsState>({
    active: campaign?.active ?? true,
    protected: campaign?.protected ?? false,
    accessCode: campaign?.accessCode || null,
    customDomain: campaign?.customDomain || null,
  });

  // ── Refs ──
  const editorRef = useRef<Parameters<OnMount>[0] | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  // ── Click outside mobile menu ──
  useEffect(() => {
    if (!mobileMenuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(e.target as Node)) {
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [mobileMenuOpen]);

  // ── Mobile detection ──
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile && activeTab === "split") setActiveTab("code");
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, [activeTab]);

  // ── Iframe Mount State ──
  const [iframePortalRoot, setIframePortalRoot] = useState<HTMLElement | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  const syncPortalRoot = useCallback((iframe: HTMLIFrameElement | null) => {
    if (!iframe) return false;
    try {
      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      if (doc) {
        const root = doc.getElementById("portal-root");
        if (root) {
          setIframePortalRoot((prev) => (prev === root ? prev : root));
          return true;
        }
      }
    } catch {
      // Ignora erro cross-origin
    }
    return false;
  }, []);

  const handleIframeLoad = useCallback((e: React.SyntheticEvent<HTMLIFrameElement>) => {
    syncPortalRoot(e.currentTarget);
  }, [syncPortalRoot]);

  const setIframeRef = useCallback((node: HTMLIFrameElement | null) => {
    iframeRef.current = node;
    if (node) {
      if (!syncPortalRoot(node)) {
        node.addEventListener("load", () => syncPortalRoot(node), { once: true });
      }
    } else {
      setIframePortalRoot(null);
    }
  }, [syncPortalRoot]);

  useEffect(() => {
    if (activeTab === "code") return;
    if (iframeRef.current && !iframePortalRoot) {
      if (!syncPortalRoot(iframeRef.current)) {
        const timer = setInterval(() => {
          if (syncPortalRoot(iframeRef.current)) {
            clearInterval(timer);
          }
        }, 50);
        return () => clearInterval(timer);
      }
    }
  }, [activeTab, iframePortalRoot, syncPortalRoot]);

  // ── FormSchema Parser ──
  const parsedFormSchema = useMemo(() => {
    try {
      return JSON.parse(settings.formSchema);
    } catch {
      return [];
    }
  }, [settings.formSchema]);

  // ── Preview update with debounce ──
  const updatePreview = useCallback((newHtml: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPreviewHtml(newHtml);
    }, DEBOUNCE_MS);
  }, []);

  // ── Monaco change handler ──
  const handleEditorChange = useCallback(
    (value: string | undefined) => {
      if (value === undefined) return;
      setHtml(value);
      updatePreview(value);
    },
    [updatePreview]
  );


  // ── Monaco mount ──
  const handleEditorMount: OnMount = useCallback((editor) => {
    editorRef.current = editor;
    editor.focus();
  }, []);

  // ── Settings change ──
  const handleSettingsChange = useCallback((partial: Partial<CampaignSettings>) => {
    setSettings((prev) => ({ ...prev, ...partial }));
  }, []);

  // ── Template select ──
  const handleTemplateSelect = useCallback(
    (templateHtml: string) => {
      setHtml(templateHtml);
      setPreviewHtml(templateHtml);
      setShowPicker(false);
      if (editorRef.current) {
        editorRef.current.setValue(templateHtml);
      }
    },
    []
  );

  // ── Save ──
  const handleSave = useCallback(() => {
    if (!settings.name.trim()) {
      setSaveError("Preencha o nome da campanha nas Configurações.");
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 4000);
      return;
    }
    if (!settings.slug.trim()) {
      setSaveError("Preencha o slug da campanha nas Configurações.");
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 4000);
      return;
    }
    if (!html.trim()) {
      setSaveError("O HTML não pode estar vazio.");
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 4000);
      return;
    }

    setSaveStatus("saving");
    setSaveError(null);

    startTransition(async () => {
      const result = await saveCampaignAction(
        mode === "edit" ? campaign?.id || null : null,
        {
          name: settings.name,
          slug: settings.slug,
          rawHtml: html,
          formSchema: settings.formSchema,
          pixelId: settings.pixelId || undefined,
          gtmId: settings.gtmId || undefined,
          customDomain: settings.customDomain || undefined,
          metaTitle: settings.metaTitle || undefined,
          metaDescription: settings.metaDescription || undefined,
          ogImageUrl: settings.ogImageUrl || undefined,
          faviconUrl: settings.faviconUrl || undefined,
          groupMaxCapacity: settings.groupMaxCapacity,
          groupSupportPhones: settings.groupSupportPhones || undefined,
          groupDescription: settings.groupDescription || undefined,
          groupImageUrl: settings.groupImageUrl || undefined,
          sessionRecordingEnabled: settings.sessionRecordingEnabled,
        }
      );

      if (result?.error) {
        setSaveError(result.error);
        setSaveStatus("error");
        setTimeout(() => setSaveStatus("idle"), 4000);
      } else if (result?.success) {
        setSaveStatus("saved");
        const cleanDomain = settings.customDomain
          ? settings.customDomain.trim().toLowerCase().replace(/^https?:\/\//i, "").replace(/\/+$/, "")
          : null;
        setControls((prev) => ({
          ...prev,
          customDomain: cleanDomain || null,
        }));
        router.refresh();
        setTimeout(() => setSaveStatus("idle"), 3000);
      }
    });
  }, [html, settings, mode, campaign?.id, router, startTransition]);

  // ── Controls handlers (edit only) ──
  const handleToggleActive = useCallback(() => {
    if (!campaign?.id) return;
    const newActive = !controls.active;
    setControls((prev) => ({ ...prev, active: newActive }));
    startTransition(async () => {
      await toggleCampaignStatusAction(campaign.id, newActive);
      router.refresh();
    });
  }, [campaign, controls.active, router, startTransition]);

  const handleToggleProtection = useCallback(() => {
    if (!campaign?.id) return;
    const newProtected = !controls.protected;
    const newAccessCode = newProtected && !controls.accessCode ? crypto.randomUUID() : controls.accessCode;
    setControls((prev) => ({
      ...prev,
      protected: newProtected,
      accessCode: newAccessCode,
    }));
    startTransition(async () => {
      await toggleCampaignProtectionAction(campaign.id, newProtected);
      router.refresh();
    });
  }, [campaign, controls.protected, controls.accessCode, router, startTransition]);

  const handleDelete = useCallback(() => {
    setShowDeleteConfirm(true);
  }, []);

  const handleConfirmDelete = useCallback(() => {
    if (!campaign?.id) return;
    startTransition(async () => {
      await deleteCampaignAction(campaign.id);
      router.push("/admin/campaigns");
    });
  }, [campaign, router, startTransition]);

  const handleCheckDomainStatus = useCallback(async () => {
    if (!controls.customDomain) return null;
    return await checkCustomHostnameStatusAction(controls.customDomain);
  }, [controls.customDomain]);

  // ── Build links for edit mode ──
  const campaignLinks: CampaignLinks | undefined =
    mode === "edit" && campaign
      ? (() => {
          const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://vortexpages.online";
          const currentSlug = settings.slug || campaign.slug;
          return {
            defaultCaptureUrl: `${baseUrl}/${currentSlug}`,
            defaultRedirectUrl: `${baseUrl}/${currentSlug}/redirect`,
            protectedCaptureUrl: (controls.protected && controls.accessCode) ? `${baseUrl}/c/${controls.accessCode}` : null,
            protectedRedirectUrl: (controls.protected && controls.accessCode) ? `${baseUrl}/c/${controls.accessCode}/redirect` : null,
            customCaptureUrl: controls.customDomain ? `https://${controls.customDomain}` : null,
            customRedirectUrl: controls.customDomain ? `https://${controls.customDomain}/redirect` : null,
          };
        })()
      : undefined;

  // ── Keyboard shortcut (Ctrl+S) ──
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleSave]);

  return (
    <div className="flex flex-col h-full w-full">
      {/* ------------------------------------------------------------------- */}
      {/* TOOLBAR                                                           */}
      {/* ------------------------------------------------------------------- */}
      <div className="flex items-center justify-between px-2.5 sm:px-4 py-2 sm:py-2.5 border-b border-white/10 bg-background/80 backdrop-blur-xl shrink-0 gap-2 relative z-20 shadow-sm">
        {/* Left side */}
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-shrink-0">
          <Link
            href="/admin/campaigns"
            className="p-1.5 sm:p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors flex-shrink-0"
            title="Voltar para Campanhas"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>

          {/* Campaign name (desktop) */}
          <div className="hidden md:flex items-center gap-2 min-w-0">
            <span className="text-sm font-medium text-foreground truncate max-w-[180px] lg:max-w-[240px]">
              {settings.name || (mode === "create" ? "Nova Campanha" : "Sem nome")}
            </span>
            {mode === "edit" && controls && (
              <span
                className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                  controls.active
                    ? "bg-emerald-500/10 text-emerald-500"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {controls.active ? "Ativa" : "Pausada"}
              </span>
            )}
          </div>

          <div className="w-px h-5 bg-border/40 mx-1 hidden md:block" />

          {/* View toggle */}
          <div className="flex rounded-lg border border-white/10 bg-black/40 p-0.5 overflow-hidden backdrop-blur-md shadow-inner">
            <button
              type="button"
              onClick={() => setActiveTab("code")}
              className={`px-2 sm:px-2.5 py-1 sm:py-1.5 text-xs font-medium flex items-center gap-1 sm:gap-1.5 transition-all duration-200 rounded-md ${
                activeTab === "code"
                  ? "bg-primary/20 text-primary shadow-sm border border-primary/20"
                  : "hover:bg-white/5 text-muted-foreground hover:text-foreground border border-transparent"
              }`}
              title="Código"
            >
              <Code className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Código</span>
            </button>
            {!isMobile && (
              <button
                type="button"
                onClick={() => setActiveTab("split")}
                className={`px-2 sm:px-2.5 py-1 sm:py-1.5 text-xs font-medium flex items-center gap-1 sm:gap-1.5 transition-all duration-200 rounded-md ${
                  activeTab === "split"
                    ? "bg-primary/20 text-primary shadow-sm border border-primary/20"
                    : "hover:bg-white/5 text-muted-foreground hover:text-foreground border border-transparent"
                }`}
                title="Split"
              >
                <Columns2 className="w-3.5 h-3.5" />
                <span className="hidden lg:inline">Split</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setActiveTab("preview")}
              className={`px-2 sm:px-2.5 py-1 sm:py-1.5 text-xs font-medium flex items-center gap-1 sm:gap-1.5 transition-all duration-200 rounded-md ${
                activeTab === "preview"
                  ? "bg-primary/20 text-primary shadow-sm border border-primary/20"
                  : "hover:bg-white/5 text-muted-foreground hover:text-foreground border border-transparent"
              }`}
              title="Preview"
            >
              <Eye className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Preview</span>
            </button>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0">
          {/* Save status */}
          {saveStatus === "error" && saveError && (
            <span className="text-xs text-destructive font-medium max-w-[150px] truncate hidden md:inline">
              {saveError}
            </span>
          )}
          {saveStatus === "saved" && (
            <span className="text-xs text-emerald-500 font-medium flex items-center gap-1 hidden md:flex">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Salvo
            </span>
          )}

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-1.5">
            {(settings.slug || campaign?.slug) && (
              <CopyCampaignLink
                slug={settings.slug || campaign?.slug || ""}
                customDomain={controls?.customDomain || campaign?.customDomain}
              />
            )}

            {mode === "edit" && campaign && (
              <>
                <Link
                  href={`/admin/campaigns/${campaign.id}/leads`}
                  className="inline-flex items-center px-2.5 sm:px-3 py-1.5 text-xs rounded-lg border border-white/10 hover:bg-white/5 transition-all duration-200 text-foreground shadow-sm hover:shadow active:scale-95 group"
                >
                  <Users className="w-3.5 h-3.5 sm:mr-1.5 text-muted-foreground group-hover:text-foreground transition-colors" />
                  <span className="hidden sm:inline">Leads</span>
                </Link>
                <Link
                  href={`/admin/campaigns/${campaign.id}/groups`}
                  className="inline-flex items-center px-2.5 sm:px-3 py-1.5 text-xs rounded-lg border border-white/10 hover:bg-white/5 transition-all duration-200 text-foreground shadow-sm hover:shadow active:scale-95 group"
                >
                  <MessageCircle className="w-3.5 h-3.5 sm:mr-1.5 text-muted-foreground group-hover:text-foreground transition-colors" />
                  <span className="hidden sm:inline">Grupos</span>
                </Link>

                <Link
                  href={`/admin/campaigns/${campaign.id}/recordings`}
                  className="inline-flex items-center px-2.5 sm:px-3 py-1.5 text-xs rounded-lg border border-white/10 hover:bg-white/5 transition-all duration-200 text-foreground shadow-sm hover:shadow active:scale-95 group"
                  title="Gravações de Sessão e Mapa de Calor"
                >
                  <Video className="w-3.5 h-3.5 sm:mr-1.5 text-muted-foreground group-hover:text-foreground transition-colors" />
                  <span className="hidden sm:inline">Gravações & Calor</span>
                </Link>

                <button
                  type="button"
                  onClick={() => setShowShareModal(true)}
                  className="inline-flex items-center px-2.5 sm:px-3 py-1.5 text-xs rounded-lg border border-white/10 hover:bg-white/5 transition-all duration-200 text-foreground shadow-sm hover:shadow active:scale-95 group"
                  title="Compartilhar com Gestor de Tráfego"
                >
                  <Share2 className="w-3.5 h-3.5 sm:mr-1.5 text-muted-foreground group-hover:text-foreground transition-colors" />
                  <span className="hidden sm:inline">Compartilhar</span>
                </button>
              </>
            )}

            <button
              type="button"
              onClick={() => setShowPicker(true)}
              className="inline-flex items-center px-2.5 sm:px-3 py-1.5 text-xs rounded-lg border border-white/10 hover:bg-white/5 transition-all duration-200 text-foreground shadow-sm hover:shadow active:scale-95 group"
            >
              <LayoutTemplate className="w-3.5 h-3.5 sm:mr-1.5 text-muted-foreground group-hover:text-foreground transition-colors" />
              <span className="hidden sm:inline">Templates</span>
            </button>

            <button
              type="button"
              onClick={() => setSettingsOpen(true)}
              className="inline-flex items-center px-2.5 sm:px-3 py-1.5 text-xs rounded-lg border border-white/10 hover:bg-white/5 transition-all duration-200 text-foreground shadow-sm hover:shadow active:scale-95 group"
            >
              <Settings className="w-3.5 h-3.5 sm:mr-1.5 text-muted-foreground group-hover:text-foreground transition-colors" />
              <span className="hidden sm:inline">Configurações</span>
            </button>

            {mode === "edit" && controls && (
              <button
                type="button"
                onClick={handleToggleActive}
                className={`inline-flex items-center px-2.5 sm:px-3 py-1.5 text-xs rounded-lg border transition-all duration-200 shadow-sm hover:shadow active:scale-95 ${
                  controls.active
                    ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30 hover:bg-emerald-500/20"
                    : "bg-white/5 text-muted-foreground border-white/10 hover:bg-white/10"
                }`}
                title={controls.active ? "Desativar Campanha" : "Ativar Campanha"}
              >
                {controls.active ? (
                  <Power className="w-3.5 h-3.5 sm:mr-1.5" />
                ) : (
                  <PowerOff className="w-3.5 h-3.5 sm:mr-1.5" />
                )}
                <span className="hidden sm:inline">{controls.active ? "Ativa" : "Pausada"}</span>
              </button>
            )}
          </div>

          {/* Mobile Actions: Settings + Overflow Menu */}
          <div className="flex md:hidden items-center gap-1">
            <button
              type="button"
              onClick={() => setSettingsOpen(true)}
              className="p-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-foreground transition-colors"
              title="Configurações"
            >
              <Settings className="w-4 h-4" />
            </button>

            <div className="relative" ref={mobileMenuRef}>
              <button
                type="button"
                onClick={() => setMobileMenuOpen((prev) => !prev)}
                className="p-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-foreground transition-colors"
                title="Mais opções"
                aria-expanded={mobileMenuOpen}
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {mobileMenuOpen && (
                <div className="absolute right-0 top-full mt-1.5 z-50 min-w-[180px] rounded-xl border border-white/15 bg-zinc-950/95 backdrop-blur-2xl p-1.5 shadow-2xl animate-in fade-in zoom-in-95 duration-150 space-y-1">
                  {(settings.slug || campaign?.slug) && (
                    <div className="pb-1 mb-1 border-b border-white/10">
                      <CopyCampaignLink
                        slug={settings.slug || campaign?.slug || ""}
                        customDomain={controls?.customDomain || campaign?.customDomain}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg bg-primary/15 text-primary border border-primary/30 hover:bg-primary/25 transition-colors"
                      />
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setShowPicker(true);
                      setMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-foreground rounded-lg hover:bg-white/10 transition-colors text-left"
                  >
                    <LayoutTemplate className="w-4 h-4 text-muted-foreground" />
                    Templates
                  </button>

                  {mode === "edit" && campaign && (
                    <>
                      <Link
                        href={`/admin/campaigns/${campaign.id}/leads`}
                        onClick={() => setMobileMenuOpen(false)}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-foreground rounded-lg hover:bg-white/10 transition-colors text-left"
                      >
                        <Users className="w-4 h-4 text-muted-foreground" />
                        Ver Leads
                      </Link>
                      <Link
                        href={`/admin/campaigns/${campaign.id}/groups`}
                        onClick={() => setMobileMenuOpen(false)}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-foreground rounded-lg hover:bg-white/10 transition-colors text-left"
                      >
                        <MessageCircle className="w-4 h-4 text-muted-foreground" />
                        Ver Grupos
                      </Link>
                      <Link
                        href={`/admin/campaigns/${campaign.id}/recordings`}
                        onClick={() => setMobileMenuOpen(false)}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-foreground rounded-lg hover:bg-white/10 transition-colors text-left"
                      >
                        <Video className="w-4 h-4 text-muted-foreground" />
                        Gravações & Calor
                      </Link>
                      <button
                        type="button"
                        onClick={() => {
                          handleToggleActive();
                          setMobileMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-foreground rounded-lg hover:bg-white/10 transition-colors text-left"
                      >
                        {controls?.active ? (
                          <>
                            <PowerOff className="w-4 h-4 text-destructive" />
                            Pausar Campanha
                          </>
                        ) : (
                          <>
                            <Power className="w-4 h-4 text-emerald-400" />
                            Ativar Campanha
                          </>
                        )}
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>


          {/* Primary Save button */}
          <button
            type="button"
            onClick={handleSave}
            disabled={isPending || saveStatus === "saving"}
            className="relative inline-flex items-center px-3 sm:px-4 py-1.5 text-xs rounded-lg bg-primary text-primary-foreground font-semibold gap-1.5 overflow-hidden transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed hover:bg-primary/90 active:scale-95 hover:shadow-[0_0_20px_rgba(147,51,234,0.4)]"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] animate-shimmer" />
            {saveStatus === "saving" || isPending ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span className="hidden sm:inline">Salvando...</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>{mode === "create" ? "Criar" : "Salvar"}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------------- */}
      {/* EDITOR + PREVIEW                                                  */}
      {/* ------------------------------------------------------------------- */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Code Editor (Monaco) */}
        {(activeTab === "code" || activeTab === "split") && (
          <div className={`${activeTab === "split" ? "w-1/2" : "w-full"} border-r border-white/5 min-w-0 bg-[#1e1e1e] relative z-10 shadow-[4px_0_24px_rgba(0,0,0,0.5)]`}>
            <Editor
              height="100%"
              defaultLanguage="html"
              theme="vs-dark"
              value={html}
              onChange={handleEditorChange}
              onMount={handleEditorMount}
              options={{
                fontSize: isMobile ? 13 : 14,
                minimap: { enabled: false },
                wordWrap: "on",
                lineNumbers: isMobile ? "off" : "on",
                scrollBeyondLastLine: false,
                automaticLayout: true,
                tabSize: 2,
                formatOnPaste: true,
                suggestOnTriggerCharacters: !isMobile,
                quickSuggestions: !isMobile,
                folding: !isMobile,
                renderWhitespace: "selection",
                bracketPairColorization: { enabled: true },
                padding: { top: isMobile ? 8 : 12, bottom: isMobile ? 8 : 12 },
              }}
              loading={
                <div className="flex items-center justify-center h-full bg-muted/50">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              }
            />
          </div>
        )}

        {/* Preview */}
        {(activeTab === "preview" || activeTab === "split") && (
          <div className={`${activeTab === "split" ? "w-1/2" : "w-full"} bg-[#0a0a0a] min-w-0 relative z-0 flex items-center justify-center ${isMobile ? "p-0" : "p-2 sm:p-4"} overflow-auto`}>
            {/* Viewport switcher - only shown on desktop / tablet */}
            {!isMobile && (
              <div className="absolute top-3 left-3 z-20 flex items-center rounded-lg border border-white/10 bg-black/70 p-0.5 backdrop-blur-md shadow-lg">
                <button
                  type="button"
                  onClick={() => setViewport("desktop")}
                  className={`p-1.5 rounded-md transition-all ${
                    viewport === "desktop"
                      ? "bg-primary/20 text-primary shadow-sm"
                      : "text-neutral-400 hover:text-white"
                  }`}
                  title="Desktop (100%)"
                >
                  <Monitor className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewport("tablet")}
                  className={`p-1.5 rounded-md transition-all ${
                    viewport === "tablet"
                      ? "bg-primary/20 text-primary shadow-sm"
                      : "text-neutral-400 hover:text-white"
                  }`}
                  title="Tablet (768px)"
                >
                  <Tablet className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewport("mobile")}
                  className={`p-1.5 rounded-md transition-all ${
                    viewport === "mobile"
                      ? "bg-primary/20 text-primary shadow-sm"
                      : "text-neutral-400 hover:text-white"
                  }`}
                  title="Mobile (375px)"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Preview Frame Container */}
            <div
              className={`transition-all duration-300 relative flex items-center justify-center ${
                isMobile
                  ? "w-full h-full bg-white shadow-none"
                  : viewport === "mobile"
                  ? "w-full max-w-[375px] h-[720px] max-h-full rounded-[28px] sm:rounded-[36px] border-2 sm:border-4 border-neutral-800 shadow-2xl overflow-hidden bg-white"
                  : viewport === "tablet"
                  ? "w-full max-w-[768px] h-full max-h-[850px] rounded-2xl border border-neutral-800 shadow-2xl overflow-hidden bg-white"
                  : "w-full h-full bg-white shadow-inner"
              }`}
            >
              <iframe
                ref={setIframeRef}
                srcDoc={PREVIEW_BASE_DOCUMENT}
                onLoad={handleIframeLoad}
                title="Preview"
                className="w-full h-full bg-white"
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
              />
              {iframePortalRoot && createPortal(
                <HtmlRenderer
                  rawHtml={previewHtml}
                  campaignId={campaign?.id || "preview"}
                  slug={campaign?.slug || "preview"}
                  formSchema={parsedFormSchema}
                  isPreview={true}
                />,
                iframePortalRoot
              )}
            </div>

            {/* Preview label */}
            <div className="absolute top-3 right-3 flex items-center gap-2 text-[10px] uppercase tracking-widest text-white/80 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full font-semibold border border-white/10 shadow-lg z-20">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              Live Preview
            </div>
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------------- */}
      {/* MODALS                                                            */}
      {/* ------------------------------------------------------------------- */}

      {/* Template Picker */}
      {showPicker && (
        <TemplatePicker
          onSelect={handleTemplateSelect}
          onClose={() => setShowPicker(false)}
        />
      )}

      {/* Settings Modal */}
      <CampaignSettingsModal
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        mode={mode}
        plan={plan}
        settings={settings}
        onSettingsChange={handleSettingsChange}
        campaignId={campaign?.id}
        controls={mode === "edit" ? controls : undefined}
        links={campaignLinks}
        onToggleActive={handleToggleActive}
        onToggleProtection={handleToggleProtection}
        onDelete={handleDelete}
        onCheckDomainStatus={handleCheckDomainStatus}
        groups={campaign?.groups}
        tenantMaxGroups={tenantMaxGroups}
      />

      {/* Delete Campaign Confirmation Modal */}
      {showDeleteConfirm && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isPending) {
              setShowDeleteConfirm(false);
            }
          }}
        >
          <div className="bg-neutral-900 border border-destructive/30 rounded-2xl p-6 max-w-md w-full shadow-2xl shadow-destructive/10 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3.5 mb-4">
              <div className="h-12 w-12 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center shrink-0 border border-destructive/20 shadow-inner">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">Excluir Campanha?</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Esta ação é permanente e irreversível</p>
              </div>
            </div>

            <p className="text-sm text-neutral-300 leading-relaxed mb-6">
              Tem certeza que deseja excluir a campanha <strong className="text-white font-semibold">{settings.name || campaign?.name || "esta campanha"}</strong>? Todos os dados, leads, grupos e links de redirecionamento associados serão permanentemente desativados.
            </p>

            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isPending}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-white/10 text-sm font-medium text-muted-foreground hover:text-white hover:bg-white/5 transition-colors disabled:opacity-50"
              >
                <X className="w-4 h-4" />
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isPending}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-destructive text-destructive-foreground text-sm font-semibold hover:bg-destructive/90 transition-all active:scale-[0.98] disabled:opacity-50 shadow-lg shadow-destructive/20"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Excluindo...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Sim, Excluir Campanha
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Compartilhamento */}
      {mode === "edit" && campaign && (
        <CampaignShareModal
          campaignId={campaign.id}
          campaignName={settings.name || campaign.name}
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
        />
      )}
    </div>
  );
}