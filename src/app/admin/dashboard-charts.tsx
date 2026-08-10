"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { ChevronDown, Filter } from "lucide-react";

import { getLeadsTimeSeries, getCampaignsForFilter } from "./dashboard-actions";
import type { DayPoint } from "./dashboard-actions";

type Range = 7 | 30;

export function DashboardCharts() {
  const [range, setRange] = useState<Range>(7);
  const [campaignId, setCampaignId] = useState<string>("");
  const [campaigns, setCampaigns] = useState<{ id: string; name: string }[]>(
    []
  );
  const [totalLeads, setTotalLeads] = useState(0);
  const [totalViews, setTotalViews] = useState(0);
  const [data, setData] = useState<(DayPoint & { conversion: number })[]>([]);
  const [loading, setLoading] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const mountedRef = useRef(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Carregar campanhas uma vez
  useEffect(() => {
    getCampaignsForFilter().then(setCampaigns);
  }, []);

  // Carregar dados quando range ou campaignId mudar
  const load = async () => {
    setLoading(true);
    try {
      const points = await getLeadsTimeSeries(
        range,
        campaignId || undefined
      );
      if (!mountedRef.current) return;
      const dataWithConversion = points.map(p => ({
        ...p,
        conversion: p.views > 0 ? Math.round((p.count / p.views) * 100) : 0
      }));
      setData(dataWithConversion);
      setTotalLeads(points.reduce((acc, p) => acc + p.count, 0));
      setTotalViews(points.reduce((acc, p) => acc + p.views, 0));
    } catch {
      // silent
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  };

  useEffect(() => {
    mountedRef.current = true;
    load();
    return () => {
      mountedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range, campaignId]);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fechar dropdown com Escape
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") {
      setDropdownOpen(false);
    }
  }, []);

  useEffect(() => {
    if (dropdownOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [dropdownOpen, handleKeyDown]);

  // Formatar data para exibição
  const formatDate = (iso: string) => {
    const d = new Date(iso + "T00:00:00");
    return d.toLocaleDateString("pt-BR", {
      weekday: "short",
      day: "numeric",
    });
  };

  const formatTooltipDate = (iso: string) => {
    const d = new Date(iso + "T00:00:00");
    return d.toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "numeric",
      month: "short",
    });
  };

  const selectedCampaignName = campaignId
    ? campaigns.find((c) => c.id === campaignId)?.name ?? "Todas as campanhas"
    : "Todas as campanhas";

  return (
    <div className="space-y-4">
      {/* Controles: Filtro de Campanha e Range de Data */}
      <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
        <h2 className="text-xl font-bold text-foreground tracking-tight">Desempenho Diário</h2>
        <div className="flex items-center gap-3">
          {/* Filtro de campanha — dropdown customizado */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setDropdownOpen((prev) => !prev)}
              className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              aria-expanded={dropdownOpen}
              aria-haspopup="listbox"
            >
              <Filter className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <span className="max-w-[140px] truncate">{selectedCampaignName}</span>
              <ChevronDown
                className={`h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform duration-200 ${
                  dropdownOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {dropdownOpen && (
              <ul
                role="listbox"
                className="absolute right-0 top-full mt-1.5 z-20 min-w-[180px] overflow-hidden rounded-lg border border-border bg-card shadow-lg animate-scale-in"
              >
                <li
                  role="option"
                  aria-selected={campaignId === ""}
                  onClick={() => {
                    setCampaignId("");
                    setDropdownOpen(false);
                  }}
                  className={`flex items-center gap-2 px-3 py-2 text-xs cursor-pointer transition-colors ${
                    campaignId === ""
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-card-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  }`}
                >
                  Todas as campanhas
                </li>
                {campaigns.map((c) => (
                  <li
                    key={c.id}
                    role="option"
                    aria-selected={campaignId === c.id}
                    onClick={() => {
                      setCampaignId(c.id);
                      setDropdownOpen(false);
                    }}
                    className={`flex items-center gap-2 px-3 py-2 text-xs cursor-pointer transition-colors ${
                      campaignId === c.id
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-card-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    }`}
                  >
                    <span className="truncate">{c.name}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Toggle 7d / 30d */}
          <div className="flex rounded-lg border border-border overflow-hidden">
            {([7, 30] as Range[]).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-3 py-1.5 text-xs font-medium transition-colors duration-150 ${
                  range === r
                    ? "bg-primary text-primary-foreground"
                    : "bg-background text-muted-foreground hover:text-foreground"
                }`}
              >
                {r}d
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="relative overflow-hidden glass-panel rounded-xl p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:border-primary/30 group">
          
          <div className="relative z-10">
            <h3 className="text-sm font-medium text-card-foreground">Visitas</h3>
            <p className="mt-1 text-2xl font-bold text-card-foreground tracking-tight tabular-nums">
              {totalViews}
            </p>
            <div className="h-[140px] mt-4 select-none">
              {loading ? (
                <div className="flex items-center justify-center h-full text-sm text-muted-foreground">Carregando...</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -24 }}>
                    <defs>
                      <linearGradient id="viewGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(260, 100%, 70%)" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="hsl(260, 100%, 70%)" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" tickFormatter={formatDate} tick={{ fontSize: 10, fill: "hsl(0, 0%, 55%)" }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                    <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: "hsl(0, 0%, 55%)" }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: "hsl(0, 0%, 8%)", border: "1px solid hsl(0, 0%, 18%)", borderRadius: 8, fontSize: 12, color: "hsl(0, 0%, 90%)" }} labelFormatter={l => typeof l === 'string' ? formatTooltipDate(l) : ''} formatter={(v: any) => [v, "Visitas"]} />
                    <Area type="monotone" dataKey="views" stroke="hsl(260, 100%, 70%)" strokeWidth={2} fill="url(#viewGradient)" activeDot={{ r: 4, fill: "hsl(260, 100%, 70%)", stroke: "hsl(0, 0%, 8%)", strokeWidth: 2 }} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden glass-panel rounded-xl p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:border-primary/30 group">
          
          <div className="relative z-10">
            <h3 className="text-sm font-medium text-card-foreground">Leads</h3>
            <p className="mt-1 text-2xl font-bold text-chart-1 tracking-tight tabular-nums">
              {totalLeads}
            </p>
            <div className="h-[140px] mt-4 select-none">
              {loading ? (
                <div className="flex items-center justify-center h-full text-sm text-muted-foreground">Carregando...</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -24 }}>
                    <defs>
                      <linearGradient id="leadGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(221, 100%, 70%)" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="hsl(221, 100%, 70%)" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" tickFormatter={formatDate} tick={{ fontSize: 10, fill: "hsl(0, 0%, 55%)" }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                    <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: "hsl(0, 0%, 55%)" }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: "hsl(0, 0%, 8%)", border: "1px solid hsl(0, 0%, 18%)", borderRadius: 8, fontSize: 12, color: "hsl(0, 0%, 90%)" }} labelFormatter={l => typeof l === 'string' ? formatTooltipDate(l) : ''} formatter={(v: any) => [v, "Leads"]} />
                    <Area type="monotone" dataKey="count" stroke="hsl(221, 100%, 70%)" strokeWidth={2} fill="url(#leadGradient)" activeDot={{ r: 4, fill: "hsl(221, 100%, 70%)", stroke: "hsl(0, 0%, 8%)", strokeWidth: 2 }} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden glass-panel rounded-xl p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:border-primary/30 group">
          
          <div className="relative z-10">
            <h3 className="text-sm font-medium text-card-foreground">Conversão</h3>
            <p className="mt-1 text-2xl font-bold text-primary tracking-tight tabular-nums">
              {totalViews > 0 ? Math.round((totalLeads / totalViews) * 100) : 0}%
            </p>
            <div className="h-[140px] mt-4 select-none">
              {loading ? (
                <div className="flex items-center justify-center h-full text-sm text-muted-foreground">Carregando...</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -24 }}>
                    <defs>
                      <linearGradient id="convGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(160, 100%, 40%)" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="hsl(160, 100%, 40%)" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" tickFormatter={formatDate} tick={{ fontSize: 10, fill: "hsl(0, 0%, 55%)" }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                    <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: "hsl(0, 0%, 55%)" }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: "hsl(0, 0%, 8%)", border: "1px solid hsl(0, 0%, 18%)", borderRadius: 8, fontSize: 12, color: "hsl(0, 0%, 90%)" }} labelFormatter={l => typeof l === 'string' ? formatTooltipDate(l) : ''} formatter={(v: any) => [`${v}%`, "Conversão"]} />
                    <Area type="monotone" dataKey="conversion" stroke="hsl(160, 100%, 40%)" strokeWidth={2} fill="url(#convGradient)" activeDot={{ r: 4, fill: "hsl(160, 100%, 40%)", stroke: "hsl(0, 0%, 8%)", strokeWidth: 2 }} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}