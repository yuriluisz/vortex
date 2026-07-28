"use client";

import { useEffect, useState } from "react";
import {
  Users,
  Megaphone,
  MessageCircle,
  LayoutDashboard,
  MessageSquareMore,
  Plus,
  ArrowUpRight,
  Filter,
  ChevronDown
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

type MockGroup = {
  name: string;
  pct: number;
};

const INITIAL_GROUPS: MockGroup[] = [
  { name: "VIP 01", pct: 100 },
  { name: "VIP 02", pct: 100 },
  { name: "VIP 03", pct: 64 },
];

const INITIAL_LEADS = 1284;

const MOCK_CHART_DATA = [
  { date: "Seg", leads: 400, views: 2400 },
  { date: "Ter", leads: 300, views: 1398 },
  { date: "Qua", leads: 200, views: 9800 },
  { date: "Qui", leads: 278, views: 3908 },
  { date: "Sex", leads: 189, views: 4800 },
  { date: "Sáb", leads: 239, views: 3800 },
  { date: "Dom", leads: 349, views: 4300 },
];

export function HeroMockup() {
  const [leads, setLeads] = useState(INITIAL_LEADS);
  const [groups, setGroups] = useState<MockGroup[]>(INITIAL_GROUPS);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const id = setInterval(() => {
      setLeads((value) => value + Math.floor(Math.random() * 5) + 2);

      setGroups((prev) => {
        const next = prev.map((group) => ({ ...group }));
        const filling = next.find((group) => group.pct < 100);

        if (filling) {
          filling.pct = Math.min(
            100,
            filling.pct + Math.floor(Math.random() * 6) + 3
          );
          return next;
        }

        // Grupo encheu: abre o próximo
        if (next.length < 5) {
          next.push({ name: `VIP 0${next.length + 1}`, pct: 4 });
          return next;
        }

        // Reinicia
        return INITIAL_GROUPS.map((group) => ({ ...group }));
      });
    }, 1200);

    return () => clearInterval(id);
  }, []);

  return (
    <div className="rounded-xl border border-border/60 bg-background shadow-2xl overflow-hidden backdrop-blur-xl w-[900px] max-w-[120vw] -ml-[10vw] sm:w-[1000px] sm:ml-0 lg:w-[1000px] xl:w-[1100px] transform-gpu transition-all">
      {/* Browser chrome */}
      <div className="flex items-center gap-2 border-b border-border/50 bg-muted/40 px-4 py-3">
        <span className="h-3 w-3 rounded-full bg-destructive/80" />
        <span className="h-3 w-3 rounded-full bg-amber-500/80" />
        <span className="h-3 w-3 rounded-full bg-chart-2/80" />
        <div className="ml-4 flex items-center gap-2 rounded-md bg-background/80 px-3 py-1.5 text-[11px] text-muted-foreground border border-border/30 w-64 shadow-sm">
          <span className="truncate">app.vortexpages.online/admin</span>
        </div>
      </div>

      <div className="flex h-[550px]">
        {/* Sidebar idêntica a real */}
        <div className="hidden sm:flex w-[240px] flex-shrink-0 flex-col border-r border-sidebar-border bg-sidebar px-3 py-4">
          <div className="flex items-center gap-2 mb-8 px-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/Vortex Padrão.svg" alt="Vórtex+" className="h-6 w-auto invert" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-sidebar-primary bg-sidebar-primary/10 px-1.5 py-0.5 rounded ml-2">ULTRA</span>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center gap-3 rounded-lg bg-sidebar-primary px-3 py-2.5 text-sm font-medium text-sidebar-primary-foreground shadow-sm">
              <LayoutDashboard className="h-5 w-5" />
              Dashboard
            </div>
            <div className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground/70">
              <Megaphone className="h-5 w-5" />
              Campanhas
            </div>
            <div className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground/70">
              <MessageSquareMore className="h-5 w-5" />
              WhatsApp
            </div>
          </div>
        </div>

        {/* Dashboard Content Fiel */}
        <div className="flex-1 bg-background p-8 overflow-hidden flex flex-col">
          
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-foreground tracking-tight">
                Dashboard
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Bem-vindo de volta,{" "}
                <span className="font-medium text-foreground/80">admin@vortexpages.online</span>.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-md cursor-default">
                <Plus className="h-4 w-4" />
                Nova campanha
              </div>
            </div>
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-4 gap-4 mb-8">
            <div className="rounded-xl border border-border bg-card p-4 shadow-sm flex flex-col justify-center">
              <div className="flex items-center gap-3 mb-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg text-chart-1 bg-chart-1/10">
                  <Megaphone className="h-4 w-4" />
                </div>
                <p className="text-xs font-medium text-muted-foreground">Campanhas</p>
              </div>
              <p className="text-xl font-bold text-card-foreground tabular-nums">4</p>
            </div>

            <div className="rounded-xl border border-border bg-card p-4 shadow-sm flex flex-col justify-center">
              <div className="flex items-center gap-3 mb-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg text-chart-2 bg-chart-2/10">
                  <Users className="h-4 w-4" />
                </div>
                <p className="text-xs font-medium text-muted-foreground">Leads</p>
              </div>
              <p className="text-xl font-bold text-card-foreground tabular-nums">{leads.toLocaleString("pt-BR")}</p>
            </div>

            <div className="rounded-xl border border-border bg-card p-4 shadow-sm flex flex-col justify-center">
              <div className="flex items-center gap-3 mb-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg text-chart-3 bg-chart-3/10">
                  <MessageCircle className="h-4 w-4" />
                </div>
                <p className="text-xs font-medium text-muted-foreground">Grupos Ativos</p>
              </div>
              <p className="text-xl font-bold text-card-foreground tabular-nums">{groups.length}</p>
            </div>

            <div className="rounded-xl border border-border bg-card p-4 shadow-sm flex flex-col justify-center">
              <div className="flex items-center gap-3 mb-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg text-primary bg-primary/10">
                  <ArrowUpRight className="h-4 w-4" />
                </div>
                <p className="text-xs font-medium text-muted-foreground">Lotação</p>
              </div>
              <p className="text-xl font-bold text-card-foreground tabular-nums">82%</p>
            </div>
          </div>

          {/* Chart Widget */}
          <div className="flex-1 min-h-0 flex flex-col space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <h2 className="text-xl font-bold text-foreground tracking-tight">Desempenho Diário</h2>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-foreground shadow-sm">
                  <Filter className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <span className="max-w-[140px] truncate">Lançamento VIP</span>
                  <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                </div>
                <div className="flex items-center rounded-lg border border-border bg-background p-0.5 shadow-sm">
                  <span className="rounded-md bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
                    7d
                  </span>
                  <span className="rounded-md px-3 py-1 text-xs font-medium text-muted-foreground">
                    30d
                  </span>
                </div>
              </div>
            </div>

            <div className="flex-1 rounded-xl border border-border bg-card p-6 shadow-sm overflow-hidden">
              <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1} style={{ outline: 'none' }}>
                <AreaChart
                  data={MOCK_CHART_DATA}
                  margin={{ top: 10, right: 0, left: -20, bottom: 0 }}
                  style={{ outline: 'none' }}
                >
                  <defs>
                    <linearGradient id="colorLeadsMock" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorViewsMock" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.5} />
                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#ffffff", fontSize: 11 }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#ffffff", fontSize: 11 }}
                  />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="rounded-lg border border-border bg-card p-3 shadow-lg flex flex-col gap-1.5">
                            <p className="text-sm font-semibold text-foreground mb-1">{label}</p>
                            <div className="flex items-center gap-2">
                              <span className="h-2 w-2 rounded-full bg-chart-2"></span>
                              <span className="text-xs text-muted-foreground font-medium">Leads: </span>
                              <span className="text-xs font-bold text-foreground">{payload[0].value}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="h-2 w-2 rounded-full bg-chart-1"></span>
                              <span className="text-xs text-muted-foreground font-medium">Views: </span>
                              <span className="text-xs font-bold text-foreground">{payload[1].value}</span>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="leads"
                    stroke="#10b981"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorLeadsMock)"
                    animationDuration={2000}
                    activeDot={false}
                    isAnimationActive={false}
                  />
                  <Area
                    type="monotone"
                    dataKey="views"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorViewsMock)"
                    animationDuration={2000}
                    activeDot={false}
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}