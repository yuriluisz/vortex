"use client";

import { useEffect, useRef, useState, useCallback } from "react";
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
} from "lucide-react";

interface ReplayPlayerModalProps {
  sessionId: string;
  onClose: () => void;
}

interface RecordingMetadata {
  id: string;
  sessionId: string;
  campaignId: string;
  campaignName: string;
  duration: number;
  clicksCount: number;
  device: string | null;
  browser: string | null;
  os: string | null;
  pageUrl: string;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  createdAt: string;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function ReplayPlayerModal({ sessionId, onClose }: ReplayPlayerModalProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<RecordingMetadata | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const [speed, setSpeed] = useState<1 | 2 | 4>(1);

  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const replayerRef = useRef<any>(null);
  const animFrameRef = useRef<number | null>(null);

  // Carregar dados da gravação da API (R2)
  useEffect(() => {
    let isMounted = true;

    async function loadRecording() {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(`/api/analytics/recordings/${sessionId}/stream`);
        if (!res.ok) {
          throw new Error("Não foi possível carregar a gravação.");
        }

        const data = await res.json();
        if (!isMounted) return;

        setMetadata(data.recording);

        if (!data.events || !Array.isArray(data.events) || data.events.length === 0) {
          throw new Error("Esta sessão não possui eventos de tela registrados.");
        }

        // Importar rrweb dinamicamente no browser
        const rrweb = await import("rrweb");
        const Replayer = rrweb.Replayer;

        if (!containerRef.current) return;
        containerRef.current.innerHTML = "";

        const replayer = new Replayer(data.events, {
          root: containerRef.current,
          mouseTail: true,
          skipInactive: true,
          showWarning: false,
          UNSAFE_replayCanvas: true,
        });

        replayerRef.current = replayer;

        const meta = replayer.getMetaData();
        const durationSec = Math.max(1, Math.round((meta.totalTime || 1000) / 1000));
        setTotalTime(durationSec);

        replayer.on("finish", () => {
          setIsPlaying(false);
          setCurrentTime(durationSec);
        });

        // Auto-scale do replayer para caber perfeitamente no container
        const handleResize = () => {
          if (!containerRef.current) return;
          const wrapper = containerRef.current.querySelector(".replayer-wrapper") as HTMLElement;
          if (!wrapper) return;

          const w = wrapper.offsetWidth;
          const h = wrapper.offsetHeight;
          const parentW = containerRef.current.clientWidth - 32;
          const parentH = containerRef.current.clientHeight - 32;

          if (w > 0 && h > 0 && parentW > 0 && parentH > 0) {
            const scale = Math.min(parentW / w, parentH / h, 1);
            wrapper.style.transformOrigin = "top center";
            wrapper.style.transform = `scale(${scale})`;
            wrapper.style.position = "relative";
            wrapper.style.margin = "0 auto";
          }
        };

        replayer.on("resize", handleResize);
        window.addEventListener("resize", handleResize);
        setTimeout(handleResize, 100);

        setLoading(false);
        replayer.play(0);
        setIsPlaying(true);
      } catch (err) {
        if (!isMounted) return;
        setError(err instanceof Error ? err.message : "Erro ao carregar gravação.");
        setLoading(false);
      }
    }

    loadRecording();

    return () => {
      isMounted = false;
      if (replayerRef.current) {
        try {
          replayerRef.current.destroy();
        } catch {}
      }
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [sessionId]);

  // Loop de atualização do relógio da timeline
  useEffect(() => {
    function updateProgress() {
      if (replayerRef.current && isPlaying) {
        const curr = Math.round(replayerRef.current.getCurrentTime() / 1000);
        setCurrentTime(curr);
      }
      animFrameRef.current = requestAnimationFrame(updateProgress);
    }

    if (isPlaying) {
      animFrameRef.current = requestAnimationFrame(updateProgress);
    }

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [isPlaying]);

  const togglePlay = useCallback(() => {
    if (!replayerRef.current) return;
    if (isPlaying) {
      replayerRef.current.pause();
      setIsPlaying(false);
    } else {
      if (currentTime >= totalTime) {
        replayerRef.current.play(0);
      } else {
        replayerRef.current.play(currentTime * 1000);
      }
      setIsPlaying(true);
    }
  }, [isPlaying, currentTime, totalTime]);

  const handleSeek = (seconds: number) => {
    setCurrentTime(seconds);
    if (!replayerRef.current) return;
    replayerRef.current.pause(seconds * 1000);
    if (isPlaying) {
      replayerRef.current.play(seconds * 1000);
    }
  };

  const changeSpeed = () => {
    const nextSpeed = speed === 1 ? 2 : speed === 2 ? 4 : 1;
    setSpeed(nextSpeed);
    if (replayerRef.current?.setConfig) {
      replayerRef.current.setConfig({ speed: nextSpeed });
    }
  };

  const deviceIcon =
    metadata?.device === "mobile" ? (
      <Smartphone className="h-4 w-4 text-emerald-400" />
    ) : metadata?.device === "tablet" ? (
      <Tablet className="h-4 w-4 text-sky-400" />
    ) : (
      <Monitor className="h-4 w-4 text-violet-400" />
    );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-2 sm:p-6 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="flex flex-col w-full max-w-5xl h-[92vh] bg-card border border-border/80 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header do Player */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-border/60 bg-muted/30">
          <div className="flex items-center gap-3 min-w-0">
            <span className="p-2 rounded-xl bg-background border border-border/60">
              {deviceIcon}
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-foreground truncate">
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
              className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
              aria-label="Fechar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Palco do Replay (Tela Gravada) */}
        <div className="relative flex-1 bg-neutral-950 flex items-center justify-center overflow-hidden">
          {loading && (
            <div className="flex flex-col items-center gap-3 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm font-medium">Carregando gravação do Cloudflare R2...</p>
            </div>
          )}

          {error && !loading && (
            <div className="max-w-md p-6 text-center text-muted-foreground">
              <p className="text-sm text-rose-400 mb-2 font-medium">{error}</p>
              <p className="text-xs text-muted-foreground">
                As gravações mais antigas que 7 dias são excluídas automaticamente para manter seu
                armazenamento livre de custos.
              </p>
            </div>
          )}

          <div
            ref={containerRef}
            className={`w-full h-full flex items-center justify-center ${
              loading || error ? "hidden" : "block"
            }`}
          />
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
                max={totalTime}
                value={currentTime}
                onChange={(e) => handleSeek(Number(e.target.value))}
                className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary group-hover:h-2 transition-all"
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
                onClick={togglePlay}
                disabled={loading || Boolean(error)}
                className="p-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-md shadow-primary/20 disabled:opacity-50"
              >
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </button>

              <button
                type="button"
                onClick={changeSpeed}
                disabled={loading || Boolean(error)}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-muted hover:bg-muted/80 text-foreground border border-border/60 transition-colors"
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
    </div>
  );
}
