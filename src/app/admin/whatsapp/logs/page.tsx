import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { LogsTable } from "./LogsTable";
import type { LogMessage } from "./LogsTable";
import { Send, CheckCircle2, Users } from "lucide-react";

export default async function LogsPage() {
  const session = await getSession();
  if (!session?.email || !session.tenantId) {
    redirect("/admin/login");
  }

  // Buscar histórico de disparos
  const recentMessages = await prisma.groupMessage.findMany({
    where: { tenantId: session.tenantId },
    include: {
      campaign: { select: { name: true } },
    },
    orderBy: { sentAt: "desc" },
    take: 50,
  });

  // Buscar número do remetente
  const instance = await prisma.evolutionInstance.findUnique({
    where: { tenantId: session.tenantId },
    select: { phoneNumber: true },
  });

  // Buscar nomes dos grupos
  const allGroupIds = Array.from(new Set(recentMessages.flatMap((m) => m.groupIds)));
  const groups = await prisma.group.findMany({
    where: { id: { in: allGroupIds } },
    select: { id: true, name: true },
  });

  const groupNames = groups.reduce((acc, group) => {
    acc[group.id] = group.name;
    return acc;
  }, {} as Record<string, string>);

  const formattedMessages: LogMessage[] = recentMessages.map((m) => ({
    id: m.id,
    campaignName: m.campaign.name,
    content: m.content,
    targetType: m.targetType,
    groupIds: m.groupIds,
    status: m.status,
    sentAt: m.sentAt.toISOString(),
  }));

  // Fetch KPI data
  const totalMessages = await prisma.groupMessage.count({
    where: { tenantId: session.tenantId },
  });
  const deliveredMessages = await prisma.groupMessage.count({
    where: {
      tenantId: session.tenantId,
      status: { in: ["SENT", "DELIVERED"] },
    },
  });

  const successRate = totalMessages > 0 ? Math.round((deliveredMessages / totalMessages) * 100) : 0;

  const allSentMessages = await prisma.groupMessage.findMany({
    where: { tenantId: session.tenantId },
    select: { groupIds: true },
  });

  const uniqueGroupsReached = new Set(allSentMessages.flatMap((m) => m.groupIds)).size;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* KPIs WPP */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="glass-panel rounded-2xl p-5 border border-primary/20 bg-primary/[0.02] flex items-center gap-3.5 shadow-sm">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-primary bg-primary/10 border border-primary/20">
            <Send className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground">Total de Disparos</p>
            <p className="text-2xl font-extrabold text-foreground tabular-nums mt-0.5">
              {totalMessages.toLocaleString("pt-BR")}
            </p>
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-5 border border-emerald-500/20 bg-emerald-500/[0.02] flex items-center gap-3.5 shadow-sm">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-emerald-400 bg-emerald-500/10 border border-emerald-500/20">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground">Taxa de Sucesso</p>
            <p className="text-2xl font-extrabold text-foreground tabular-nums mt-0.5">
              {successRate}%
            </p>
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-5 border border-chart-3/20 bg-chart-3/[0.02] flex items-center gap-3.5 shadow-sm">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-chart-3 bg-chart-3/10 border border-chart-3/20">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground">Grupos Alcançados</p>
            <p className="text-2xl font-extrabold text-foreground tabular-nums mt-0.5">
              {uniqueGroupsReached.toLocaleString("pt-BR")}
            </p>
          </div>
        </div>
      </div>

      <LogsTable
        messages={formattedMessages}
        groupNames={groupNames}
        senderNumber={instance?.phoneNumber}
      />
    </div>
  );
}
