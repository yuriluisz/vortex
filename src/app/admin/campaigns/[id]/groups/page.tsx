import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { notFound, redirect } from "next/navigation";
import CreateGroupForm from "./CreateGroupForm";
import { Trash2, PowerOff, Power, Zap, MessageCircle } from "lucide-react";
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
  const totalCapacity = campaign.groups.reduce((acc, g) => acc + g.maxCapacity, 0);
  const totalOccupancy = campaign.groups.reduce((acc, g) => acc + g.currentCount, 0);

  return (
    <div className="space-y-6">
      {/* Resumo e Botão de Criar em Massa */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-foreground tracking-tight">
            Gerenciamento de Grupos ({campaign.groups.length})
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Ocupação total: <span className="font-semibold text-foreground">{totalOccupancy}</span> / {totalCapacity} vagas
          </p>
        </div>
        {isUltra && <BulkCreateButton campaignId={campaign.id} />}
      </div>

      <CreateGroupForm campaignId={campaign.id} hasWhatsapp={isUltra} />

      {isUltra && (
        <GroupSettingsForm campaign={campaign} isUltra={isUltra} />
      )}

      {/* Tabela de Grupos */}
      <div className="glass-panel rounded-2xl overflow-hidden shadow-lg border border-border/60">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-muted-foreground">
            <thead className="bg-muted/70 text-[11px] uppercase tracking-wider text-muted-foreground border-b border-border/60 font-semibold">
              <tr>
                <th className="px-5 py-3.5">Grupo / Link</th>
                <th className="px-5 py-3.5">Capacidade</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {campaign.groups.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="h-10 w-10 rounded-full bg-muted/60 flex items-center justify-center text-muted-foreground">
                        <MessageCircle className="h-5 w-5" />
                      </div>
                      <p className="text-sm font-semibold text-foreground">Nenhum grupo cadastrado</p>
                      <p className="text-xs text-muted-foreground max-w-sm">
                        Adicione links de grupos de WhatsApp acima para ativar a rotação automática de leads.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                campaign.groups.map((group) => {
                  const percentage = Math.min(100, Math.round((group.currentCount / group.maxCapacity) * 100));

                  const barColor =
                    percentage >= 100
                      ? "bg-destructive shadow-[0_0_10px_rgba(239,68,68,0.5)]"
                      : percentage >= 80
                        ? "bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.4)]"
                        : percentage >= 50
                          ? "bg-chart-3"
                          : "bg-primary";

                  return (
                    <tr key={group.id} className="transition-colors hover:bg-muted/40">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="font-semibold text-foreground text-sm">{group.name}</p>
                          {group.autoCreated && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-chart-3/15 text-chart-3 px-2 py-0.5 text-[10px] font-semibold border border-chart-3/30">
                              <Zap className="h-2.5 w-2.5" />
                              Auto
                            </span>
                          )}
                        </div>
                        <EditGroupUrlModal groupId={group.id} campaignId={campaign.id} initialUrl={group.url} />
                        {group.groupJid && (
                          <p className="text-[10px] text-muted-foreground/60 font-mono mt-0.5 truncate max-w-[220px]">
                            JID: {group.groupJid}
                          </p>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-full max-w-[140px] bg-muted rounded-full h-2 overflow-hidden">
                            <div
                              className={`h-2 rounded-full transition-all duration-300 ${barColor}`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="text-xs font-semibold text-foreground/80 whitespace-nowrap tabular-nums">
                            {group.currentCount}/{group.maxCapacity} ({percentage}%)
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                            group.active
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${group.active ? "bg-emerald-400 animate-pulse" : "bg-muted-foreground"}`} />
                          {group.active ? "Ativo" : "Pausado"}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {isUltra && <SyncGroupButton groupId={group.id} />}

                          <form
                            action={async () => {
                              "use server";
                              await toggleGroupStatusAction(group.id, campaign.id, !group.active);
                            }}
                          >
                            <button
                              type="submit"
                              title={group.active ? "Pausar grupo" : "Ativar grupo"}
                              className={`p-2 rounded-xl transition-colors ${
                                group.active
                                  ? "text-muted-foreground hover:text-foreground hover:bg-muted"
                                  : "text-emerald-400 hover:bg-emerald-500/10"
                              }`}
                            >
                              {group.active ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
                            </button>
                          </form>
                          <form
                            action={async () => {
                              "use server";
                              await deleteGroupAction(group.id, campaign.id);
                            }}
                          >
                            <button
                              type="submit"
                              title="Excluir grupo"
                              className="p-2 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
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
    </div>
  );
}
