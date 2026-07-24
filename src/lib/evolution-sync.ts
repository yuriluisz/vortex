import "server-only";

import { prisma } from "@/lib/prisma";
import {
  fetchGroupParticipants,
  fetchGroupByInviteCode,
  extractInviteCode,
} from "@/lib/evolution";

// ============================================================================
// EVOLUTION SYNC — Sincronização de participantes e grupos
// ============================================================================

/**
 * Sincroniza o currentCount de um grupo com os participantes reais via Evolution API.
 */
export async function syncGroupParticipants(
  groupId: string,
  instanceName: string
): Promise<{ success: boolean; count?: number; error?: string }> {
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    select: { groupJid: true, url: true },
  });

  if (!group) {
    return { success: false, error: "Grupo não encontrado" };
  }

  let jid = group.groupJid;

  // Se não tem JID, tentar resolver pelo invite code da URL
  if (!jid && group.url) {
    const inviteCode = extractInviteCode(group.url);
    if (inviteCode) {
      const groupInfo = await fetchGroupByInviteCode(
        instanceName,
        inviteCode
      );
      if (groupInfo) {
        jid = groupInfo.id;
        // Salvar JID e inviteCode no banco
        await prisma.group.update({
          where: { id: groupId },
          data: { groupJid: jid, inviteCode },
        });
      }
    }
  }

  if (!jid) {
    return {
      success: false,
      error: "Não foi possível resolver o JID do grupo",
    };
  }

  try {
    const participants = await fetchGroupParticipants(instanceName, jid);
    const realCount = participants.length;

    await prisma.group.update({
      where: { id: groupId },
      data: { currentCount: realCount },
    });

    return { success: true, count: realCount };
  } catch (error) {
    console.error(`[Sync] Error syncing group ${groupId}:`, error);
    return { success: false, error: "Falha ao sincronizar participantes" };
  }
}

/**
 * Sincroniza todos os grupos de um tenant.
 */
export async function syncAllGroups(
  tenantId: string
): Promise<{ synced: number; errors: number }> {
  const instance = await prisma.evolutionInstance.findUnique({
    where: { tenantId },
    select: { instanceName: true, status: true },
  });

  if (!instance || instance.status !== "CONNECTED") {
    return { synced: 0, errors: 0 };
  }

  const groups = await prisma.group.findMany({
    where: { tenantId, active: true },
    select: { id: true },
  });

  let synced = 0;
  let errors = 0;

  for (const group of groups) {
    const result = await syncGroupParticipants(
      group.id,
      instance.instanceName
    );
    if (result.success) {
      synced++;
    } else {
      errors++;
    }
  }

  return { synced, errors };
}

/**
 * Resolve JIDs de todos os grupos de um tenant que não têm JID.
 * Extrai o invite code da URL e busca na Evolution API.
 */
export async function resolveGroupJids(
  tenantId: string
): Promise<{ resolved: number; errors: number }> {
  const instance = await prisma.evolutionInstance.findUnique({
    where: { tenantId },
    select: { instanceName: true, status: true },
  });

  if (!instance || instance.status !== "CONNECTED") {
    return { resolved: 0, errors: 0 };
  }

  const groups = await prisma.group.findMany({
    where: { tenantId, groupJid: null, active: true },
    select: { id: true, url: true },
  });

  let resolved = 0;
  let errors = 0;

  for (const group of groups) {
    const inviteCode = extractInviteCode(group.url);
    if (!inviteCode) {
      errors++;
      continue;
    }

    try {
      const info = await fetchGroupByInviteCode(
        instance.instanceName,
        inviteCode
      );
      if (info) {
        await prisma.group.update({
          where: { id: group.id },
          data: { groupJid: info.id, inviteCode },
        });
        resolved++;
      } else {
        errors++;
      }
    } catch {
      errors++;
    }
  }

  return { resolved, errors };
}

/**
 * Marca leads PENDING antigos (mais de 24h) como NOT_JOINED.
 */
export async function resolveStaleLeads(
  tenantId: string
): Promise<number> {
  const twentyFourHoursAgo = new Date(
    Date.now() - 24 * 60 * 60 * 1000
  );

  const result = await prisma.lead.updateMany({
    where: {
      tenantId,
      status: "PENDING",
      createdAt: { lt: twentyFourHoursAgo },
    },
    data: { status: "NOT_JOINED" },
  });

  return result.count;
}
