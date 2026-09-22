"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import {
  Smartphone,
  Monitor,
  Tablet,
  Flame,
  MousePointerClick,
  Sliders,
  Loader2,
  RefreshCw,
  Eye,
  EyeOff,
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

type ViewportMode = "desktop" | "tablet" | "mobile";

// ── Funções Puras Exportadas (Para testes unitários e cálculos limpos) ──

export function getDeviceForViewport(viewport: ViewportMode): "desktop" | "mobile" {
  return viewport === "desktop" ? "desktop" : "mobile";
}

export function getThermalRadius(viewport: ViewportMode): number {
  return viewport === "desktop" ? 28 : 22;
}

export function calculatePointCoordinates(
  xPercent: number,
  yPercent: number,
  width: number,
  height: number
): { px: number; py: number } {
  const clampedX = Math.max(0, Math.min(100, Number(xPercent) || 0));
  const clampedY = Math.max(0, Math.min(100, Number(yPercent) || 0));
  return {
    px: Math.round((clampedX / 100) * Math.max(width, 1)),
    py: Math.round((clampedY / 100) * Math.max(height, 1)),
  };
}

export function buildPreviewDoc(rawHtml?: string): string {
  if (!rawHtml) return "";

  const linkSafetyScript = `
<script id="vortex-link-safety">
  document.addEventListener('click', function(e) {
    var link = e.target.closest('a');
    if (!link) return;
    var href = link.getAttribute('href');
    if (!href) return;
    if (href.startsWith('#')) {
      e.preventDefault();
      var targetId = href.substring(1);
      var targetEl = targetId ? (document.getElementById(targetId) || document.querySelector(href)) : null;
      if (targetEl) {
        targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else if (href === '#' || href === '#inicio') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } else {
      e.preventDefault();
      e.stopPropagation();
    }
  }, true);
</script>`;

  const formSlotHtml = `<div style="padding:24px;border-radius:16px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);text-align:center;"><span style="color:#aaa;font-size:14px;font-weight:600;">Formulário da Campanha</span></div>`;
  const processedHtml = rawHtml.replace(/\{\{FORM_SLOT\}\}/g, formSlotHtml);

  const hasHtmlTag = /<html/i.test(processedHtml) || /<!DOCTYPE/i.test(processedHtml);
  if (hasHtmlTag) {
    if (/<head[^>]*>/i.test(processedHtml)) {
      return processedHtml.replace(/<head[^>]*>/i, (match) => `${match}${linkSafetyScript}`);
    }
    return `${linkSafetyScript}${processedHtml}`;
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
    html, body { width:100%; min-height:100%; font-family:'Inter',system-ui,sans-serif; color-scheme:dark; background:#000; color:#fff; position:relative; }
    input,select,textarea,button { font-family:inherit; color:inherit; }
  </style>
  ${linkSafetyScript}
</head>
<body>
  ${processedHtml}
</body>
</html>`;
}

// ── Componente Principal HeatmapView ──

export default function HeatmapView({ campaignId, campaignSlug, rawHtml }: HeatmapViewProps) {
  const [viewport, setViewport] = useState<ViewportMode>("mobile");
  const [loading, setLoading] = useState(true);
  const [clicks, setClicks] = useState<ClickPoint[]>([]);
  const [totalClicks, setTotalClicks] = useState(0);
  const [opacity, setOpacity] = useState(0.75);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const lastDimensionsRef = useRef<{ width: number; height: number }>({ width: 0, height: 0 });
  const observerRef = useRef<ResizeObserver | null>(null);

  const deviceFilter = getDeviceForViewport(viewport);

  // Desconectar observer no desmonte
  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
    };
  }, []);

  const previewDoc = useMemo(() => {
    return buildPreviewDoc(rawHtml);
  }, [rawHtml]);

  // Buscar cliques da API conforme o dispositivo
  useEffect(() => {
    let isMounted = true;

    async function fetchClicks() {
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

    fetchClicks();

    return () => {
      isMounted = false;
    };
  }, [campaignId, deviceFilter, refreshKey]);

  // Renderizar canvas térmico sobre o corpo do documento do iframe
  const renderHeatmap = useCallback(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    try {
      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!doc || !doc.body) return;

      doc.body.style.position = "relative";

      let canvas = doc.getElementById("vortex-heatmap-canvas") as HTMLCanvasElement | null;
      if (!canvas) {
        canvas = doc.createElement("canvas");
        canvas.id = "vortex-heatmap-canvas";
        canvas.style.cssText =
          "position:absolute;top:0;left:0;pointer-events:none;z-index:99999;";
        doc.body.appendChild(canvas);
      }

      const docWidth = Math.max(
        doc.body.scrollWidth,
        doc.documentElement.scrollWidth,
        doc.body.offsetWidth,
        1
      );
      const docHeight = Math.max(
        doc.body.scrollHeight,
        doc.documentElement.scrollHeight,
        doc.body.offsetHeight,
        1
      );

      lastDimensionsRef.current = { width: docWidth, height: docHeight };

      // Limite seguro de alocação de textura
      const MAX_TEXTURE_H = 16384;
      const targetHeight = Math.min(docHeight, MAX_TEXTURE_H);

      canvas.width = docWidth;
      canvas.height = targetHeight;
      canvas.style.width = `${docWidth}px`;
      canvas.style.height = `${docHeight}px`;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.clearRect(0, 0, docWidth, targetHeight);

      if (!showHeatmap || clicks.length === 0) return;

      const pointRadius = getThermalRadius(viewport);
      const scaleY = targetHeight / docHeight;

      clicks.forEach((pt) => {
        const { px, py } = calculatePointCoordinates(pt.x, pt.y, docWidth, docHeight);
        const drawPy = py * scaleY;

        const radGrad = ctx.createRadialGradient(px, drawPy, 2, px, drawPy, pointRadius);
        radGrad.addColorStop(0, `rgba(239, 68, 68, ${opacity})`);
        radGrad.addColorStop(0.3, `rgba(249, 115, 22, ${opacity * 0.85})`);
        radGrad.addColorStop(0.6, `rgba(234, 179, 8, ${opacity * 0.5})`);
        radGrad.addColorStop(0.85, `rgba(56, 189, 248, ${opacity * 0.2})`);
        radGrad.addColorStop(1, "rgba(56, 189, 248, 0)");

        ctx.fillStyle = radGrad;
        ctx.beginPath();
        ctx.arc(px, drawPy, pointRadius, 0, Math.PI * 2);
        ctx.fill();
      });
    } catch {
      // Ignora restrição cross-origin se houver
    }
  }, [clicks, opacity, showHeatmap, viewport]);

  // Listener para carregar imagens e redimensionamentos do documento do iframe
  const handleIframeLoad = useCallback(() => {
    renderHeatmap();

    try {
      const iframe = iframeRef.current;
      const doc = iframe?.contentDocument || iframe?.contentWindow?.document;
      if (!doc || !doc.body) return;

      // Prevenir navegação acidental ou submissão de formulários no preview
      doc.addEventListener(
        "click",
        (e: MouseEvent) => {
          const target = (e.target as HTMLElement)?.closest("a, button");
          if (target) {
            e.preventDefault();
            e.stopPropagation();
          }
        },
        true
      );

      // Medir novamente quando as imagens do HTML terminarem de baixar
      const images = doc.querySelectorAll("img");
      images.forEach((img) => {
        if (!img.complete) {
          img.addEventListener("load", () => renderHeatmap(), { once: true });
        }
      });

      // Observer para re-renderizar quando o documento expandir dinamicamente
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }

      if (typeof ResizeObserver !== "undefined") {
        const ro = new ResizeObserver(() => {
          const newH = Math.max(doc.body.scrollHeight, doc.documentElement.scrollHeight);
          const newW = Math.max(doc.body.scrollWidth, doc.documentElement.scrollWidth);
          if (
            Math.abs(newH - lastDimensionsRef.current.height) > 16 ||
            Math.abs(newW - lastDimensionsRef.current.width) > 16
          ) {
            renderHeatmap();
          }
        });
        ro.observe(doc.body);
        observerRef.current = ro;
      }
    } catch {
      // Ignora erro se cross-origin
    }

    // Safety timers para renderização garantida
    setTimeout(renderHeatmap, 300);
    setTimeout(renderHeatmap, 900);
  }, [renderHeatmap]);

  // Re-desenhar sempre que cliques, opacidade ou viewport mudarem
  useEffect(() => {
    renderHeatmap();
  }, [renderHeatmap]);

  return (
    <div className="space-y-4">
      {/* Barra de Ferramentas: Viewports iguais ao Editor + Controles de Calor */}
      <div className="p-3 sm:p-4 rounded-2xl bg-card border border-border/70 shadow-sm flex flex-wrap items-center justify-between gap-3">
        {/* Seletor de Viewport idêntico ao CampaignEditor */}
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-xl border border-border/60 bg-muted/70 p-1 shadow-xs">
            <button
              type="button"
              onClick={() => setViewport("desktop")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewport === "desktop"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              title="Desktop (100%)"
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>Desktop</span>
            </button>

            <button
              type="button"
              onClick={() => setViewport("tablet")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewport === "tablet"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              title="Tablet (768px)"
            >
              <Tablet className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Tablet</span>
            </button>

            <button
              type="button"
              onClick={() => setViewport("mobile")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewport === "mobile"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              title="Mobile (390px - Meta Ads)"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Mobile (Meta Ads)</span>
            </button>
          </div>

          {/* Alternar Visibilidade do Calor */}
          <button
            type="button"
            onClick={() => setShowHeatmap(!showHeatmap)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition-colors ${
              showHeatmap
                ? "bg-orange-500/10 border-orange-500/30 text-orange-400 hover:bg-orange-500/20"
                : "bg-muted/60 border-border/50 text-muted-foreground hover:text-foreground"
            }`}
            title={showHeatmap ? "Ocultar manchas térmicas" : "Exibir manchas térmicas"}
          >
            {showHeatmap ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
            <span className="hidden sm:inline">{showHeatmap ? "Calor Ativo" : "Calor Oculto"}</span>
          </button>

          {/* Botão de Atualização */}
          <button
            type="button"
            onClick={() => {
              setRefreshKey((k) => k + 1);
              renderHeatmap();
            }}
            disabled={loading}
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
            title="Atualizar dados e recarregar mapa"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>

        {/* Controles de Intensidade e Contador de Toques */}
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Sliders className="h-3.5 w-3.5" />
            <span className="hidden md:inline">Intensidade:</span>
            <input
              type="range"
              min={0.2}
              max={1}
              step={0.05}
              value={opacity}
              onChange={(e) => setOpacity(Number(e.target.value))}
              className="w-16 sm:w-24 h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
            />
            <span className="text-[11px] font-mono w-8">{Math.round(opacity * 100)}%</span>
          </div>

          <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20">
            <Flame className="h-3.5 w-3.5" />
            {totalClicks} toques
          </span>
        </div>
      </div>

      {/* Frame de Preview: Idêntico ao CampaignEditor */}
      <div className="relative rounded-2xl border border-border/80 bg-[#0a0a0a] p-2 sm:p-4 lg:p-6 shadow-xl flex flex-col items-center justify-center min-h-[500px] w-full overflow-hidden">
        {loading && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/60 backdrop-blur-xs">
            <Loader2 className="h-7 w-7 animate-spin text-primary" />
          </div>
        )}

        <div
          className={`transition-all duration-300 relative flex items-center justify-center ${
            viewport === "mobile"
              ? "w-full max-w-[390px] h-[740px] max-h-[82vh] rounded-[36px] border-4 border-neutral-800 shadow-2xl overflow-hidden bg-black flex flex-col"
              : viewport === "tablet"
              ? "w-full max-w-[768px] h-[750px] max-h-[82vh] rounded-2xl border-2 border-neutral-800 shadow-2xl overflow-hidden bg-black flex flex-col"
              : "w-full h-[750px] max-h-[82vh] rounded-2xl border border-border/80 shadow-2xl overflow-hidden bg-black flex flex-col"
          }`}
        >
          {/* Barra de Navegador do Desktop */}
          {viewport === "desktop" && (
            <div className="h-9 px-4 bg-zinc-900/90 border-b border-white/5 flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
              </div>
              <div className="flex-1 max-w-sm mx-auto h-5 rounded-md bg-zinc-950/80 border border-white/5 px-2 text-[10px] font-mono text-muted-foreground flex items-center justify-center truncate">
                vortexpages.online/{campaignSlug}
              </div>
              <div className="text-[10px] text-muted-foreground font-mono">
                Desktop (100%)
              </div>
            </div>
          )}

          {/* Notch no topo do celular */}
          {viewport === "mobile" && (
            <div className="h-5 bg-neutral-900 flex items-center justify-center shrink-0 border-b border-white/5">
              <div className="w-20 h-2 bg-black rounded-full" />
            </div>
          )}

          {/* Iframe que rola naturalmente e renderiza o site completo com estilos 100% reais */}
          <iframe
            ref={iframeRef}
            src={campaignSlug ? `/${campaignSlug}?preview=true` : undefined}
            srcDoc={campaignSlug ? undefined : (previewDoc || undefined)}
            onLoad={handleIframeLoad}
            title="Preview do Mapa de Calor"
            className="w-full flex-1 border-0 block bg-black"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          />
        </div>

        {/* Mensagem se não houver cliques */}
        {!loading && clicks.length === 0 && (
          <div className="mt-4 p-3.5 rounded-xl border border-dashed border-border/70 bg-card/60 text-center max-w-md">
            <MousePointerClick className="h-5 w-5 text-muted-foreground mx-auto mb-1.5" />
            <p className="text-xs font-semibold text-foreground">
              Nenhum toque gravado no modo {viewport === "desktop" ? "Desktop" : "Mobile"}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Os toques térmicos aparecem aqui conforme os visitantes interagem com o link da campanha.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
