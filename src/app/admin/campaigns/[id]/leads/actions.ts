"use server";

import { prisma } from "@/lib/prisma";
import {
  fetchGroupParticipants,
  fetchGroupByInviteCode,
  extractInviteCode,
  extractPhoneVariants,
  matchesPhoneNumber,
  cleanDigits,
} from "@/lib/evolution";

export async function syncCampaignLeadsAction(campaignId: string, tenantId: string) {
  // 1. Obter a instância da Evolution API do tenant
  const instance = await prisma.evolutionInstance.findUnique({
    where: { tenantId },
  });

  if (!instance || instance.status !== "CONNECTED") {
    return { success: false, error: "WhatsApp não está conectado." };
  }

  // 2. Obter todos os grupos ativos da campanha
  const groups = await prisma.group.findMany({
    where: { campaignId, tenantId, active: true },
  });

  if (groups.length === 0) {
    return { success: false, error: "Nenhum grupo ativo encontrado para esta campanha." };
  }

  let totalSynced = 0;

  for (const group of groups) {
    let groupJid = group.groupJid;

    // Se o grupo ainda não possui groupJid, tentar resolver via inviteCode da URL
    if (!groupJid && group.url) {
      const inviteCode = extractInviteCode(group.url);
      if (inviteCode) {
        try {
          const groupInfo = await fetchGroupByInviteCode(
            instance.instanceName,
            inviteCode
          );
          if (groupInfo?.id) {
            groupJid = groupInfo.id;
            await prisma.group.update({
              where: { id: group.id },
              data: { groupJid, inviteCode },
            });
          }
        } catch (err) {
          console.warn(`[Sync Leads] Não foi possível resolver JID do grupo ${group.name}:`, err);
        }
      }
    }

    if (!groupJid) continue;

    try {
      // Buscar participantes reais na API
      const participants = await fetchGroupParticipants(
        instance.instanceName,
        groupJid
      );

      const realCount = participants.length;

      // Atualizar a lotação real do grupo no banco
      await prisma.group.update({
        where: { id: group.id },
        data: { currentCount: realCount },
      });

      // Extrair apenas os identificadores limpos
      for (const p of participants) {
        const rawId = p.id || "";
        // Ignorar LIDs puros do WhatsApp ou IDs sem número
        if (rawId.includes("@lid") && !rawId.includes("@s.whatsapp.net")) {
          // Se for LID puro, não temos o telefone direto a menos que a API resolva
          continue;
        }

        // Remover sufixos (@s.whatsapp.net, :device)
        const rawPhone = rawId.split("@")[0].split(":")[0];
        const digits = cleanDigits(rawPhone);
        if (!digits || digits.length < 8) continue;

        // Gerar todas as variantes possíveis do número para busca eficiente
        const variants = extractPhoneVariants(rawPhone);
        const base8 = digits.slice(-8);
        const last4 = digits.slice(-4);

        // Tentar encontrar lead PENDING ou NOT_JOINED
        const candidateLeads = await prisma.lead.findMany({
          where: {
            campaignId,
            tenantId,
            status: { in: ["PENDING", "NOT_JOINED"] },
            OR: [
              ...variants.map((v) => ({ whatsapp: v })),
              { whatsapp: { contains: base8 } },
              { whatsapp: { contains: last4 } },
            ],
          },
          orderBy: { createdAt: "desc" },
          take: 10,
        });

        // Double check estrito em memória para evitar falsos positivos
        const matchedLead = candidateLeads.find((lead) =>
          matchesPhoneNumber(lead.whatsapp, rawPhone)
        );

        if (matchedLead) {
          await prisma.lead.update({
            where: { id: matchedLead.id },
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
      console.error(`[Sync Leads] Erro ao sincronizar grupo ${group.name}:`, err);
    }
  }

  // 3. Marcar leads PENDING com mais de 24h que continuam sem entrar como NOT_JOINED
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
