"use client";

import { useState } from "react";
import {
  Smartphone,
  Monitor,
  Tablet,
  Play,
  Clock,
  MousePointerClick,
  Tag,
  Search,
  Video,
} from "lucide-react";
import ReplayPlayerModal from "./ReplayPlayerModal";

export interface SessionItem {
  id: string;
  sessionId: string;
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

interface SessionsListProps {
  sessions: SessionItem[];
  campaignSlug: string;
}

export default function SessionsList({ sessions, campaignSlug }: SessionsListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [deviceFilter, setDeviceFilter] = useState<string>("all");
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  const filteredSessions = sessions.filter((s) => {
    const matchesSearch =
      !searchTerm ||
      (s.utmSource && s.utmSource.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (s.utmCampaign && s.utmCampaign.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (s.browser && s.browser.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (s.os && s.os.toLowerCase().includes(searchTerm.toLowerCase())) ||
      s.sessionId.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDevice =
      deviceFilter === "all" || s.device === deviceFilter;

    return matchesSearch && matchesDevice;
  });

  const getDeviceIcon = (device: string | null) => {
    if (device === "mobile") return <Smartphone className="h-4 w-4 text-emerald-400" />;
    if (device === "tablet") return <Tablet className="h-4 w-4 text-sky-400" />;
    return <Monitor className="h-4 w-4 text-violet-400" />;
  };

  return (
    <div className="space-y-4">
      {/* Barra de Filtros e Busca */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-card border border-border/70 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Filtrar por UTM (origem, campanha), navegador ou ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-xs sm:text-sm bg-background border border-border/60 rounded-xl focus:outline-none focus:border-primary transition-colors text-foreground"
          />
        </div>

        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-muted/60 border border-border/50">
          <button
            type="button"
            onClick={() => setDeviceFilter("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              deviceFilter === "all"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Todos
          </button>
          <button
            type="button"
            onClick={() => setDeviceFilter("mobile")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              deviceFilter === "mobile"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Celular
          </button>
          <button
            type="button"
            onClick={() => setDeviceFilter("desktop")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              deviceFilter === "desktop"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Desktop
          </button>
        </div>
      </div>

      {/* Lista de Sessões */}
      {filteredSessions.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-dashed border-border/80 bg-card/40">
          <div className="p-3 rounded-2xl bg-muted/80 text-muted-foreground mb-3">
            <Video className="h-6 w-6" />
          </div>
          <h4 className="text-sm font-semibold text-foreground mb-1">
            Nenhuma gravação encontrada
          </h4>
          <p className="text-xs text-muted-foreground max-w-sm">
            Assim que seus anúncios do Meta Ads começarem a enviar tráfego para{" "}
            <code className="text-primary">/{campaignSlug}</code>, as sessões gravadas aparecerão
            automaticamente aqui.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2.5">
          {filteredSessions.map((session) => (
            <div
              key={session.sessionId}
              className="group flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-xl border border-border/70 bg-card hover:bg-muted/40 hover:border-border transition-all shadow-xs"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="p-2.5 rounded-xl bg-background border border-border/60 shrink-0">
                  {getDeviceIcon(session.device)}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <span className="text-xs font-semibold text-foreground">
                      {session.os || "Sistema"} · {session.browser || "Navegador"}
                    </span>
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border/40">
                      {session.device || "mobile"}
                    </span>
                    {session.utmSource && (
                      <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                        <Tag className="h-2.5 w-2.5" />
                        {session.utmSource}
                        {session.utmCampaign ? ` / ${session.utmCampaign}` : ""}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-muted-foreground">
                    {new Date(session.createdAt).toLocaleString("pt-BR")} · ID:{" "}
                    <span className="font-mono text-[11px] opacity-75">
                      {session.sessionId.slice(0, 12)}
                    </span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-border/40">
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    <b>{session.duration}s</b>
                  </span>
                  <span className="flex items-center gap-1">
                    <MousePointerClick className="h-3.5 w-3.5 text-primary" />
                    <b>{session.clicksCount}</b>
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedSessionId(session.sessionId)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-sm shadow-primary/20"
                >
                  <Play className="h-3.5 w-3.5" />
                  Assistir Replay
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal do Replay */}
      {selectedSessionId && (
        <ReplayPlayerModal
          sessionId={selectedSessionId}
          onClose={() => setSelectedSessionId(null)}
        />
      )}
    </div>
  );
}
