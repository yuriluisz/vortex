import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { notFound, redirect } from "next/navigation";
import { Download } from "lucide-react";
import { LeadsTable } from "./LeadsTable";
import type { LeadData } from "./LeadsTable";

import { SyncLeadsButton } from "./SyncLeadsButton";

export default async function CampaignLeadsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session?.email || !session.tenantId) {
    redirect("/admin/login");
  }

  const { id } = await params;
  
  const [campaign, tenant] = await Promise.all([
    prisma.campaign.findUnique({
      where: { id },
      include: {
        leads: {
          orderBy: { createdAt: "desc" },
          include: {
            group: { select: { name: true } },
          },
        },
      },
    }),
    prisma.tenant.findUnique({
      where: { id: session.tenantId },
      select: { plan: true },
    }),
  ]);

  if (!campaign || campaign.tenantId !== session.tenantId) {
    notFound();
  }

  const isUltra = tenant?.plan === "ULTRA";

  // Contadores por status
  const statusCounts = {
    PENDING: campaign.leads.filter((l) => l.status === "PENDING").length,
    JOINED: campaign.leads.filter((l) => l.status === "JOINED").length,
    NOT_JOINED: campaign.leads.filter((l) => l.status === "NOT_JOINED").length,
  };

  const formattedLeads: LeadData[] = campaign.leads.map(lead => ({
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
          <p className="text-sm text-muted-foreground">Total de {campaign.leads.length} leads capturados</p>
        </div>
        <div className="flex gap-2">
          {isUltra && <SyncLeadsButton campaignId={id} tenantId={session.tenantId} />}
          <button 
            type="button"
            disabled
            className="inline-flex items-center gap-2 rounded-lg bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground border border-border transition-colors hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
            title="Exportar CSV (Em breve)"
          >
            <Download className="h-4 w-4" />
            Exportar CSV
          </button>
        </div>
      </div>

      {/* Status Summary */}
      {campaign.leads.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="rounded-lg border border-chart-2/20 bg-chart-2/5 px-4 py-3 text-center">
            <p className="text-xl font-bold text-chart-2 tabular-nums">{statusCounts.PENDING}</p>
            <p className="text-xs text-chart-2/70">Aguardando</p>
          </div>
          <div className="rounded-lg border border-chart-1/20 bg-chart-1/5 px-4 py-3 text-center">
            <p className="text-xl font-bold text-chart-1 tabular-nums">{statusCounts.JOINED}</p>
            <p className="text-xs text-chart-1/70">No grupo</p>
          </div>
          <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-center">
            <p className="text-xl font-bold text-destructive tabular-nums">{statusCounts.NOT_JOINED}</p>
            <p className="text-xs text-destructive/70">Não entrou</p>
          </div>
        </div>
      )}

      <LeadsTable leads={formattedLeads} />
    </div>
  );
}

