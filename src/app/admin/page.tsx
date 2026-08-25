import Link from "next/link";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  Megaphone,
  Users,
  MessageCircle,
  Plus,
  BarChart3,
  ExternalLink,
  Eye,
  Percent,
} from "lucide-react";
import { DashboardCharts } from "./dashboard-charts";
import { getLeadsTimeSeries } from "./dashboard-actions";
import { CopyCampaignLink } from "@/components/admin/copy-campaign-link";

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
          customDomain: true,
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

  const avgLeads = totalCampaigns > 0 ? Math.round(totalLeads / totalCampaigns) : 0;

  if (totalCampaigns === 0) {
    redirect("/admin/campaigns/new");
  }

  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      {/* ─── 1. KPIS RESUMO ─── */}
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        {/* Campanhas */}
        <div className="glass-panel rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:border-chart-1/30 group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Campanhas
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg text-chart-1 bg-chart-1/10 transition-transform duration-200 group-hover:scale-110">
              <Megaphone className="h-4 w-4" />
            </div>
          </div>
          <div>
            <p className="text-3xl font-extrabold text-foreground tracking-tight tabular-nums">
              {totalCampaigns}
            </p>
            <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Ativas na plataforma
            </p>
          </div>
        </div>

        {/* Leads Totais */}
        <div className="glass-panel rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:border-chart-2/30 group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Leads Totais
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg text-chart-2 bg-chart-2/10 transition-transform duration-200 group-hover:scale-110">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div>
            <p className="text-3xl font-extrabold text-foreground tracking-tight tabular-nums">
              {totalLeads.toLocaleString("pt-BR")}
            </p>
            <p className="text-[11px] text-muted-foreground mt-1">
              Capturados no total
            </p>
          </div>
        </div>

        {/* Grupos Ativos */}
        <div className="glass-panel rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:border-chart-3/30 group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Grupos de WhatsApp
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg text-chart-3 bg-chart-3/10 transition-transform duration-200 group-hover:scale-110">
              <MessageCircle className="h-4 w-4" />
            </div>
          </div>
          <div>
            <p className="text-3xl font-extrabold text-foreground tracking-tight tabular-nums">
              {activeGroups}
            </p>
            <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-chart-3" />
              Sincronizados e ativos
            </p>
          </div>
        </div>

        {/* Média / Campanha */}
        <div className="glass-panel rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:border-chart-4/30 group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Média de Leads
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg text-chart-4 bg-chart-4/10 transition-transform duration-200 group-hover:scale-110">
              <BarChart3 className="h-4 w-4" />
            </div>
          </div>
          <div>
            <p className="text-3xl font-extrabold text-foreground tracking-tight tabular-nums">
              {avgLeads.toLocaleString("pt-BR")}
            </p>
            <p className="text-[11px] text-muted-foreground mt-1">
              Por campanha ativa
            </p>
          </div>
        </div>
      </div>

      {/* ─── 2. GRÁFICO CONSOLIDADO DE PERFORMANCE ─── */}
      <DashboardCharts
        initialData={initialTimeSeries}
        initialCampaigns={campaigns.map((c) => ({ id: c.id, name: c.name }))}
      />

      {/* ─── 3. CAMPANHAS COM QUICK ACTIONS ─── */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-bold text-foreground tracking-tight">
              Campanhas em Andamento
            </h3>
            <p className="text-xs text-muted-foreground">
              Visão direta do desempenho, capacidade de grupos e links de acesso.
            </p>
          </div>
          <Link
            href="/admin/campaigns/new"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs sm:text-sm font-semibold text-primary-foreground shadow-md shadow-primary/20 transition-all duration-200 hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98] w-full sm:w-auto justify-center"
          >
            <Plus className="h-4 w-4" />
            Nova Campanha
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {campaigns.map((campaign) => {
            const campaignGroups = campaign.groups;
            const leadCount = campaign._count.leads;
            const viewsCount = campaign.views || 0;
            const conversion = viewsCount > 0 ? Math.round((leadCount / viewsCount) * 100) : 0;

            return (
              <div
                key={campaign.id}
                className="group glass-panel rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between transition-all duration-200 hover:shadow-xl hover:border-primary/30 hover:-translate-y-0.5"
              >
                <div>
                  {/* Header: Nome + Status + Total de Leads */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                        </span>
                        <span className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider">
                          Ativa
                        </span>
                      </div>
                      <Link
                        href={`/admin/campaigns/${campaign.id}`}
                        className="text-base font-bold text-foreground truncate hover:text-primary transition-colors block"
                        title={campaign.name}
                      >
                        {campaign.name}
                      </Link>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <span className="text-xl font-extrabold text-foreground tabular-nums block">
                        {leadCount.toLocaleString("pt-BR")}
                      </span>
                      <span className="text-[10px] text-muted-foreground">leads</span>
                    </div>
                  </div>

                  {/* Meta Pills: Visitas + Conversão */}
                  <div className="flex items-center gap-2 mb-4">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-muted/60 text-muted-foreground border border-border/40">
                      <Eye className="h-3 w-3 text-muted-foreground" />
                      {viewsCount.toLocaleString("pt-BR")} views
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-primary/10 text-primary border border-primary/20">
                      <Percent className="h-3 w-3" />
                      {conversion}% conv.
                    </span>
                  </div>

                  {/* Listagem de Grupos com Barras de Progresso */}
                  <div className="space-y-2 pt-2 border-t border-border/30">
                    <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider block mb-1.5">
                      Grupos ({campaignGroups.length})
                    </span>

                    {campaignGroups.length === 0 ? (
                      <p className="text-xs text-muted-foreground/70 py-1 italic">
                        Nenhum grupo ativo configurado
                      </p>
                    ) : (
                      campaignGroups.map((group) => {
                        const pct =
                          group.maxCapacity > 0
                            ? Math.round((group.currentCount / group.maxCapacity) * 100)
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
                          <div key={group.id} className="space-y-1">
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="text-muted-foreground truncate max-w-[150px]">
                                {group.name || "Grupo WhatsApp"}
                              </span>
                              <span className="font-medium text-foreground/80 tabular-nums flex-shrink-0">
                                {group.currentCount}/{group.maxCapacity}
                              </span>
                            </div>
                            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                              <div
                                className={`h-full rounded-full ${barColor} transition-all duration-300`}
                                style={{ width: `${Math.min(pct, 100)}%` }}
                              />
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Quick Actions Footer */}
                <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-border/40">
                  <CopyCampaignLink slug={campaign.slug} customDomain={campaign.customDomain} />

                  <div className="flex items-center gap-1.5">
                    <Link
                      href={`/admin/campaigns/${campaign.id}/leads`}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                      title="Ver todos os leads desta campanha"
                    >
                      <Users className="h-3 w-3" />
                      Leads
                    </Link>
                    <Link
                      href={`/admin/campaigns/${campaign.id}`}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold text-primary bg-primary/10 hover:bg-primary/20 transition-colors"
                    >
                      Editar
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}