import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { WhatsAppChatConsole } from "@/components/admin/whatsapp-chat-console";

export default async function BroadcastPage() {
  const session = await getSession();
  if (!session?.email || !session.tenantId) {
    redirect("/admin/login");
  }

  // Buscar status da instância WhatsApp
  const instance = await prisma.evolutionInstance.findUnique({
    where: { tenantId: session.tenantId },
    select: { status: true, phoneNumber: true, instanceName: true },
  });

  // Buscar campanhas com grupos ativos
  const campaigns = await prisma.campaign.findMany({
    where: {
      tenantId: session.tenantId,
      active: true,
    },
    select: {
      id: true,
      name: true,
      slug: true,
      groups: {
        where: { active: true },
        select: {
          id: true,
          name: true,
          groupJid: true,
          currentCount: true,
          maxCapacity: true,
        },
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Buscar histórico de mensagens
  const recentMessages = await prisma.groupMessage.findMany({
    where: { tenantId: session.tenantId },
    orderBy: { sentAt: "asc" },
    take: 150,
  });

  const formattedMessages = recentMessages.map((m) => ({
    id: m.id,
    campaignId: m.campaignId,
    content: m.content,
    targetType: m.targetType,
    groupIds: m.groupIds,
    status: m.status,
    sentAt: m.sentAt.toISOString(),
    results: m.results as Record<string, string> | null,
  }));

  return (
    <div className="flex-1 flex flex-col min-h-0 w-full h-full overflow-hidden">
      <WhatsAppChatConsole
        campaigns={campaigns}
        initialMessages={formattedMessages}
        instanceStatus={instance?.status || "DISCONNECTED"}
        phoneNumber={instance?.phoneNumber}
      />
    </div>
  );
}
