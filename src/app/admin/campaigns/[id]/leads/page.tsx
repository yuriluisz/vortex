import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { notFound, redirect } from "next/navigation";
import { Download } from "lucide-react";
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
  const resolvedSearchParams = await searchParams;
  
  const page = Number(resolvedSearchParams.page) || 1;
  const pageSize = 25;
  const skip = (page - 1) * pageSize;
  
  const [campaign, tenant, totalLeads, pendingCount, joinedCount, notJoinedCount, pagedLeads] = await Promise.all([
    prisma.campaign.findUnique({
      where: { id },
      select: { id: true, tenantId: true }
    }),
    prisma.tenant.findUnique({
      where: { id: session.tenantId },
      select: { plan: true },
    }),
    prisma.lead.count({ where: { campaignId: id, tenantId: session.tenantId } }),
    prisma.lead.count({ where: { campaignId: id, tenantId: session.tenantId, status: "PENDING" } }),
    prisma.lead.count({ where: { campaignId: id, tenantId: session.tenantId, status: "JOINED" } }),
    prisma.lead.count({ where: { campaignId: id, tenantId: session.tenantId, status: "NOT_JOINED" } }),
    prisma.lead.findMany({
      where: { campaignId: id, tenantId: session.tenantId },
      orderBy: { createdAt: "desc" },
      take: pageSize,
      skip,
      include: {
        group: { select: { name: true } },
      },
    })
  ]);

  if (!campaign || campaign.tenantId !== session.tenantId) {
    notFound();
  }

  const isUltra = tenant?.plan === "ULTRA";

  const totalPages = Math.ceil(totalLeads / pageSize);

  const formattedLeads: LeadData[] = pagedLeads.map(lead => ({
    id: lead.id,
    name: lead.name,
    whatsapp: lead.whatsapp,
    status: lead.status,
    datadb: lead.datadb,
    horadb: lead.horadb,
    answers: lead.answers,
    metadata: lead.metadata,
    groupName: lead.group?.name,
    joinedAt: lead.joinedAt ? lead.joinedAt.toISOString() : undefined
  }));

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-card-foreground">Base de Leads</h3>
          <p className="text-sm text-muted-foreground">Total de {totalLeads} leads</p>
        </div>
        <div className="flex gap-2">
          {isUltra && <SyncLeadsButton campaignId={id} tenantId={session.tenantId} />}
          {totalLeads > 0 ? (
            <a 
              href={`/admin/campaigns/${id}/leads/export`}
              className="inline-flex items-center gap-2 rounded-lg bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground border border-border transition-colors hover:bg-accent"
              title="Exportar CSV"
            >
              <Download className="h-4 w-4" />
              Exportar CSV
            </a>
          ) : (
            <button 
              type="button"
              disabled
              className="inline-flex items-center gap-2 rounded-lg bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground border border-border transition-colors hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
              title="Nenhum lead para exportar"
            >
              <Download className="h-4 w-4" />
              Exportar CSV
            </button>
          )}
        </div>
      </div>

      {/* Status Summary */}
      {totalLeads > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="rounded-lg border border-chart-2/20 bg-chart-2/5 px-4 py-3 text-center">
            <p className="text-xl font-bold text-chart-2 tabular-nums">{pendingCount}</p>
            <p className="text-xs text-chart-2/70">Aguardando</p>
          </div>
          <div className="rounded-lg border border-chart-1/20 bg-chart-1/5 px-4 py-3 text-center">
            <p className="text-xl font-bold text-chart-1 tabular-nums">{joinedCount}</p>
            <p className="text-xs text-chart-1/70">No grupo</p>
          </div>
          <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-center">
            <p className="text-xl font-bold text-destructive tabular-nums">{notJoinedCount}</p>
            <p className="text-xs text-destructive/70">Não entrou</p>
          </div>
        </div>
      )}

      <LeadsTable leads={formattedLeads} currentPage={page} totalPages={totalPages} totalLeads={totalLeads} />
    </div>
  );
}

