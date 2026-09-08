"use client";

import { useState } from "react";
import {
  Video,
  Flame,
  Clock,
  MousePointerClick,
  Smartphone,
  CheckCircle2,
} from "lucide-react";
import SessionsList, { SessionItem } from "@/components/admin/recordings/SessionsList";
import HeatmapView from "@/components/admin/recordings/HeatmapView";

interface RecordingsClientProps {
  campaign: {
    id: string;
    name: string;
    slug: string;
    rawHtml: string;
    sessionRecordingEnabled: boolean;
  };
  initialSessions: SessionItem[];
  totalHeatmapClicks: number;
}

export default function RecordingsClient({
  campaign,
  initialSessions,
  totalHeatmapClicks,
}: RecordingsClientProps) {
  const [activeTab, setActiveTab] = useState<"sessions" | "heatmap">("sessions");

  // Cálculos de métricas
  const totalSessions = initialSessions.length;
  const avgDuration =
    totalSessions > 0
      ? Math.round(
          initialSessions.reduce((acc, curr) => acc + curr.duration, 0) / totalSessions
        )
      : 0;

  const mobileCount = initialSessions.filter((s) => s.device === "mobile").length;
  const mobileShare = totalSessions > 0 ? Math.round((mobileCount / totalSessions) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Cards de Métricas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-card border border-border/70 shadow-xs">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
            <span>Sessões Gravadas</span>
            <Video className="h-4 w-4 text-primary" />
          </div>
          <p className="text-2xl font-bold text-foreground">{totalSessions}</p>
          <span className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
            <CheckCircle2 className="h-3 w-3 text-emerald-400" />
            Últimos 7 dias
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border/70 shadow-xs">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
            <span>Tempo Médio</span>
            <Clock className="h-4 w-4 text-sky-400" />
          </div>
          <p className="text-2xl font-bold text-foreground">{avgDuration}s</p>
          <span className="text-[11px] text-muted-foreground mt-0.5">Por visitante</span>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border/70 shadow-xs">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
            <span>Toques Mapeados</span>
            <MousePointerClick className="h-4 w-4 text-orange-400" />
          </div>
          <p className="text-2xl font-bold text-foreground">{totalHeatmapClicks}</p>
          <span className="text-[11px] text-muted-foreground mt-0.5">Mapa de Calor</span>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border/70 shadow-xs">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
            <span>Tráfego Mobile</span>
            <Smartphone className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-foreground">{mobileShare}%</p>
          <span className="text-[11px] text-muted-foreground mt-0.5">Foco Meta Ads</span>
        </div>
      </div>

      {/* Navegação entre Replays e Heatmap */}
      <div className="flex items-center gap-2 border-b border-border/60 pb-3">
        <button
          type="button"
          onClick={() => setActiveTab("sessions")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
            activeTab === "sessions"
              ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
          }`}
        >
          <Video className="h-4 w-4" />
          Sessões & Replays
          {totalSessions > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-background/20">
              {totalSessions}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("heatmap")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
            activeTab === "heatmap"
              ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
          }`}
        >
          <Flame className="h-4 w-4" />
          Mapa de Calor (Heatmap)
        </button>
      </div>

      {/* Conteúdo da Sub-Aba Ativa */}
      {activeTab === "sessions" ? (
        <SessionsList sessions={initialSessions} campaignSlug={campaign.slug} />
      ) : (
        <HeatmapView
          campaignId={campaign.id}
          campaignSlug={campaign.slug}
          rawHtml={campaign.rawHtml}
        />
      )}
    </div>
  );
}
