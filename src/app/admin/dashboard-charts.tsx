"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { ChevronDown, Filter, Loader2, Users, Eye, Percent, Activity } from "lucide-react";
import { getLeadsTimeSeries, getCampaignsForFilter } from "./dashboard-actions";
import type { DayPoint } from "./dashboard-actions";

type Range = 7 | 30;
type Metric = "leads" | "views" | "conversion" | "all";

interface DashboardChartsProps {
  initialData?: DayPoint[];
  initialCampaigns?: { id: string; name: string }[];
}

export function DashboardCharts({
  initialData,
  initialCampaigns,
}: DashboardChartsProps) {
  const [range, setRange] = useState<Range>(7);
  const [campaignId, setCampaignId] = useState<string>("");
  const [metric, setMetric] = useState<Metric>("leads");
  const [campaigns, setCampaigns] = useState<{ id: string; name: string }[]>(
    initialCampaigns || []
  );

  const initialFormatted = initialData
    ? initialData.map((p) => ({
        ...p,
        conversion: p.views > 0 ? Math.round((p.count / p.views) * 100) : 0,
      }))
    : [];

  const [totalLeads, setTotalLeads] = useState(
    initialData ? initialData.reduce((acc, p) => acc + p.count, 0) : 0
  );
  const [totalViews, setTotalViews] = useState(
    initialData ? initialData.reduce((acc, p) => acc + p.views, 0) : 0
  );
  const [data, setData] = useState<(DayPoint & { conversion: number })[]>(
    initialFormatted
  );
  const [loading, setLoading] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const mountedRef = useRef(true);
  const isFirstMount = useRef(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!initialCampaigns || initialCampaigns.length === 0) {
      getCampaignsForFilter().then(setCampaigns);
    }
  }, [initialCampaigns]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const points = await getLeadsTimeSeries(range, campaignId || undefined);
      if (!mountedRef.current) return;
      const dataWithConversion = points.map((p) => ({
        ...p,
        conversion: p.views > 0 ? Math.round((p.count / p.views) * 100) : 0,
      }));
      setData(dataWithConversion);
      setTotalLeads(points.reduce((acc, p) => acc + p.count, 0));
      setTotalViews(points.reduce((acc, p) => acc + p.views, 0));
    } catch {
      // silent fallback
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [range, campaignId]);

  useEffect(() => {
    mountedRef.current = true;
    if (isFirstMount.current) {
      isFirstMount.current = false;
      if (initialData && initialData.length > 0) return;
    }
    load();
    return () => {
      mountedRef.current = false;
    };
  }, [range, campaignId, initialData, load]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDropdownOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const formatDate = (iso: string) => {
    const d = new Date(iso + "T00:00:00");
    return d.toLocaleDateString("pt-BR", { weekday: "short", day: "numeric" });
  };

  const formatTooltipDate = (iso: string) => {
    const d = new Date(iso + "T00:00:00");
    return d.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "short" });
  };

  const selectedCampaignName = campaignId
    ? campaigns.find((c) => c.id === campaignId)?.name ?? "Todas as campanhas"
    : "Todas as campanhas";

  const overallConversion = totalViews > 0 ? Math.round((totalLeads / totalViews) * 100) : 0;

  return (
    <div className="glass-panel rounded-2xl p-5 sm:p-6 transition-all duration-300 relative">
      {/* Background glow sutil com isolamento de overflow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
        <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-primary/5 blur-3xl" />
      </div>

      {/* Header com Título, Métricas Resumidas e Controles */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6 relative z-30">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-bold text-foreground tracking-tight">
              Desempenho no Período
            </h2>
            {loading && <Loader2 className="h-4 w-4 animate-spin text-primary opacity-80" />}
          </div>
          <p className="text-xs text-muted-foreground">
            Acompanhe o fluxo de visitantes, leads gerados e taxa de conversão.
          </p>
        </div>

        {/* Filtros e seletores */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Dropdown de campanhas */}
          <div className="relative z-40 flex-1 sm:flex-initial" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setDropdownOpen((prev) => !prev)}
              className="w-full sm:w-auto flex items-center justify-between gap-2 rounded-lg border border-border/80 bg-background/80 px-3 py-1.5 text-xs text-foreground transition-colors hover:bg-muted/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              aria-expanded={dropdownOpen}
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <Filter className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <span className="max-w-[130px] sm:max-w-[160px] truncate">{selectedCampaignName}</span>
              </div>
              <ChevronDown
                className={`h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform duration-200 ${
                  dropdownOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {dropdownOpen && (
              <ul
                role="listbox"
                className="absolute left-0 sm:left-auto sm:right-0 top-full mt-1.5 z-50 min-w-[220px] max-w-[calc(100vw-2rem)] max-h-60 overflow-y-auto rounded-xl border border-border bg-card shadow-2xl animate-scale-in py-1"
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
                      ? "bg-primary/15 text-primary font-medium"
                      : "text-card-foreground hover:bg-muted/80"
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
                        ? "bg-primary/15 text-primary font-medium"
                        : "text-card-foreground hover:bg-muted/80"
                    }`}
                  >
                    <span className="truncate">{c.name}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Toggle 7d / 30d */}
          <div className="flex rounded-lg border border-border/80 bg-background/80 overflow-hidden flex-shrink-0 p-0.5">
            {([7, 30] as Range[]).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRange(r)}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all duration-150 ${
                  range === r
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {r} dias
              </button>
            ))}
          </div>
        </div>
      </div>


      {/* Tabs com Pills de Métricas Ativas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-6 relative z-10">
        {/* Tab Leads */}
        <button
          type="button"
          onClick={() => setMetric("leads")}
          className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all duration-200 ${
            metric === "leads"
              ? "bg-chart-1/10 border-chart-1/40 shadow-sm"
              : "bg-background/40 border-border/40 hover:bg-background/80 hover:border-border/80"
          }`}
        >
          <div className="space-y-0.5">
            <span className="text-[11px] text-muted-foreground font-medium flex items-center gap-1.5">
              <Users className="h-3 w-3 text-chart-1" />
              Leads
            </span>
            <p className="text-lg sm:text-xl font-bold text-foreground tabular-nums">
              {totalLeads.toLocaleString("pt-BR")}
            </p>
          </div>
          <div className={`h-2 w-2 rounded-full ${metric === "leads" ? "bg-chart-1 animate-pulse" : "bg-muted"}`} />
        </button>

        {/* Tab Visitas */}
        <button
          type="button"
          onClick={() => setMetric("views")}
          className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all duration-200 ${
            metric === "views"
              ? "bg-chart-4/10 border-chart-4/40 shadow-sm"
              : "bg-background/40 border-border/40 hover:bg-background/80 hover:border-border/80"
          }`}
        >
          <div className="space-y-0.5">
            <span className="text-[11px] text-muted-foreground font-medium flex items-center gap-1.5">
              <Eye className="h-3 w-3 text-chart-4" />
              Visitas
            </span>
            <p className="text-lg sm:text-xl font-bold text-foreground tabular-nums">
              {totalViews.toLocaleString("pt-BR")}
            </p>
          </div>
          <div className={`h-2 w-2 rounded-full ${metric === "views" ? "bg-chart-4 animate-pulse" : "bg-muted"}`} />
        </button>

        {/* Tab Conversão */}
        <button
          type="button"
          onClick={() => setMetric("conversion")}
          className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all duration-200 ${
            metric === "conversion"
              ? "bg-primary/10 border-primary/40 shadow-sm"
              : "bg-background/40 border-border/40 hover:bg-background/80 hover:border-border/80"
          }`}
        >
          <div className="space-y-0.5">
            <span className="text-[11px] text-muted-foreground font-medium flex items-center gap-1.5">
              <Percent className="h-3 w-3 text-primary" />
              Conversão
            </span>
            <p className="text-lg sm:text-xl font-bold text-primary tabular-nums">
              {overallConversion}%
            </p>
          </div>
          <div className={`h-2 w-2 rounded-full ${metric === "conversion" ? "bg-primary animate-pulse" : "bg-muted"}`} />
        </button>

        {/* Tab Visão Completa */}
        <button
          type="button"
          onClick={() => setMetric("all")}
          className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all duration-200 ${
            metric === "all"
              ? "bg-muted border-primary/30 shadow-sm"
              : "bg-background/40 border-border/40 hover:bg-background/80 hover:border-border/80"
          }`}
        >
          <div className="space-y-0.5">
            <span className="text-[11px] text-muted-foreground font-medium flex items-center gap-1.5">
              <Activity className="h-3 w-3 text-chart-3" />
              Comparativo
            </span>
            <p className="text-xs font-semibold text-foreground mt-1">
              Visitas + Leads
            </p>
          </div>
          <div className={`h-2 w-2 rounded-full ${metric === "all" ? "bg-chart-3 animate-pulse" : "bg-muted"}`} />
        </button>
      </div>

      {/* Gráfico Unificado */}
      <div className={`h-[240px] w-full select-none transition-opacity duration-200 relative z-10 ${loading ? "opacity-50" : "opacity-100"}`}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
            <defs>
              <linearGradient id="leadsGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(221, 100%, 70%)" stopOpacity={0.4} />
                <stop offset="100%" stopColor="hsl(221, 100%, 70%)" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="viewsGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(260, 100%, 70%)" stopOpacity={0.35} />
                <stop offset="100%" stopColor="hsl(260, 100%, 70%)" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="convGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(160, 100%, 40%)" stopOpacity={0.4} />
                <stop offset="100%" stopColor="hsl(160, 100%, 40%)" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <XAxis
              dataKey="date"
              tickFormatter={formatDate}
              tick={{ fontSize: 11, fill: "hsl(0, 0%, 65%)" }}
              axisLine={{ stroke: "hsl(0, 0%, 20%)" }}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              allowDecimals={false}
              tick={{ fontSize: 11, fill: "hsl(0, 0%, 65%)" }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                background: "hsl(0, 0%, 7%)",
                border: "1px solid hsl(0, 0%, 20%)",
                borderRadius: 10,
                fontSize: 12,
                color: "hsl(0, 0%, 98%)",
                boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.5)",
              }}
              labelFormatter={(l) => (typeof l === "string" ? formatTooltipDate(l) : "")}
              formatter={(val: any, name: any) => {
                if (name === "count" || name === "Leads") return [val, "Leads"];
                if (name === "views" || name === "Visitas") return [val, "Visitas"];
                if (name === "conversion" || name === "Conversão") return [`${val}%`, "Taxa de Conversão"];
                return [val, name];
              }}
            />

            {/* Renderização condicional por métrica */}
            {(metric === "views" || metric === "all") && (
              <Area
                type="monotone"
                dataKey="views"
                name="Visitas"
                stroke="hsl(260, 100%, 70%)"
                strokeWidth={2}
                fill="url(#viewsGradient)"
                isAnimationActive={true}
                animationDuration={600}
                activeDot={{ r: 4, fill: "hsl(260, 100%, 70%)", stroke: "hsl(0, 0%, 8%)", strokeWidth: 2 }}
              />
            )}

            {(metric === "leads" || metric === "all") && (
              <Area
                type="monotone"
                dataKey="count"
                name="Leads"
                stroke="hsl(221, 100%, 70%)"
                strokeWidth={2}
                fill="url(#leadsGradient)"
                isAnimationActive={true}
                animationDuration={600}
                activeDot={{ r: 4, fill: "hsl(221, 100%, 70%)", stroke: "hsl(0, 0%, 8%)", strokeWidth: 2 }}
              />
            )}

            {metric === "conversion" && (
              <Area
                type="monotone"
                dataKey="conversion"
                name="Conversão"
                stroke="hsl(160, 100%, 40%)"
                strokeWidth={2}
                fill="url(#convGradient)"
                isAnimationActive={true}
                animationDuration={600}
                activeDot={{ r: 4, fill: "hsl(160, 100%, 40%)", stroke: "hsl(0, 0%, 8%)", strokeWidth: 2 }}
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}