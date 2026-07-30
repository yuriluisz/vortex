import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { notFound, redirect } from "next/navigation";
import CreateGroupForm from "./CreateGroupForm";
import { Trash2, PowerOff, Power, Zap } from "lucide-react";
import { toggleGroupStatusAction, deleteGroupAction } from "../../../actions";
import { EditGroupUrlModal } from "./EditGroupUrlModal";
import { SyncGroupButton, BulkCreateButton } from "./GroupActions";
import { GroupSettingsForm } from "./GroupSettingsForm";

export default async function CampaignGroupsPage({
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
        groups: {
          orderBy: { createdAt: "asc" },
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

  return (
    <div>
      {/* Header com botão de Criar em Massa */}
      <div className="flex items-center justify-between mb-6">
        <div />
        {isUltra && (
          <BulkCreateButton campaignId={campaign.id} />
        )}
      </div>

      <CreateGroupForm campaignId={campaign.id} hasWhatsapp={isUltra} />

      {isUltra && (
        <GroupSettingsForm campaign={campaign} isUltra={isUltra} />
      )}

      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm text-muted-foreground">
          <thead className="bg-muted text-xs uppercase text-muted-foreground border-b border-border">
            <tr>
              <th className="px-6 py-4 font-medium">Grupo / URL</th>
              <th className="px-6 py-4 font-medium">Progresso</th>
              <th className="px-6 py-4 font-medium">Status</th>
              <th className="px-6 py-4 font-medium text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {campaign.groups.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground">
                  Nenhum grupo cadastrado ainda.
                </td>
              </tr>
            ) : (
              campaign.groups.map((group) => {
                const percentage = Math.min(100, Math.round((group.currentCount / group.maxCapacity) * 100));
                
                return (
                  <tr key={group.id} className="transition-colors hover:bg-muted/50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-card-foreground">{group.name}</p>
                        {group.autoCreated && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-chart-3/10 text-chart-3 px-1.5 py-0.5 text-[10px] font-medium">
                            <Zap className="h-2.5 w-2.5" />
                            Auto
                          </span>
                        )}
                      </div>
                      <EditGroupUrlModal groupId={group.id} campaignId={campaign.id} initialUrl={group.url} />
                      {/* JID Badge */}
                      {group.groupJid && (
                        <p className="text-[10px] text-muted-foreground/60 font-mono mt-0.5 truncate max-w-[200px]">
                          JID: {group.groupJid}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-full max-w-[120px] bg-muted rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all ${percentage >= 100 ? 'bg-destructive' : 'bg-primary'}`} 
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {group.currentCount} / {group.maxCapacity}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-medium ${
                        group.active ? "bg-chart-1/10 text-chart-1" : "bg-muted text-muted-foreground"
                      }`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${group.active ? "bg-chart-1" : "bg-muted-foreground"}`}></span>
                        {group.active ? "Ativo" : "Pausado"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {/* Botão Sync (ULTRA only) */}
                        {isUltra && (
                          <SyncGroupButton groupId={group.id} />
                        )}

                        <form action={async () => {
                          "use server";
                          await toggleGroupStatusAction(group.id, campaign.id, !group.active);
                        }}>
                          <button
                            type="submit"
                            title={group.active ? "Pausar" : "Ativar"}
                            className={`p-2 rounded-lg transition-colors ${
                              group.active ? "text-chart-1 hover:bg-chart-1/10" : "text-chart-2 hover:bg-chart-2/10"
                            }`}
                          >
                            {group.active ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
                          </button>
                        </form>
                        <form action={async () => {
                          "use server";
                          await deleteGroupAction(group.id, campaign.id);
                        }}>
                          <button
                            type="submit"
                            title="Excluir"
                            className="p-2 rounded-lg text-destructive hover:bg-destructive/10 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

