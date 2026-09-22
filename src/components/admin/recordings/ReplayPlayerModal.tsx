"use client";

import { useEffect, useRef, useState, useCallback, useMemo, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import "rrweb/dist/style.css";
import {
  X,
  Play,
  Pause,
  Smartphone,
  Monitor,
  Tablet,
  Clock,
  MousePointerClick,
  Loader2,
  Tag,
  AlertTriangle,
  RotateCcw,
} from "lucide-react";

interface RecordingMetadata {
  id: string;
  sessionId: string;
  campaignId: string;
  campaignName: string;
  duration: number;
  clicksCount: number;
  device: string;
  browser?: string;
  os?: string;
  pageUrl: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  createdAt: string;
}

export interface ReplayPlayerModalProps {
  sessionId: string;
  onClose: () => void;
}

interface EventWithMeta {
  type: number;
  timestamp: number;
  data: unknown;
  delay?: number;
  [key: string]: unknown;
}

export function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/**
 * Validação estrita de eventos de gravação para proteger o rrweb contra dados corrompidos.
 */
export function validateReplayEvents(rawEvents: unknown): {
  valid: boolean;
  error?: string;
  events?: EventWithMeta[];
} {
  if (!rawEvents || !Array.isArray(rawEvents) || rawEvents.length === 0) {
    return {
      valid: false,
      error: "Esta sessão não possui eventos de tela registrados.",
    };
  }

  const validEvents: EventWithMeta[] = [];
  for (const ev of rawEvents) {
    if (
      ev &&
      typeof ev === "object" &&
      typeof (ev as EventWithMeta).type === "number" &&
      typeof (ev as EventWithMeta).timestamp === "number" &&
      !isNaN((ev as EventWithMeta).timestamp)
    ) {
      validEvents.push(ev as EventWithMeta);
    }
  }

  if (validEvents.length < 2) {
    return {
      valid: false,
      error: "A gravação contém dados insuficientes para reprodução.",
    };
  }

  const hasFullSnapshot = validEvents.some((ev) => ev.type === 2);
  if (!hasFullSnapshot) {
    return {
      valid: false,
      error: "Gravação incompleta: snapshot inicial da página não foi encontrado.",
    };
  }

  validEvents.sort((a, b) => a.timestamp - b.timestamp);

  return { valid: true, events: validEvents };
}

/**
 * Calcula o fator de escala ideal mantendo a proporção (aspect ratio) da tela gravada,
 * impedindo distorções e cortes visuais.
 */
export function calculateReplayScale(
  containerW: number,
  containerH: number,
  contentW: number,
  contentH: number,
  padding = 32
): number {
  if (containerW <= 0 || containerH <= 0 || contentW <= 0 || contentH <= 0) {
    return 1;
  }

  const availW = Math.max(containerW - padding, 10);
  const availH = Math.max(containerH - padding, 10);

  const scaleW = availW / contentW;
  const scaleH = availH / contentH;

  const scale = Math.min(scaleW, scaleH, 1);
  return Math.max(0.1, Math.round(scale * 1000) / 1000);
}

/**
 * Calcula a duração total em segundos com proteção contra NaN ou 0ms
 */
export function calculateReplayDuration(
  metaTotalTime: number | null | undefined,
  recordingDuration: number | null | undefined
): number {
  if (typeof metaTotalTime === "number" && !isNaN(metaTotalTime) && metaTotalTime > 0) {
    return Math.max(1, Math.round(metaTotalTime / 1000));
  }
  if (typeof recordingDuration === "number" && !isNaN(recordingDuration) && recordingDuration > 0) {
    return Math.max(1, Math.round(recordingDuration));
  }
  return 1;
}

/**
 * Trava de scroll do document.body 100% à prova de vazamento de estado usando contagem de referência.
 * Compensa a largura da scrollbar para evitar layout shift no Windows/Linux.
 */
export function lockBodyScroll(): () => void {
  if (typeof document === "undefined" || !document.body) return () => {};

  const body = document.body;
  const currentLocks = parseInt(body.dataset.vtxModalLocks || "0", 10);

  if (currentLocks === 0) {
    const scrollbarWidth =
      typeof window !== "undefined" && document.documentElement
        ? window.innerWidth - document.documentElement.clientWidth
        : 0;
    body.dataset.vtxPrevOverflow = body.style.overflow || "";
    body.dataset.vtxPrevPaddingRight = body.style.paddingRight || "";
    body.style.overflow = "hidden";
    if (scrollbarWidth > 0) {
      body.style.paddingRight = `${scrollbarWidth}px`;
    }
  }
  body.dataset.vtxModalLocks = String(currentLocks + 1);

  return () => {
    const remainingLocks = parseInt(body.dataset.vtxModalLocks || "1", 10) - 1;
    if (remainingLocks <= 0) {
      delete body.dataset.vtxModalLocks;
      body.style.overflow = body.dataset.vtxPrevOverflow || "";
      delete body.dataset.vtxPrevOverflow;
      body.style.paddingRight = body.dataset.vtxPrevPaddingRight || "";
      delete body.dataset.vtxPrevPaddingRight;
    } else {
      body.dataset.vtxModalLocks = String(remainingLocks);
    }
  };
}

export default function ReplayPlayerModal({ sessionId, onClose }: ReplayPlayerModalProps) {
  const isClient = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<RecordingMetadata | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const [speed, setSpeed] = useState<1 | 2 | 4>(1);

  const containerRef = useRef<HTMLDivElement>(null);
  const modalDialogRef = useRef<HTMLDivElement>(null);
  const triggerElementRef = useRef<HTMLElement | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const replayerRef = useRef<any>(null);
  const animFrameRef = useRef<number | null>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  // Preservar e restaurar o elemento com foco antes da abertura do modal
  useEffect(() => {
    if (typeof document !== "undefined") {
      triggerElementRef.current = document.activeElement as HTMLElement | null;
    }
    return () => {
      triggerElementRef.current?.focus?.();
    };
  }, []);

  // Bloqueio de scroll do body com cleanup seguro e atalho ESC
  useEffect(() => {
    const unlock = lockBodyScroll();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onCloseRef.current();
        return;
      }

      // Atalho de teclado: Barra de espaço para Play/Pause
      if (e.key === " " && e.target === modalDialogRef.current) {
        e.preventDefault();
        if (replayerRef.current) {
          // Dispara toggle se não estiver digitando em campos
          const playBtn = modalDialogRef.current?.querySelector<HTMLButtonElement>("[data-action='toggle-play']");
          playBtn?.click();
        }
      }

      // Focus Trap acessível (WCAG 2.1)
      if (e.key === "Tab" && modalDialogRef.current) {
        const focusableElements = modalDialogRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [tabindex="0"]:not([disabled]), input:not([disabled])'
        );
        if (focusableElements.length > 0) {
          const firstElem = focusableElements[0];
          const lastElem = focusableElements[focusableElements.length - 1];

          if (e.shiftKey && document.activeElement === firstElem) {
            e.preventDefault();
            lastElem.focus();
          } else if (!e.shiftKey && document.activeElement === lastElem) {
            e.preventDefault();
            firstElem.focus();
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      unlock();
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Carregar dados da gravação da API (R2) com proteção de desmontagem e AbortController
  useEffect(() => {
    let isMounted = true;
    const abortController = new AbortController();
    let resizeObserver: ResizeObserver | null = null;
    let windowResizeListener: (() => void) | null = null;

    async function loadRecording() {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(`/api/analytics/recordings/${sessionId}/stream`, {
          signal: abortController.signal,
        });

        if (!res.ok) {
          throw new Error("Não foi possível carregar a gravação da sessão.");
        }

        const data = await res.json();
        if (!isMounted) return;

        setMetadata(data.recording);

        // Validação estrita dos eventos da sessão
        const validation = validateReplayEvents(data.events);
        if (!validation.valid || !validation.events) {
          throw new Error(validation.error || "Eventos de sessão inválidos.");
        }

        // Importação dinâmica segura do rrweb no browser
        const rrweb = await import("rrweb");
        const Replayer = rrweb.Replayer;

        if (!isMounted || !containerRef.current) return;
        containerRef.current.innerHTML = "";

        const replayer = new Replayer(validation.events as unknown as any, {
          root: containerRef.current,
          mouseTail: true,
          skipInactive: true,
          showWarning: false,
          UNSAFE_replayCanvas: true,
          insertStyleRules: [
            ".replayer-mouse { z-index: 999999 !important; pointer-events: none !important; }",
            ".replayer-mouse-tail { z-index: 999998 !important; pointer-events: none !important; }",
          ],
        });

        if (!isMounted) {
          try {
            replayer.destroy();
          } catch {}
          return;
        }

        replayerRef.current = replayer;

        const meta = replayer.getMetaData();
        const durationSec = calculateReplayDuration(meta?.totalTime, data.recording?.duration);
        setTotalTime(durationSec);

        replayer.on("finish", () => {
          if (!isMounted) return;
          setIsPlaying(false);
          setCurrentTime(durationSec);
        });

        // Auto-scaling responsivo: centraliza e redimensiona perfeitamente
        const applyScale = (dimensions?: { width: number; height: number }) => {
          if (!isMounted || !containerRef.current) return;
          const wrapper = containerRef.current.querySelector(".replayer-wrapper") as HTMLElement | null;
          if (!wrapper) return;

          const contentW = dimensions?.width || wrapper.offsetWidth || wrapper.clientWidth;
          const contentH = dimensions?.height || wrapper.offsetHeight || wrapper.clientHeight;
          const containerW = containerRef.current.clientWidth;
          const containerH = containerRef.current.clientHeight;

          if (contentW > 0 && contentH > 0 && containerW > 0 && containerH > 0) {
            const scale = calculateReplayScale(containerW, containerH, contentW, contentH, 32);

            wrapper.style.position = "absolute";
            wrapper.style.top = "50%";
            wrapper.style.left = "50%";
            wrapper.style.transformOrigin = "center center";
            wrapper.style.transform = `translate(-50%, -50%) scale(${scale})`;
            wrapper.style.boxShadow = "0 25px 50px -12px rgba(0, 0, 0, 0.65)";
            wrapper.style.borderRadius = "12px";
            wrapper.style.overflow = "hidden";
            wrapper.style.backgroundColor = "#ffffff";
          }
        };

        // Ouvir eventos de resize internos do rrweb
        replayer.on("resize", (dim: unknown) => {
          const d = dim as { width?: number; height?: number } | undefined;
          if (d && typeof d.width === "number" && typeof d.height === "number") {
            applyScale({ width: d.width, height: d.height });
          } else {
            applyScale();
          }
        });

        // Usar ResizeObserver no contêiner do player para reagir a qualquer mudança de layout
        if (typeof ResizeObserver !== "undefined" && containerRef.current) {
          resizeObserver = new ResizeObserver(() => {
            requestAnimationFrame(() => applyScale());
          });
          resizeObserver.observe(containerRef.current);
        } else {
          windowResizeListener = () => applyScale();
          window.addEventListener("resize", windowResizeListener);
        }

        // Executar auto-scale inicial
        requestAnimationFrame(() => applyScale());
        setTimeout(() => applyScale(), 150);

        setLoading(false);
        replayer.play(0);
        setIsPlaying(true);
      } catch (err) {
        if (!isMounted || abortController.signal.aborted) return;
        setError(err instanceof Error ? err.message : "Erro ao carregar gravação.");
        setLoading(false);
      }
    }

    loadRecording();

    return () => {
      isMounted = false;
      abortController.abort();

      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      if (windowResizeListener) {
        window.removeEventListener("resize", windowResizeListener);
      }

      if (replayerRef.current) {
        try {
          replayerRef.current.destroy();
        } catch {}
        replayerRef.current = null;
      }
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
    };
  }, [sessionId]);

  // Loop sincronizado com requestAnimationFrame para timeline
  useEffect(() => {
    let active = true;

    function updateProgress() {
      if (!active) return;
      if (replayerRef.current && isPlaying) {
        try {
          const currMs = replayerRef.current.getCurrentTime();
          if (typeof currMs === "number" && !isNaN(currMs)) {
            const currSec = Math.round(currMs / 1000);
            setCurrentTime(currSec);
          }
        } catch {}
      }
      if (isPlaying) {
        animFrameRef.current = requestAnimationFrame(updateProgress);
      }
    }

    if (isPlaying) {
      animFrameRef.current = requestAnimationFrame(updateProgress);
    }

    return () => {
      active = false;
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
    };
  }, [isPlaying]);

  const togglePlay = useCallback(() => {
    if (!replayerRef.current || loading || Boolean(error)) return;

    if (isPlaying) {
      replayerRef.current.pause();
      setIsPlaying(false);
    } else {
      if (currentTime >= totalTime) {
        replayerRef.current.play(0);
        setCurrentTime(0);
      } else {
        replayerRef.current.play(currentTime * 1000);
      }
      setIsPlaying(true);
    }
  }, [isPlaying, currentTime, totalTime, loading, error]);

  const handleSeek = (seconds: number) => {
    if (!replayerRef.current || loading || Boolean(error)) return;

    const targetSec = Math.max(0, Math.min(seconds, totalTime));
    setCurrentTime(targetSec);
    const targetMs = targetSec * 1000;

    if (isPlaying) {
      replayerRef.current.play(targetMs);
    } else {
      replayerRef.current.pause(targetMs);
    }
  };

  const changeSpeed = () => {
    if (!replayerRef.current || loading || Boolean(error)) return;
    const nextSpeed = speed === 1 ? 2 : speed === 2 ? 4 : 1;
    setSpeed(nextSpeed);
    if (typeof replayerRef.current.setConfig === "function") {
      replayerRef.current.setConfig({ speed: nextSpeed });
    }
  };

  const deviceIcon = useMemo(() => {
    if (metadata?.device === "mobile") {
      return <Smartphone className="h-4 w-4 text-emerald-400" />;
    }
    if (metadata?.device === "tablet") {
      return <Tablet className="h-4 w-4 text-sky-400" />;
    }
    return <Monitor className="h-4 w-4 text-violet-400" />;
  }, [metadata?.device]);

  if (!isClient || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 backdrop-blur-md p-2 sm:p-6 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="replay-title"
    >
      <div
        ref={modalDialogRef}
        tabIndex={-1}
        className="flex flex-col w-full max-w-5xl h-[92vh] bg-card border border-border/80 rounded-2xl shadow-2xl overflow-hidden focus:outline-none"
      >
        {/* Header do Player */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-border/60 bg-muted/30">
          <div className="flex items-center gap-3 min-w-0">
            <span className="p-2 rounded-xl bg-background border border-border/60">
              {deviceIcon}
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 id="replay-title" className="text-sm font-semibold text-foreground truncate">
                  Sessão {sessionId.slice(0, 14)}
                </h3>
                <span className="text-[11px] font-mono uppercase px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                  {metadata?.device || "Dispositivo"}
                </span>
              </div>
              <p className="text-xs text-muted-foreground truncate">
                {metadata?.os || "SO"} · {metadata?.browser || "Navegador"} ·{" "}
                {metadata?.createdAt ? new Date(metadata.createdAt).toLocaleString("pt-BR") : ""}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {metadata?.utmSource && (
              <span className="hidden sm:inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                <Tag className="h-3 w-3" />
                {metadata.utmSource}
                {metadata.utmCampaign ? ` / ${metadata.utmCampaign}` : ""}
              </span>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
              aria-label="Fechar replay (Esc)"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Palco do Replay (Tela Gravada) */}
        <div className="relative flex-1 bg-neutral-950 flex items-center justify-center overflow-hidden select-none">
          {/* O container permanece no DOM para garantir cálculo de dimensões e ResizeObserver */}
          <div
            ref={containerRef}
            className={`w-full h-full relative ${loading || error ? "opacity-0 pointer-events-none" : "opacity-100"}`}
          />

          {loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-muted-foreground bg-neutral-950/80 backdrop-blur-xs z-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm font-medium">Carregando gravação do Cloudflare R2...</p>
            </div>
          )}

          {error && !loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center max-w-md mx-auto p-6 text-center text-muted-foreground z-10">
              <div className="p-3 rounded-2xl bg-rose-500/10 text-rose-400 mb-3 border border-rose-500/20">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <p className="text-sm text-rose-400 mb-2 font-medium">{error}</p>
              <p className="text-xs text-muted-foreground mb-4">
                As gravações são armazenadas no Cloudflare R2 e retidas por 7 dias para controle de custos.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-muted hover:bg-muted/80 text-foreground border border-border/60 transition-colors"
              >
                Voltar à Lista
              </button>
            </div>
          )}
        </div>

        {/* Barra de Controles Inferior */}
        <div className="px-4 sm:px-6 py-3.5 border-t border-border/60 bg-card">
          {/* Linha do Tempo (Scrubber) */}
          <div className="flex items-center gap-3 mb-3">
            <span className="text-xs font-mono font-medium text-muted-foreground min-w-[38px]">
              {formatTime(currentTime)}
            </span>
            <div className="relative flex-1 group">
              <input
                type="range"
                min={0}
                max={totalTime > 0 ? totalTime : 1}
                value={currentTime}
                disabled={loading || Boolean(error) || totalTime === 0}
                onChange={(e) => handleSeek(Number(e.target.value))}
                className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary group-hover:h-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary"
                aria-label="Progresso da reprodução"
                aria-valuemin={0}
                aria-valuemax={totalTime}
                aria-valuenow={currentTime}
                aria-valuetext={`${formatTime(currentTime)} de ${formatTime(totalTime)}`}
              />
            </div>
            <span className="text-xs font-mono font-medium text-muted-foreground min-w-[38px] text-right">
              {formatTime(totalTime)}
            </span>
          </div>

          {/* Botões de Ação */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                type="button"
                data-action="toggle-play"
                onClick={togglePlay}
                disabled={loading || Boolean(error)}
                className="p-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-md shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary"
                aria-label={
                  currentTime >= totalTime
                    ? "Reiniciar reprodução"
                    : isPlaying
                    ? "Pausar replay (Espaço)"
                    : "Iniciar replay (Espaço)"
                }
              >
                {currentTime >= totalTime ? (
                  <RotateCcw className="h-4 w-4" />
                ) : isPlaying ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
              </button>

              <button
                type="button"
                onClick={changeSpeed}
                disabled={loading || Boolean(error)}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-muted hover:bg-muted/80 text-foreground border border-border/60 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary"
                aria-label={`Alterar velocidade de reprodução (atual: ${speed}x)`}
              >
                {speed}x
              </button>
            </div>

            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <MousePointerClick className="h-3.5 w-3.5 text-primary" />
                <b>{metadata?.clicksCount || 0}</b> cliques
              </span>
              <span className="hidden sm:flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                <b>{metadata?.duration || 0}s</b> na página
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
