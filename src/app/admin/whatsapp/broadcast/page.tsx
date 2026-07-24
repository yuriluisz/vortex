import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { BroadcastForm } from "./BroadcastForm";

/**
 * /admin/whatsapp/broadcast — Página de disparos de mensagens.
 * Só acessível se WhatsApp está conectado.
 */
export default async function BroadcastPage() {
  const session = await getSession();
  if (!session?.email || !session.tenantId) {
    redirect("/admin/login");
  }

  // Verificar conexão
  const instance = await prisma.evolutionInstance.findUnique({
    where: { tenantId: session.tenantId },
    select: { status: true, phoneNumber: true },
  });

  if (!instance || instance.status !== "CONNECTED") {
    redirect("/admin/whatsapp/config");
  }

  // Buscar campanhas ativas com grupos
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

  return (
    <div className="mx-auto max-w-5xl">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
        <div>
          <p className="text-sm text-muted-foreground">
            Envie mensagens para os grupos das suas campanhas.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-chart-1/10 px-4 py-2 text-sm text-chart-1 font-medium">
          <span className="h-2 w-2 rounded-full bg-chart-1 animate-pulse" />
          Conectado • {instance.phoneNumber}
        </div>
      </div>

      {/* Broadcast Form */}
      <BroadcastForm campaigns={campaigns} />
    </div>
  );
}
