"use client";

import { useEffect, useState } from "react";
import {
  Users,
  Megaphone,
  MessageCircle,
  LayoutDashboard,
} from "lucide-react";

type MockGroup = {
  name: string;
  pct: number;
};

const INITIAL_GROUPS: MockGroup[] = [
  { name: "Grupo 01", pct: 100 },
  { name: "Grupo 02", pct: 64 },
];

const INITIAL_LEADS = 1284;

/**
 * Mockup "vivo" do painel de campanhas: o contador de leads
 * incrementa sozinho e as barras dos grupos de WhatsApp enchem,
 * simulando a rotação automática do Vórtex+.
 */
export function HeroMockup() {
  const [leads, setLeads] = useState(INITIAL_LEADS);
  const [groups, setGroups] = useState<MockGroup[]>(INITIAL_GROUPS);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const id = setInterval(() => {
      setLeads((value) => value + Math.floor(Math.random() * 3) + 1);

      setGroups((prev) => {
        const next = prev.map((group) => ({ ...group }));
        const filling = next.find((group) => group.pct < 100);

        if (filling) {
          filling.pct = Math.min(
            100,
            filling.pct + Math.floor(Math.random() * 4) + 2
          );
          return next;
        }

        // Grupo encheu: a rotação abre o próximo grupo automaticamente
        if (next.length < 3) {
          next.push({ name: `Grupo 0${next.length + 1}`, pct: 4 });
          return next;
        }

        // Reinicia o ciclo da demonstração
        return INITIAL_GROUPS.map((group) => ({ ...group }));
      });
    }, 1600);

    return () => clearInterval(id);
  }, []);

  const metrics = [
    {
      icon: Megaphone,
      label: "Campanhas Ativas",
      value: "3",
      color: "text-chart-1 bg-chart-1/10",
    },
    {
      icon: Users,
      label: "Leads Capturados",
      value: leads.toLocaleString("pt-BR"),
      color: "text-chart-2 bg-chart-2/10",
    },
    {
      icon: MessageCircle,
      label: "Grupos Ativos",
      value: String(groups.length + 2),
      color: "text-chart-3 bg-chart-3/10",
    },
  ];

  return (
    <div className="rounded-xl border border-border bg-card shadow-2xl overflow-hidden">
      {/* Browser chrome */}
      <div className="flex items-center gap-1.5 sm:gap-2 border-b border-border bg-muted/50 px-3 sm:px-4 py-2.5 sm:py-3">
        <span className="h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full bg-destructive/60" />
        <span className="h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full bg-border" />
        <span className="h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full bg-primary/60" />
        <div className="ml-2 sm:ml-3 flex items-center gap-1.5 sm:gap-2 rounded-md bg-background/60 px-2 sm:px-3 py-1 text-[9px] sm:text-[10px] text-muted-foreground max-w-[130px] sm:max-w-none overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/Vortex Logo Only.svg" alt="V" className="h-3.5 w-3.5 sm:h-5 sm:w-5 invert opacity-70 shrink-0" />
          <span className="truncate">vortex.app/admin</span>
        </div>
        <div className="ml-auto flex items-center gap-1 sm:gap-1.5 rounded-full border border-border bg-background/60 px-2 sm:px-2.5 py-0.5 sm:py-1 shrink-0">
          <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
          <span className="text-[9px] sm:text-[10px] font-medium text-muted-foreground">
            Ao vivo
          </span>
        </div>
      </div>

      <div className="flex">
        {/* Mini sidebar - hidden on mobile to save space */}
        <div className="hidden sm:flex w-44 flex-shrink-0 flex-col border-r border-border bg-sidebar p-5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/Vortex Padrão.svg" alt="Vórtex+" className="h-5 w-auto invert" />
          <div className="mt-6 space-y-2">
            <div className="flex items-center gap-2.5 rounded-md bg-sidebar-primary px-3 py-2 text-xs font-medium text-sidebar-primary-foreground">
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </div>
            <div className="flex items-center gap-2.5 rounded-md px-3 py-2 text-xs text-sidebar-foreground/60">
              <Megaphone className="h-4 w-4" />
              Campanhas
            </div>
          </div>
        </div>

        {/* Panel content */}
        <div className="flex-1 p-3 sm:p-6 lg:p-8 text-left">
          {/* Metrics grid: 2 cols on mobile, 3 cols on sm+ */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4">
            {metrics.map((metric) => (
              <div
                key={metric.label}
                className="rounded-lg border border-border bg-background/60 p-2.5 sm:p-4"
              >
                <div
                  className={`flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-md ${metric.color}`}
                >
                  <metric.icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </div>
                <p className="mt-1.5 sm:mt-3 text-base sm:text-xl font-bold text-card-foreground leading-none tabular-nums">
                  {metric.value}
                </p>
                <p className="mt-0.5 sm:mt-1.5 text-[10px] sm:text-[11px] text-muted-foreground leading-tight">
                  {metric.label}
                </p>
              </div>
            ))}
          </div>

          {/* Campaign list */}
          <div className="mt-3 sm:mt-5 space-y-2.5 sm:space-y-4">
            <div className="rounded-lg border border-border bg-background/60 p-2.5 sm:p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs sm:text-sm font-medium text-card-foreground truncate">
                  Lançamento Black Friday
                </p>
                <span className="text-[10px] sm:text-xs text-muted-foreground tabular-nums shrink-0">
                  {leads.toLocaleString("pt-BR")} leads
                </span>
              </div>
              <div className="mt-2 sm:mt-3 space-y-1.5 sm:space-y-2">
                {groups.map((group) => (
                  <div key={group.name} className="flex items-center gap-1.5 sm:gap-3">
                    <span className="w-11 sm:w-16 text-[10px] sm:text-xs text-muted-foreground">
                      {group.name}
                    </span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                      <div
                        className={`h-full rounded-full transition-transform duration-1000 ease-out origin-left ${
                          group.pct >= 100 ? "bg-primary" : "bg-chart-1"
                        }`}
                        style={{ transform: `scaleX(${group.pct / 100})` }}
                      />
                    </div>
                    <span className="w-7 sm:w-10 text-right text-[10px] sm:text-xs text-muted-foreground tabular-nums">
                      {group.pct}%
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-border bg-background/60 p-2.5 sm:p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs sm:text-sm font-medium text-card-foreground truncate">
                  Webinar de Vendas
                </p>
                <span className="text-[10px] sm:text-xs text-muted-foreground shrink-0">
                  312 leads
                </span>
              </div>
              <div className="mt-2 sm:mt-3 space-y-1.5 sm:space-y-2">
                <div className="flex items-center gap-1.5 sm:gap-3">
                  <span className="w-11 sm:w-16 text-[10px] sm:text-xs text-muted-foreground">
                    Grupo 01
                  </span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-chart-1 animate-fill-bar"
                      style={{ transform: "scaleX(0.82)", animationDelay: "900ms" }}
                    />
                  </div>
                  <span className="w-7 sm:w-10 text-right text-[10px] sm:text-xs text-muted-foreground">
                    82%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}