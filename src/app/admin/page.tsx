import Link from "next/link";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  Megaphone,
  Users,
  MessageCircle,
  Plus,
  TrendingUp,
  ArrowUpRight,
} from "lucide-react";
import { DashboardCharts } from "./dashboard-charts";

export default async function AdminDashboardPage() {
  const session = await getSession();

  if (!session?.email || !session.tenantId) {
    redirect("/admin/login");
  }

  const { tenantId, email } = session;

  // Buscar métricas reais do tenant
  const [totalCampaigns, totalLeads, activeGroups, allGroups, campaigns, tenant] =
    await Promise.all([
      prisma.campaign.count({ where: { active: true, tenantId } }),
      prisma.lead.count({ where: { tenantId } }),
      prisma.group.count({ where: { active: true, tenantId } }),
      prisma.group.findMany({
        where: { active: true, tenantId },
        select: { currentCount: true, maxCapacity: true },
      }),
      prisma.campaign.findMany({
        where: { active: true, tenantId },
        select: {
          id: true,
          name: true,
          slug: true,
          _count: { select: { leads: true } },
          groups: {
            where: { active: true },
            select: { id: true, name: true, currentCount: true, maxCapacity: true },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.tenant.findUnique({
        where: { id: tenantId },
        select: {
          name: true,
          slug: true,
          plan: true,
          maxCampaigns: true,
          maxGroups: true,
          maxLeads: true,
        },
      }),
    ]);

  // Calcular grupos lotados
  const fullGroups = allGroups.filter(
    (g) => g.currentCount >= g.maxCapacity
  ).length;

  // Calcular % total de ocupação dos grupos
  const totalCapacity = allGroups.reduce((acc, g) => acc + g.maxCapacity, 0);
  const totalCurrent = allGroups.reduce((acc, g) => acc + g.currentCount, 0);
  const overallGroupFill =
    totalCapacity > 0
      ? Math.round((totalCurrent / totalCapacity) * 100)
      : 0;

  const hasNoCampaigns = totalCampaigns === 0;

  // Se não tem campanhas, redireciona pro wizard
  if (hasNoCampaigns) {
    redirect("/admin/campaigns/new");
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-3xl font-bold text-foreground tracking-tight">
            Dashboard
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Bem-vindo de volta,{" "}
            <span className="font-medium text-foreground/80">{email}</span>.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/admin/campaigns/new"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-md transition-all duration-200 hover:bg-primary/90 hover:shadow-lg active:scale-[0.97]"
          >
            <Plus className="h-4 w-4" />
            Nova campanha
          </Link>
        </div>
      </div>

      {/* ─── 1. LIMITES DO PLANO ─── */}
      {tenant && (
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-card-foreground">
              Limites do Plano
            </h3>
            {tenant.plan === "FREE" && (
              <Link
              href="/admin/settings?tab=account"
              className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80 transition-colors duration-200"
            >
              Fazer upgrade
              <ArrowUpRight className="h-3 w-3" />
            </Link>
            )}
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[
              {
                label: "Campanhas",
                current: totalCampaigns,
                max: tenant.maxCampaigns,
              },
              {
                label: "Grupos",
                current: activeGroups,
                max: tenant.maxGroups,
              },
              {
                label: "Leads",
                current: totalLeads,
                max: tenant.maxLeads,
              },
            ].map((item) => {
              const isUnlimited = item.max === -1;
              const percentage = isUnlimited
                ? 0
                : Math.round((item.current / item.max) * 100);
              const isNearLimit = percentage >= 80;

              return (
                <div key={item.label}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">{item.label}</span>
                    <span className="font-medium text-foreground/80">
                      {item.current} / {isUnlimited ? "∞" : item.max}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full animate-fill-bar ${
                        isNearLimit ? "bg-destructive" : "bg-primary"
                      }`}
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    />
                  </div>
                  {isNearLimit && !isUnlimited && tenant.plan === "FREE" && (
                    <p className="mt-1 text-[10px] text-destructive">
                      Quase no limite.{" "}
                      <Link
                        href="/admin/settings?tab=account"
                        className="underline hover:text-destructive/80"
                      >
                        Faça upgrade
                      </Link>
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── 2. KPIS ─── */}
      {/* KPIs antigos — 3 cards pequenos */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg text-chart-1 bg-chart-1/10">
                <Megaphone className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  Campanhas Ativas
                </p>
                <p className="text-xl font-bold text-card-foreground tabular-nums">
                  {totalCampaigns}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg text-chart-2 bg-chart-2/10">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  Leads Capturados
                </p>
                <p className="text-xl font-bold text-card-foreground tabular-nums">
                  {totalLeads.toLocaleString("pt-BR")}
                </p>
              </div>
            </div>
            <TrendingUp className="h-4 w-4 text-chart-2" />
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg text-chart-3 bg-chart-3/10">
                <MessageCircle className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  Grupos Ativos
                </p>
                <p className="text-xl font-bold text-card-foreground tabular-nums">
                  {activeGroups}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── GRÁFICO: Leads por dia (com DotGrid + filtros) ─── */}
      <DashboardCharts />

      {/* ─── 3. CAMPANHAS com listagem de grupos ─── */}
      <div>
        <h3 className="text-lg font-semibold text-card-foreground mb-4">
          Campanhas
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {campaigns.map((campaign) => {
            const campaignGroups = campaign.groups;

            return (
              <Link
                key={campaign.id}
                href={`/admin/campaigns/${campaign.id}`}
                className="group rounded-xl border border-border bg-card p-5 shadow-sm transition-all duration-200 hover:shadow-md hover:border-primary/20 hover:-translate-y-0.5"
              >
                {/* Header da campanha — nome + total de leads no canto */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg text-primary bg-primary/10 transition-transform duration-200 group-hover:scale-110 flex-shrink-0">
                      <Megaphone className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-semibold text-card-foreground truncate">
                        {campaign.name}
                      </h4>
                      <p className="text-[10px] text-muted-foreground">
                        {campaign.slug}.vortex.app
                      </p>
                    </div>
                  </div>
                  <span className="text-lg font-bold text-card-foreground tabular-nums flex-shrink-0">
                    {campaign._count.leads.toLocaleString("pt-BR")}
                  </span>
                </div>

                {/* Listagem de grupos com barra individual */}
                <div className="space-y-2.5">
                  {campaignGroups.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-2">
                      Nenhum grupo ativo
                    </p>
                  ) : (
                    campaignGroups.map((group) => {
                      const pct =
                        group.maxCapacity > 0
                          ? Math.round(
                              (group.currentCount / group.maxCapacity) * 100
                            )
                          : 0;

                      const barColor =
                        pct >= 100
                          ? "bg-destructive"
                          : pct >= 80
                            ? "bg-orange-500"
                            : pct >= 50
                              ? "bg-chart-3"
                              : "bg-primary";

                      return (
                        <div key={group.id}>
                          <div className="flex items-center justify-between mb-0.5">
                            <span className="text-xs text-muted-foreground truncate pr-2">
                              {group.name || "Grupo"}
                            </span>
                            <span className="text-xs font-medium text-foreground/70 tabular-nums flex-shrink-0">
                              {group.currentCount} Leads
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                              <div
                                className={`h-full rounded-full ${barColor} transition-all duration-300`}
                                style={{ width: `${Math.min(pct, 100)}%` }}
                              />
                            </div>
                            <span className="text-[10px] text-muted-foreground tabular-nums w-8 text-right flex-shrink-0">
                              {pct}%
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}