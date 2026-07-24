"use client";

import { useEffect, useState } from "react";
import {
  Users,
  MessageCircle,
  Menu,
  MoreVertical,
} from "lucide-react";
import {
  AreaChart,
  Area,
  ResponsiveContainer,
} from "recharts";

const INITIAL_LEADS = 1284;
const MOCK_CHART_DATA = [
  { leads: 400 },
  { leads: 300 },
  { leads: 200 },
  { leads: 278 },
  { leads: 189 },
  { leads: 239 },
  { leads: 349 },
];

export function MobileHeroMockup() {
  const [leads, setLeads] = useState(INITIAL_LEADS);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }
    const id = setInterval(() => {
      setLeads((value) => value + Math.floor(Math.random() * 5) + 2);
    }, 1200);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="relative mx-auto w-[280px] h-[580px] rounded-[40px] border-[6px] border-zinc-800 bg-background shadow-2xl overflow-hidden ring-1 ring-white/10">
      {/* Notch da Apple / Dynamic Island */}
      <div className="absolute top-0 inset-x-0 h-6 flex justify-center z-50">
        <div className="w-24 h-5 bg-zinc-800 rounded-b-3xl"></div>
      </div>

      {/* Header do app mobile */}
      <div className="pt-8 pb-3 px-4 flex items-center justify-between border-b border-border/50 bg-sidebar/50">
        <Menu className="h-5 w-5 text-foreground" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/Vortex Padrão.svg" alt="Vórtex+" className="h-4 w-auto invert" />
        <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center">
          <span className="text-[8px] font-bold text-primary">ADM</span>
        </div>
      </div>

      <div className="p-4 overflow-y-auto h-full pb-20 bg-background/50">
        <h2 className="text-lg font-bold text-foreground mb-4">Dashboard</h2>

        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="rounded-xl border border-border bg-card p-3 shadow-sm">
            <Users className="h-4 w-4 text-chart-2 mb-1" />
            <p className="text-[10px] text-muted-foreground">Leads</p>
            <p className="text-sm font-bold text-card-foreground">{leads.toLocaleString("pt-BR")}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-3 shadow-sm">
            <MessageCircle className="h-4 w-4 text-chart-3 mb-1" />
            <p className="text-[10px] text-muted-foreground">Grupos</p>
            <p className="text-sm font-bold text-card-foreground">3 Ativos</p>
          </div>
        </div>

        {/* Chart mini */}
        <div className="rounded-xl border border-border bg-card shadow-sm p-3 mb-6">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-xs font-semibold text-foreground">Desempenho (7d)</h3>
            <MoreVertical className="h-3 w-3 text-muted-foreground" />
          </div>
          <div className="h-[80px]">
            <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1} style={{ outline: 'none' }}>
              <AreaChart data={MOCK_CHART_DATA} style={{ outline: 'none' }}>
                <defs>
                  <linearGradient id="colorLeadsMob" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="leads"
                  stroke="#10b981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorLeadsMob)"
                  animationDuration={2000}
                  activeDot={false}
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Campaign List Mini */}
        <h3 className="text-xs font-semibold text-foreground mb-3">Campanhas Ativas</h3>
        <div className="space-y-3">
          <div className="rounded-lg border border-border bg-card p-3 shadow-sm">
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="text-[11px] font-semibold text-foreground">Lançamento VIP</p>
                <p className="text-[9px] text-muted-foreground">/vip-checkout</p>
              </div>
              <span className="text-[10px] font-medium text-chart-2 bg-chart-2/10 px-1.5 py-0.5 rounded">Roteando</span>
            </div>
            <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
              <div className="h-full bg-primary w-[64%]"></div>
            </div>
          </div>
          
          <div className="rounded-lg border border-border bg-card p-3 shadow-sm opacity-60">
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="text-[11px] font-semibold text-foreground">Webinar Vendas</p>
                <p className="text-[9px] text-muted-foreground">/webinar</p>
              </div>
            </div>
            <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
              <div className="h-full bg-chart-1 w-[42%]"></div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
