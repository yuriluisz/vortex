"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import {
  Smartphone,
  Monitor,
  Tablet,
  Maximize2,
  Minimize2,
  Flame,
  MousePointerClick,
  Sliders,
  Loader2,
  RefreshCw,
  Eye,
  EyeOff,
  ArrowDownCircle,
  ZoomIn,
} from "lucide-react";

interface HeatmapViewProps {
  campaignId: string;
  campaignSlug: string;
  rawHtml?: string;
}

interface ClickPoint {
  x: number; // 0 - 100% da largura
  y: number; // 0 - 100% da altura total do documento
  device: string;
}

type MobilePreset = "390" | "360" | "428" | "fluid";
type DesktopPreset = "fluid" | "1200" | "tablet";
type ViewMode = "window" | "full";

// ── Pure Helpers (Exported for Unit Testing & Loop Prevention) ──

export function getSimulatedViewportHeight(
  deviceFilter: "mobile" | "desktop",
  mobilePreset: string,
  desktopPreset: string
): number {
  if (deviceFilter === "mobile") {
    switch (mobilePreset) {
      case "360":
        return 780;
      case "428":
        return 926;
      case "fluid":
        return 800;
      case "390":
      default:
        return 844;
    }
  }
  if (desktopPreset === "tablet") return 1024;
  return 800;
}

export function buildPreviewDoc(rawHtml?: string, viewportHeight = 800): string {
  if (!rawHtml) return "";
  const hasHtmlTag = /<html/i.test(rawHtml) || /<!DOCTYPE/i.test(rawHtml);
  const safetyCss = `
<style id="vortex-preview-safety">
  :root { --vortex-viewport-h: ${viewportHeight}px; }
  html, body {
    width: 100%;
    height: auto !important;
    min-height: var(--vortex-viewport-h) !important;
    overflow-y: visible !important;
  }
  .min-h-screen, [class*="min-h-screen"], [style*="min-height: 100vh"], [style*="min-height:100vh"] {
    min-height: var(--vortex-viewport-h) !important;
  }
  .h-screen, [class*="h-screen"], [style*="height: 100vh"], [style*="height:100vh"] {
    height: var(--vortex-viewport-h) !important;
  }
</style>`;

  if (hasHtmlTag) {
    if (/<head[^>]*>/i.test(rawHtml)) {
      return rawHtml.replace(/<head[^>]*>/i, (match) => `${match}${safetyCss}`);
    }
    return `${safetyCss}${rawHtml}`;
  }

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    input,select,textarea,button { font-family:inherit; color:inherit; }
  </style>
  ${safetyCss}
</head>
<body style="font-family:'Inter',system-ui,sans-serif; color-scheme:dark; background:#000; color:#fff;">
  ${rawHtml.replace(/\{\{FORM_SLOT\}\}/g, '<div style="padding:20px;border-radius:12px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);text-align:center;"><span style="color:#aaa;font-size:13px;">Formulário da Campanha</span></div>')}
</body>
</html>`;
}

export function clampIframeHeight(
  measured: number,
  minHeight: number,
  maxHeight = 10000
): number {
  if (isNaN(measured) || measured <= 0) return minHeight;
  return Math.min(Math.max(measured, minHeight), maxHeight);
}

export function shouldUpdateHeight(
  currentHeight: number,
  nextHeight: number,
  threshold = 16
): boolean {
  return Math.abs(currentHeight - nextHeight) >= threshold;
}

export function getSafeCanvasDimensions(
  width: number,
  height: number,
  rawDpr = 1
): {
  canvasWidth: number;
  canvasHeight: number;
  styleWidth: number;
  styleHeight: number;
  scaleY: number;
  dpr: number;
} {
  const safeDpr = Math.min(Math.max(rawDpr, 1), 1.5);
  const MAX_CANVAS_HEIGHT = 8192;
  const MAX_CANVAS_WIDTH = 4096;

  const styleWidth = Math.max(1, Math.round(width));
  const styleHeight = Math.max(1, Math.round(height));

  const cappedHeight = Math.min(styleHeight, MAX_CANVAS_HEIGHT);
  const cappedWidth = Math.min(styleWidth, MAX_CANVAS_WIDTH);

  const canvasWidth = Math.round(cappedWidth * safeDpr);
  const canvasHeight = Math.round(cappedHeight * safeDpr);

  const scaleY = cappedHeight / styleHeight;

  return {
    canvasWidth,
    canvasHeight,
    styleWidth,
    styleHeight,
    scaleY,
    dpr: safeDpr,
  };
}

export default function HeatmapView({ campaignId, campaignSlug, rawHtml }: HeatmapViewProps) {
  // ── Filtros e Configurações de Exibição ──
  const [deviceFilter, setDeviceFilter] = useState<"mobile" | "desktop">("mobile");
  const [mobilePreset, setMobilePreset] = useState<MobilePreset>("390");
  const [desktopPreset, setDesktopPreset] = useState<DesktopPreset>("fluid");
  const [viewMode, setViewMode] = useState<ViewMode>("window");
  const [zoom, setZoom] = useState<number>(100);

  // ── Altura de Viewport Simulada do Dispositivo ──
  const simulatedViewportHeight = useMemo(
    () => getSimulatedViewportHeight(deviceFilter, mobilePreset, desktopPreset),
    [deviceFilter, mobilePreset, desktopPreset]
  );

  // ── Estado de Dados ──
  const [loading, setLoading] = useState(true);
  const [clicks, setClicks] = useState<ClickPoint[]>([]);
  const [totalClicks, setTotalClicks] = useState(0);
  const [opacity, setOpacity] = useState(0.75);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  // ── Dimensões Dinâmicas do Preview e Documento ──
  const [iframeHeight, setIframeHeight] = useState<number>(simulatedViewportHeight);
  const [containerWidth, setContainerWidth] = useState(390);

  // Altura efetiva garantindo o mínimo do viewport simulado (sem disparar cascata de renders)
  const effectiveHeight = Math.max(iframeHeight, simulatedViewportHeight);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const contentWrapperRef = useRef<HTMLDivElement>(null);

  // ── Documento de Preview Completo (srcDoc para carregamento instantâneo) ──
  const previewDoc = useMemo(() => {
    return buildPreviewDoc(rawHtml, simulatedViewportHeight);
  }, [rawHtml, simulatedViewportHeight]);

  // ── Buscar dados de cliques na API ──
  useEffect(() => {
    let isMounted = true;

    async function fetchData() {
      try {
        setLoading(true);
        const res = await fetch(
          `/api/analytics/recordings/${campaignId}/heatmap?device=${deviceFilter}`
        );
        if (res.ok && isMounted) {
          const data = await res.json();
          setClicks(data.clicks || []);
          setTotalClicks(data.totalClicks || 0);
        }
      } catch (err) {
        console.error("Erro ao buscar dados do heatmap:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [campaignId, deviceFilter, refreshKey]);

  // ── Garantir injeção de CSS de segurança no documento do iframe ──
  const ensureDocSafety = useCallback(
    (doc: Document) => {
      try {
        let styleEl = doc.getElementById("vortex-preview-safety") as HTMLStyleElement | null;
        if (!styleEl) {
          styleEl = doc.createElement("style");
          styleEl.id = "vortex-preview-safety";
          doc.head?.appendChild(styleEl);
        }
        styleEl.textContent = `
          :root { --vortex-viewport-h: ${simulatedViewportHeight}px; }
          html, body {
            width: 100%;
            height: auto !important;
            min-height: var(--vortex-viewport-h) !important;
            overflow-y: visible !important;
          }
          .min-h-screen, [class*="min-h-screen"], [style*="min-height: 100vh"], [style*="min-height:100vh"] {
            min-height: var(--vortex-viewport-h) !important;
          }
          .h-screen, [class*="h-screen"], [style*="height: 100vh"], [style*="height:100vh"] {
            height: var(--vortex-viewport-h) !important;
          }
        `;
      } catch {
        // Ignora restrição cross-origin
      }
    },
    [simulatedViewportHeight]
  );

  // ── Medir altura real do documento dentro do iframe com proteção anti-loop ──
  const measureIframe = useCallback(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    try {
      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      if (doc) {
        ensureDocSafety(doc);

        let measured = 0;

        // 1. Limites dos nós filhos de body (ignora tags auxiliares de scripts/estilos)
        if (doc.body && doc.body.children.length > 0) {
          let maxBottom = 0;
          for (let i = 0; i < doc.body.children.length; i++) {
            const child = doc.body.children[i] as HTMLElement;
            if (child.tagName === "SCRIPT" || child.tagName === "STYLE") continue;
            const bottom = (child.offsetTop || 0) + (child.offsetHeight || 0);
            if (bottom > maxBottom) maxBottom = bottom;
          }
          if (maxBottom > 0) {
            measured = maxBottom;
          }
        }

        // 2. Body scrollHeight (com height: auto, reflete exatamente a extensão natural)
        const bodyScroll = doc.body?.scrollHeight || 0;
        if (bodyScroll > 0) {
          measured = measured > 0 ? Math.max(measured, bodyScroll) : bodyScroll;
        }

        const safeHeight = clampIframeHeight(measured, simulatedViewportHeight, 10000);

        setIframeHeight((prev) => (shouldUpdateHeight(prev, safeHeight, 16) ? safeHeight : prev));
      }
    } catch {
      // Ignora restrição cross-origin se houver
    }

    if (contentWrapperRef.current) {
      setContainerWidth(contentWrapperRef.current.clientWidth);
    }
  }, [ensureDocSafety, simulatedViewportHeight]);

  // Observar redimensionamento do container e do iframe de forma reativa e segura
  useEffect(() => {
    measureIframe();

    const wrapper = contentWrapperRef.current;
    let wrapperRo: ResizeObserver | null = null;
    if (wrapper && typeof ResizeObserver !== "undefined") {
      wrapperRo = new ResizeObserver(() => {
        setContainerWidth(wrapper.clientWidth);
        measureIframe();
      });
      wrapperRo.observe(wrapper);
    }

    const iframe = iframeRef.current;
    let docRo: ResizeObserver | null = null;
    let rafId: number | null = null;

    const throttledMeasure = () => {
      if (rafId !== null) return;
      rafId = requestAnimationFrame(() => {
        rafId = null;
        measureIframe();
      });
    };

    const attachDocObserver = () => {
      throttledMeasure();
      try {
        const doc = iframe?.contentDocument || iframe?.contentWindow?.document;
        if (doc) {
          ensureDocSafety(doc);
          // OBSERVAR APENAS O BODY (NUNCA O DOCUMENTELEMENT PARA NÃO DISPARAR FEEDBACK LOOP COM IFRAME)
          if (doc.body && typeof ResizeObserver !== "undefined") {
            docRo = new ResizeObserver(() => throttledMeasure());
            docRo.observe(doc.body);
          }
          // Medir novamente quando imagens terminarem de carregar
          const images = doc.querySelectorAll("img");
          images.forEach((img) => {
            if (!img.complete) {
              img.addEventListener("load", throttledMeasure, { once: true });
            }
          });
        }
      } catch {
        // Ignora restrição cross-origin se houver
      }
    };

    if (iframe) {
      iframe.addEventListener("load", attachDocObserver);
      attachDocObserver();
    }

    const t1 = setTimeout(throttledMeasure, 150);
    const t2 = setTimeout(throttledMeasure, 600);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      if (rafId !== null) cancelAnimationFrame(rafId);
      if (wrapperRo) wrapperRo.disconnect();
      if (docRo) docRo.disconnect();
      if (iframe) iframe.removeEventListener("load", attachDocObserver);
    };
  }, [measureIframe, deviceFilter, mobilePreset, desktopPreset, refreshKey, previewDoc, ensureDocSafety]);

  // ── Renderizar pontos térmicos no Canvas sobre o Iframe com segurança de GPU ──
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rawWidth = containerWidth || (deviceFilter === "mobile" ? 390 : 960);
    const rawHeight = effectiveHeight;
    const windowDpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;

    const {
      canvasWidth,
      canvasHeight,
      styleWidth,
      styleHeight,
      scaleY,
      dpr,
    } = getSafeCanvasDimensions(rawWidth, rawHeight, windowDpr);

    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    canvas.style.width = `${styleWidth}px`;
    canvas.style.height = `${styleHeight}px`;

    // Transformação coordenada: dpr horizontal e dpr * scaleY vertical para páginas longas
    ctx.setTransform(dpr, 0, 0, scaleY * dpr, 0, 0);

    ctx.clearRect(0, 0, styleWidth, styleHeight);

    if (!showHeatmap || clicks.length === 0) return;

    // Raio térmico proporcional ao dispositivo
    const pointRadius = deviceFilter === "mobile" ? 28 : 22;

    clicks.forEach((pt) => {
      const px = (pt.x / 100) * styleWidth;
      const py = (pt.y / 100) * styleHeight;

      const radGrad = ctx.createRadialGradient(px, py, 2, px, py, pointRadius);
      radGrad.addColorStop(0, `rgba(239, 68, 68, ${opacity})`);
      radGrad.addColorStop(0.3, `rgba(249, 115, 22, ${opacity * 0.85})`);
      radGrad.addColorStop(0.6, `rgba(234, 179, 8, ${opacity * 0.5})`);
      radGrad.addColorStop(0.85, `rgba(56, 189, 248, ${opacity * 0.2})`);
      radGrad.addColorStop(1, "rgba(56, 189, 248, 0)");

      ctx.fillStyle = radGrad;
      ctx.beginPath();
      ctx.arc(px, py, pointRadius, 0, Math.PI * 2);
      ctx.fill();
    });
  }, [clicks, opacity, deviceFilter, effectiveHeight, containerWidth, showHeatmap]);

  // ── Classes de Largura Responsiva por Preset ──
  const getMobileWidthClass = () => {
    switch (mobilePreset) {
      case "360":
        return "w-full max-w-[360px]";
      case "428":
        return "w-full max-w-[428px]";
      case "fluid":
        return "w-full max-w-lg";
      case "390":
      default:
        return "w-full max-w-[390px]";
    }
  };

  const getDesktopWidthClass = () => {
    switch (desktopPreset) {
      case "1200":
        return "w-full max-w-[1200px]";
      case "tablet":
        return "w-full max-w-[768px]";
      case "fluid":
      default:
        return "w-full max-w-6xl";
    }
  };

  const zoomScale = zoom / 100;

  return (
    <div className="space-y-4">
      {/* Barra de Ferramentas com Controles de Responsividade e Dimensionamento */}
      <div className="p-3 sm:p-4 rounded-2xl bg-card border border-border/70 shadow-sm space-y-3">
        {/* Linha 1: Seletor de Dispositivo + Presets de Dimensão + Modo de Altura */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {/* Seletor Principal: Mobile vs Desktop */}
            <div className="flex items-center p-1 rounded-xl bg-muted/70 border border-border/50">
              <button
                type="button"
                onClick={() => setDeviceFilter("mobile")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  deviceFilter === "mobile"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Smartphone className="h-3.5 w-3.5" />
                Mobile (Meta Ads)
              </button>
              <button
                type="button"
                onClick={() => setDeviceFilter("desktop")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  deviceFilter === "desktop"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Monitor className="h-3.5 w-3.5" />
                Desktop
              </button>
            </div>

            {/* Presets de Largura Específicos por Dispositivo */}
            {deviceFilter === "mobile" ? (
              <div className="flex items-center p-1 rounded-xl bg-muted/50 border border-border/40 text-xs">
                <span className="text-[10px] text-muted-foreground px-2 font-medium hidden sm:inline">
                  Largura:
                </span>
                <button
                  type="button"
                  onClick={() => setMobilePreset("360")}
                  className={`px-2 py-1 rounded-md text-[11px] font-medium transition-all ${
                    mobilePreset === "360"
                      ? "bg-background text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  title="360px - Android Compacto"
                >
                  360px
                </button>
                <button
                  type="button"
                  onClick={() => setMobilePreset("390")}
                  className={`px-2 py-1 rounded-md text-[11px] font-medium transition-all ${
                    mobilePreset === "390"
                      ? "bg-background text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  title="390px - iPhone 14/15/16 (Padrão)"
                >
                  390px
                </button>
                <button
                  type="button"
                  onClick={() => setMobilePreset("428")}
                  className={`px-2 py-1 rounded-md text-[11px] font-medium transition-all ${
                    mobilePreset === "428"
                      ? "bg-background text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  title="428px - Pro Max / Plus"
                >
                  428px
                </button>
                <button
                  type="button"
                  onClick={() => setMobilePreset("fluid")}
                  className={`px-2 py-1 rounded-md text-[11px] font-medium transition-all ${
                    mobilePreset === "fluid"
                      ? "bg-background text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  title="100% Fluido"
                >
                  Fluido
                </button>
              </div>
            ) : (
              <div className="flex items-center p-1 rounded-xl bg-muted/50 border border-border/40 text-xs">
                <span className="text-[10px] text-muted-foreground px-2 font-medium hidden sm:inline">
                  Visualização:
                </span>
                <button
                  type="button"
                  onClick={() => setDesktopPreset("fluid")}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                    desktopPreset === "fluid"
                      ? "bg-background text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  title="Largura fluida máxima"
                >
                  Fluido
                </button>
                <button
                  type="button"
                  onClick={() => setDesktopPreset("1200")}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                    desktopPreset === "1200"
                      ? "bg-background text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  title="1200px - Padrão Desktop"
                >
                  1200px
                </button>
                <button
                  type="button"
                  onClick={() => setDesktopPreset("tablet")}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                    desktopPreset === "tablet"
                      ? "bg-background text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  title="768px - Tablet / iPad"
                >
                  <Tablet className="h-3 w-3" />
                  768px
                </button>
              </div>
            )}
          </div>

          {/* Alternância de Modo de Altura: Janela vs Página Completa */}
          <div className="flex items-center p-1 rounded-xl bg-muted/70 border border-border/50">
            <button
              type="button"
              onClick={() => setViewMode("window")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === "window"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              title="Janela rolável com tamanho de viewport do dispositivo"
            >
              <Minimize2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Modo</span> Janela
            </button>
            <button
              type="button"
              onClick={() => setViewMode("full")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === "full"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              title="Expandir para a altura total da landing page (rola com a página inteira)"
            >
              <Maximize2 className="h-3.5 w-3.5" />
              Página Completa
            </button>
          </div>
        </div>

        {/* Linha 2: Zoom, Visibilidade do Calor, Intensidade e Estatísticas */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-border/40">
          <div className="flex flex-wrap items-center gap-2">
            {/* Controle de Zoom / Escala */}
            <div className="flex items-center p-0.5 rounded-xl bg-muted/50 border border-border/40">
              <span className="text-[10px] text-muted-foreground pl-2 pr-1 flex items-center gap-1">
                <ZoomIn className="h-3 w-3" />
                <span className="hidden md:inline">Zoom:</span>
              </span>
              {[70, 85, 100].map((z) => (
                <button
                  key={z}
                  type="button"
                  onClick={() => setZoom(z)}
                  className={`px-2 py-1 rounded-lg text-[11px] font-medium transition-all ${
                    zoom === z
                      ? "bg-background text-foreground shadow-xs font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {z}%
                </button>
              ))}
            </div>

            {/* Alternar Manchas de Calor */}
            <button
              type="button"
              onClick={() => setShowHeatmap(!showHeatmap)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-colors ${
                showHeatmap
                  ? "bg-orange-500/10 border-orange-500/30 text-orange-400 hover:bg-orange-500/20"
                  : "bg-muted/60 border-border/50 text-muted-foreground hover:text-foreground"
              }`}
              title={showHeatmap ? "Ocultar manchas térmicas" : "Exibir manchas térmicas"}
            >
              {showHeatmap ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
              {showHeatmap ? "Calor Ativo" : "Calor Oculto"}
            </button>

            {/* Recarregar e Recalcular */}
            <button
              type="button"
              onClick={() => {
                setRefreshKey((k) => k + 1);
                measureIframe();
              }}
              disabled={loading}
              className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
              title="Atualizar dados e recalcular dimensões"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>

          <div className="flex items-center gap-4">
            {/* Slider de Intensidade */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Sliders className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Intensidade:</span>
              <input
                type="range"
                min={0.2}
                max={1}
                step={0.05}
                value={opacity}
                onChange={(e) => setOpacity(Number(e.target.value))}
                className="w-16 sm:w-20 h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <span className="text-[11px] font-mono w-7">{Math.round(opacity * 100)}%</span>
            </div>

            {/* Contador de Toques */}
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg bg-orange-500/10 text-orange-400 border border-orange-500/20">
              <Flame className="h-3.5 w-3.5" />
              {totalClicks} toques
            </span>
          </div>
        </div>
      </div>

      {/* Dica de Rolagem e Dimensão Atual */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground px-2">
        <span className="flex items-center gap-1.5 font-medium text-[11px] sm:text-xs">
          <ArrowDownCircle className="h-3.5 w-3.5 text-primary shrink-0" />
          {viewMode === "full"
            ? "Página completa expandida: use a rolagem natural da página para inspecionar todo o mapa"
            : "Modo janela: role verticalmente o visor do dispositivo para inspecionar os toques"}
        </span>
        <span className="text-[11px] font-mono opacity-80 bg-muted/60 px-2 py-0.5 rounded-md border border-border/40">
          {containerWidth}px × {effectiveHeight}px
        </span>
      </div>

      {/* Visualizador com Moldura Responsiva e Dimensionamento Dinâmico */}
      <div className="relative rounded-2xl border border-border/80 bg-zinc-950/80 p-2 sm:p-4 lg:p-6 shadow-xl overflow-hidden flex flex-col items-center w-full min-h-[400px]">
        {loading && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/60 backdrop-blur-xs">
            <Loader2 className="h-7 w-7 animate-spin text-primary" />
          </div>
        )}

        {/* Wrapper de Escala / Zoom */}
        <div
          className="w-full flex justify-center transition-transform duration-200"
          style={
            zoom !== 100
              ? {
                  transform: `scale(${zoomScale})`,
                  transformOrigin: "top center",
                  marginBottom: `-${Math.round((viewMode === "full" ? effectiveHeight : 600) * (1 - zoomScale))}px`,
                }
              : undefined
          }
        >
          {deviceFilter === "mobile" ? (
            /* Moldura Smartphone Responsiva */
            <div
              className={`${getMobileWidthClass()} rounded-2xl sm:rounded-[36px] border-2 sm:border-[6px] lg:border-[8px] border-zinc-800 bg-zinc-950 shadow-2xl overflow-hidden relative ring-1 ring-white/10 my-2 transition-all duration-200`}
            >
              {/* Notch / Dynamic Island */}
              <div className="h-5 sm:h-6 bg-zinc-900 flex items-center justify-center relative z-20 border-b border-white/5">
                <div className="w-16 sm:w-24 h-2.5 sm:h-3.5 bg-black rounded-full" />
              </div>

              {/* Viewport: Janela com scroll ou Página Completa expandida */}
              <div
                className={`${
                  viewMode === "full"
                    ? "h-auto overflow-visible"
                    : "h-[min(68vh,660px)] min-h-[440px] overflow-y-auto overflow-x-hidden overscroll-contain scrollbar-thin scrollbar-thumb-zinc-700 hover:scrollbar-thumb-zinc-600"
                } relative bg-black`}
              >
                <div
                  ref={contentWrapperRef}
                  className="relative w-full"
                  style={{ height: `${effectiveHeight}px`, minHeight: "100%" }}
                >
                  <iframe
                    ref={iframeRef}
                    srcDoc={previewDoc || undefined}
                    src={previewDoc ? undefined : `/${campaignSlug}?preview=true`}
                    onLoad={measureIframe}
                    className="w-full pointer-events-none border-0 block bg-black"
                    style={{ height: `${effectiveHeight}px`, minHeight: "100%" }}
                    tabIndex={-1}
                    title="Preview da Campanha Mobile"
                  />

                  <canvas
                    ref={canvasRef}
                    className="absolute inset-0 w-full h-full pointer-events-none z-10"
                  />
                </div>
              </div>
            </div>
          ) : (
            /* Moldura Desktop / Tablet Responsiva */
            <div
              className={`${getDesktopWidthClass()} rounded-2xl border border-border/80 bg-zinc-950 shadow-2xl overflow-hidden my-2 transition-all duration-200`}
            >
              {/* Barra do Navegador */}
              <div className="h-9 px-3 sm:px-4 bg-zinc-900 border-b border-border/60 flex items-center justify-between gap-3">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                </div>
                <div className="flex-1 max-w-sm mx-auto h-5 rounded-md bg-zinc-950/80 border border-white/5 px-2 text-[10px] font-mono text-muted-foreground flex items-center justify-center truncate">
                  vortexpages.online/{campaignSlug}
                </div>
                <div className="hidden sm:flex items-center text-[10px] text-muted-foreground font-mono">
                  {desktopPreset === "tablet" ? "iPad 768px" : "Desktop"}
                </div>
              </div>

              {/* Viewport: Janela com scroll ou Página Completa expandida */}
              <div
                className={`${
                  viewMode === "full"
                    ? "h-auto overflow-visible"
                    : "h-[min(68vh,660px)] min-h-[440px] overflow-y-auto overflow-x-hidden overscroll-contain scrollbar-thin scrollbar-thumb-zinc-700 hover:scrollbar-thumb-zinc-600"
                } relative bg-black`}
              >
                <div
                  ref={contentWrapperRef}
                  className="relative w-full"
                  style={{ height: `${effectiveHeight}px`, minHeight: "100%" }}
                >
                  <iframe
                    ref={iframeRef}
                    srcDoc={previewDoc || undefined}
                    src={previewDoc ? undefined : `/${campaignSlug}?preview=true`}
                    onLoad={measureIframe}
                    className="w-full pointer-events-none border-0 block bg-black"
                    style={{ height: `${effectiveHeight}px`, minHeight: "100%" }}
                    tabIndex={-1}
                    title="Preview da Campanha Desktop"
                  />

                  <canvas
                    ref={canvasRef}
                    className="absolute inset-0 w-full h-full pointer-events-none z-10"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Mensagem informativa caso não haja cliques gravados */}
        {!loading && clicks.length === 0 && (
          <div className="mt-4 p-3.5 rounded-xl border border-dashed border-border/70 bg-card/60 text-center max-w-md">
            <MousePointerClick className="h-5 w-5 text-muted-foreground mx-auto mb-1.5" />
            <p className="text-xs font-semibold text-foreground">
              Nenhum toque gravado no modo {deviceFilter === "mobile" ? "Mobile" : "Desktop"}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Os cliques aparecem aqui automaticamente conforme os visitantes interagem com o link da campanha.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
