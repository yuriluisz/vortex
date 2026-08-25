import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { notFound, redirect } from "next/navigation";
import { checkCampaignAccess } from "@/lib/permissions";
import { Download, Users, Clock, CheckCircle2, XCircle } from "lucide-react";
import { LeadsTable } from "./LeadsTable";
import type { LeadData } from "./LeadsTable";
import { SyncLeadsButton } from "./SyncLeadsButton";

export default async function CampaignLeadsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await getSession();
  if (!session?.email || !session.tenantId) {
    redirect("/admin/login");
  }

  const { id } = await params;
  const access = await checkCampaignAccess(id, session.userId, session.tenantId);
  if (!access.allowed) {
    notFound();
  }

  const campaign = await prisma.campaign.findUnique({
    where: { id },
    select: { id: true, name: true, tenantId: true },
  });

  if (!campaign) {
    notFound();
  }

  const resolvedSearchParams = await searchParams;

  const page = Number(resolvedSearchParams.page) || 1;
  const pageSize = 25;
  const skip = (page - 1) * pageSize;

  const [tenant, totalLeads, pendingCount, joinedCount, notJoinedCount, pagedLeads] = await Promise.all([
    prisma.tenant.findUnique({
      where: { id: campaign.tenantId },
      select: { plan: true },
    }),
    prisma.lead.count({ where: { campaignId: id, tenantId: campaign.tenantId } }),
    prisma.lead.count({ where: { campaignId: id, tenantId: campaign.tenantId, status: "PENDING" } }),
    prisma.lead.count({ where: { campaignId: id, tenantId: campaign.tenantId, status: "JOINED" } }),
    prisma.lead.count({ where: { campaignId: id, tenantId: campaign.tenantId, status: "NOT_JOINED" } }),
    prisma.lead.findMany({
      where: { campaignId: id, tenantId: campaign.tenantId },
      orderBy: { createdAt: "desc" },
      take: pageSize,
      skip,
      include: {
        group: { select: { name: true } },
      },
    }),
  ]);

  const isUltra = tenant?.plan === "ULTRA";
  const totalPages = Math.ceil(totalLeads / pageSize);

  const formattedLeads: LeadData[] = pagedLeads.map((lead) => ({
    id: lead.id,
    name: lead.name,
    whatsapp: lead.whatsapp,
    status: lead.status,
    datadb: lead.datadb,
    horadb: lead.horadb,
    answers: lead.answers,
    metadata: lead.metadata,
    groupName: lead.group?.name,
    joinedAt: lead.joinedAt ? lead.joinedAt.toISOString() : undefined,
  }));

  return (
    <div className="space-y-6">
      {/* Header com Ações */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-bold text-foreground tracking-tight">
            Base de Leads ({totalLeads.toLocaleString("pt-BR")})
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Contatos capturados através da página da campanha.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isUltra && <SyncLeadsButton campaignId={id} tenantId={session.tenantId} />}
          {totalLeads > 0 ? (
            <a
              href={`/admin/campaigns/${id}/leads/export`}
              className="inline-flex items-center gap-2 rounded-xl bg-secondary/80 px-4 py-2 text-xs font-semibold text-foreground border border-border/60 transition-all hover:bg-secondary active:scale-95 shadow-sm"
              title="Exportar CSV"
            >
              <Download className="h-3.5 w-3.5" />
              Exportar CSV
            </a>
          ) : (
            <button
              type="button"
              disabled
              className="inline-flex items-center gap-2 rounded-xl bg-muted/40 px-4 py-2 text-xs font-semibold text-muted-foreground border border-border/40 opacity-50 cursor-not-allowed"
            >
              <Download className="h-3.5 w-3.5" />
              Exportar CSV
            </button>
          )}
        </div>
      </div>

      {/* Cards de Status de Entrada */}
      {totalLeads > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* No Grupo (Joined) */}
          <div className="glass-panel rounded-2xl p-4 flex items-center justify-between border border-emerald-500/20 bg-emerald-500/[0.03]">
            <div>
              <span className="text-xs font-semibold text-emerald-400 block mb-1 flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5" />
                No Grupo
              </span>
              <p className="text-2xl font-extrabold text-foreground tabular-nums">
                {joinedCount.toLocaleString("pt-BR")}
              </p>
            </div>
            <div className="text-right text-[11px] text-muted-foreground">
              {totalLeads > 0 ? Math.round((joinedCount / totalLeads) * 100) : 0}% do total
            </div>
          </div>

          {/* Aguardando (Pending) */}
          <div className="glass-panel rounded-2xl p-4 flex items-center justify-between border border-amber-500/20 bg-amber-500/[0.03]">
            <div>
              <span className="text-xs font-semibold text-amber-400 block mb-1 flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                Aguardando Entrada
              </span>
              <p className="text-2xl font-extrabold text-foreground tabular-nums">
                {pendingCount.toLocaleString("pt-BR")}
              </p>
            </div>
            <div className="text-right text-[11px] text-muted-foreground">
              {totalLeads > 0 ? Math.round((pendingCount / totalLeads) * 100) : 0}% do total
            </div>
          </div>

          {/* Não Entrou (Not Joined) */}
          <div className="glass-panel rounded-2xl p-4 flex items-center justify-between border border-destructive/20 bg-destructive/[0.03]">
            <div>
              <span className="text-xs font-semibold text-destructive block mb-1 flex items-center gap-1.5">
                <XCircle className="h-3.5 w-3.5" />
                Não Ingressaram
              </span>
              <p className="text-2xl font-extrabold text-foreground tabular-nums">
                {notJoinedCount.toLocaleString("pt-BR")}
              </p>
            </div>
            <div className="text-right text-[11px] text-muted-foreground">
              {totalLeads > 0 ? Math.round((notJoinedCount / totalLeads) * 100) : 0}% do total
            </div>
          </div>
        </div>
      )}

      {/* Tabela de Leads */}
      <LeadsTable
        leads={formattedLeads}
        currentPage={page}
        totalPages={totalPages}
        totalLeads={totalLeads}
      />
    </div>
  );
}
