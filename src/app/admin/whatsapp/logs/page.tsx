import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { LogsTable } from "./LogsTable";
import type { LogMessage } from "./LogsTable";

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
    where: { tenantId: session.tenantId, status: "DELIVERED" },
  });
  
  const successRate = totalMessages > 0 ? Math.round((deliveredMessages / totalMessages) * 100) : 0;
  
  // Apenas mensagens enviadas para contabilizar grupos únicos alcançados
  const allSentMessages = await prisma.groupMessage.findMany({
    where: { tenantId: session.tenantId },
    select: { groupIds: true },
  });
  
  const uniqueGroupsReached = new Set(allSentMessages.flatMap((m) => m.groupIds)).size;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* KPIs WPP */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="glass-panel rounded-xl p-5 shadow-sm relative overflow-hidden">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg text-chart-1 bg-chart-1/10">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-send"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Total de Disparos</p>
              <p className="text-xl font-bold text-card-foreground tabular-nums">
                {totalMessages.toLocaleString("pt-BR")}
              </p>
            </div>
          </div>
        </div>
        
        <div className="glass-panel rounded-xl p-5 shadow-sm relative overflow-hidden">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg text-emerald-500 bg-emerald-500/10">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-check-circle-2"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Taxa de Sucesso</p>
              <p className="text-xl font-bold text-card-foreground tabular-nums">
                {successRate}%
              </p>
            </div>
          </div>
        </div>

        <div className="glass-panel rounded-xl p-5 shadow-sm relative overflow-hidden">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg text-chart-3 bg-chart-3/10">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-users"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Grupos Alcançados</p>
              <p className="text-xl font-bold text-card-foreground tabular-nums">
                {uniqueGroupsReached}
              </p>
            </div>
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
