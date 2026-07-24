"use server";

import { prisma } from "@/lib/prisma";
import { fetchGroupParticipants } from "@/lib/evolution";
import { normalizePhoneNumber } from "@/lib/evolution";

export async function syncCampaignLeadsAction(campaignId: string, tenantId: string) {
  // 1. Obter a instância da Evolution API do tenant
  const instance = await prisma.evolutionInstance.findUnique({
    where: { tenantId },
  });

  if (!instance || instance.status !== "CONNECTED") {
    return { success: false, error: "WhatsApp não está conectado." };
  }

  // 2. Obter todos os grupos ativos da campanha com JID
  const groups = await prisma.group.findMany({
    where: { campaignId, tenantId, active: true, groupJid: { not: null } },
  });

  if (groups.length === 0) {
    return { success: false, error: "Nenhum grupo com JID configurado encontrado." };
  }

  let totalSynced = 0;

  for (const group of groups) {
    try {
      // Buscar participantes reais na API
      const participants = await fetchGroupParticipants(
        instance.instanceName,
        group.groupJid!
      );
      
      const realCount = participants.length;
      
      // Atualizar a lotação real do grupo no banco
      await prisma.group.update({
        where: { id: group.id },
        data: { currentCount: realCount },
      });

      // Extrair apenas os números
      const participantPhones = participants.map((p) => p.id.split("@")[0]).filter(Boolean);

      for (const phone of participantPhones) {
        const normalized = normalizePhoneNumber(phone);
        
        // Tentar encontrar lead PENDING com esse número
        const lead = await prisma.lead.findFirst({
          where: {
            campaignId,
            tenantId,
            status: "PENDING",
            OR: [
              { whatsapp: phone },
              { whatsapp: normalized },
              { whatsapp: { contains: phone.slice(-8) } },
            ],
          },
          orderBy: { createdAt: "desc" },
        });

        if (lead) {
          await prisma.lead.update({
            where: { id: lead.id },
            data: {
              status: "JOINED",
              joinedAt: new Date(),
              groupId: group.id,
            },
          });
          totalSynced++;
        }
      }
    } catch (err) {
      console.error(`Erro ao sincronizar grupo ${group.name}:`, err);
    }
  }

  // 3. Opcional: Marcar leads muito antigos como NOT_JOINED
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  await prisma.lead.updateMany({
    where: {
      campaignId,
      tenantId,
      status: "PENDING",
      createdAt: { lt: twentyFourHoursAgo },
    },
    data: { status: "NOT_JOINED" },
  });

  return { success: true, totalSynced };
}
