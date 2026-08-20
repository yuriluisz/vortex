import Link from "next/link";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Megaphone, Users, MessageCircle, Plus, BarChart3 } from "lucide-react";
import { DashboardCharts } from "./dashboard-charts";
import { getLeadsTimeSeries } from "./dashboard-actions";

export default async function AdminDashboardPage() {
  const session = await getSession();

  if (!session?.email || !session.tenantId) {
    redirect("/admin/login");
  }

  const { tenantId } = session;

  const [totalCampaigns, totalLeads, activeGroups, campaigns, initialTimeSeries] =
    await Promise.all([
      prisma.campaign.count({ where: { active: true, tenantId } }),
      prisma.lead.count({ where: { tenantId } }),
      prisma.group.count({ where: { active: true, tenantId } }),
      prisma.campaign.findMany({
        where: { active: true, tenantId },
        select: {
          id: true,
          name: true,
          slug: true,
          views: true,
          _count: { select: { leads: true } },
          groups: {
            where: { active: true },
            select: { id: true, name: true, currentCount: true, maxCapacity: true },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      getLeadsTimeSeries(7),
    ]);

  const totalActiveGroups = activeGroups;
  const avgLeads = totalCampaigns > 0 ? Math.round(totalLeads / totalCampaigns) : 0;

  const hasNoCampaigns = totalCampaigns === 0;

  if (hasNoCampaigns) {
    redirect("/admin/campaigns/new");
  }

  return (
    <div className="flex flex-col gap-5 sm:gap-8">

      {/* ─── 2. KPIS ─── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Campanhas */}
        <div className="glass-panel rounded-xl p-4 sm:p-5 relative overflow-hidden flex flex-col justify-center transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:border-primary/30">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg text-chart-1 bg-chart-1/10">
              <Megaphone className="h-4 w-4" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">Campanhas</p>
          </div>
          <p className="text-2xl font-bold text-card-foreground tabular-nums">
            {totalCampaigns}
          </p>
        </div>

        {/* Leads */}
        <div className="glass-panel rounded-xl p-4 sm:p-5 relative overflow-hidden flex flex-col justify-center transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:border-primary/30">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg text-chart-2 bg-chart-2/10">
              <Users className="h-4 w-4" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">Leads Totais</p>
          </div>
          <p className="text-2xl font-bold text-card-foreground tabular-nums">
            {totalLeads.toLocaleString("pt-BR")}
          </p>
        </div>

        {/* Grupos */}
        <div className="glass-panel rounded-xl p-4 sm:p-5 relative overflow-hidden flex flex-col justify-center transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:border-primary/30">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg text-chart-3 bg-chart-3/10">
              <MessageCircle className="h-4 w-4" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">Grupos Ativos</p>
          </div>
          <p className="text-2xl font-bold text-card-foreground tabular-nums">
            {totalActiveGroups}
          </p>
        </div>

        {/* Média */}
        <div className="glass-panel rounded-xl p-4 sm:p-5 relative overflow-hidden flex flex-col justify-center transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:border-primary/30">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg text-chart-4 bg-chart-4/10">
              <BarChart3 className="h-4 w-4" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">Média / Campanha</p>
          </div>
          <p className="text-2xl font-bold text-card-foreground tabular-nums">
            {avgLeads.toLocaleString("pt-BR")}
          </p>
        </div>
      </div>

      {/* ─── GRÁFICO: Leads por dia (com animação fluida + filtros) ─── */}
      <DashboardCharts
        initialData={initialTimeSeries}
        initialCampaigns={campaigns.map((c) => ({ id: c.id, name: c.name }))}
      />

      {/* ─── 3. CAMPANHAS com listagem de grupos ─── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-card-foreground">
            Campanhas
          </h3>
          <Link
            href="/admin/campaigns/new"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-md transition-all duration-300 hover:bg-primary/90 hover:scale-105 active:scale-[0.97]"
          >
            <Plus className="h-4 w-4" />
            Nova campanha
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {campaigns.map((campaign) => {
            const campaignGroups = campaign.groups;

            return (
              <Link
                key={campaign.id}
                href={`/admin/campaigns/${campaign.id}`}
                className="group glass-panel rounded-xl p-4 sm:p-5 relative overflow-hidden transition-all duration-200 hover:shadow-md hover:border-primary/20 hover:-translate-y-0.5"
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