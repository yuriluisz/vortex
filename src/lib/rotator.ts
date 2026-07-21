import "server-only";

import { redis } from "@/lib/redis";
import { prisma } from "@/lib/prisma";

const ACTIVE_GROUP_KEY_PREFIX = "campaign:active_group:";
const CACHE_TTL_SECONDS = 60; // 1 minuto de cache

interface ActiveGroup {
  id: string;
  url: string;
  currentCount: number;
  maxCapacity: number;
}

/**
 * Obtém o grupo ativo para uma campanha.
 * Lógica de alta velocidade com cache Redis:
 * 1. Checa cache Redis para grupo ativo
 * 2. Se cache miss ou grupo cheio, consulta Postgres
 * 3. Atualiza cache e incrementa contagem atomicamente
 */
export async function getActiveGroupForCampaign(
  campaignId: string
): Promise<{ url: string } | null> {
  const cacheKey = `${ACTIVE_GROUP_KEY_PREFIX}${campaignId}`;

  // Passo 1: Checar cache Redis
  const cached = await redis.get(cacheKey);

  if (cached) {
    const group: ActiveGroup = JSON.parse(cached);

    // Verificar se ainda tem vagas
    if (group.currentCount < group.maxCapacity) {
      // Incrementar contagem atomicamente no banco
      await incrementGroupCount(group.id);

      // Atualizar contagem no cache
      group.currentCount += 1;
      await redis.set(cacheKey, JSON.stringify(group), "EX", CACHE_TTL_SECONDS);

      return { url: group.url };
    }

    // Grupo cheio — invalidar cache e buscar próximo
    await redis.del(cacheKey);
  }

  // Passo 2: Consultar Postgres para próximo grupo com vagas
  // Buscar todos os grupos ativos e filtrar no app-level
  // (Prisma não suporta comparação campo-a-campo em where clause)
  const groups = await prisma.group.findMany({
    where: {
      campaignId,
      active: true,
    },
    orderBy: { createdAt: "asc" },
  });

  const nextGroup = groups.find((g) => g.currentCount < g.maxCapacity);

  if (!nextGroup) {
    // Nenhum grupo disponível
    return null;
  }

  // Incrementar contagem atomicamente
  await incrementGroupCount(nextGroup.id);

  // Passo 3: Atualizar cache Redis
  const activeGroup: ActiveGroup = {
    id: nextGroup.id,
    url: nextGroup.url,
    currentCount: nextGroup.currentCount + 1,
    maxCapacity: nextGroup.maxCapacity,
  };
  await redis.set(cacheKey, JSON.stringify(activeGroup), "EX", CACHE_TTL_SECONDS);

  return { url: nextGroup.url };
}

/**
 * Incrementa o currentCount de um grupo atomicamente no banco.
 */
async function incrementGroupCount(groupId: string): Promise<void> {
  await prisma.group.update({
    where: { id: groupId },
    data: { currentCount: { increment: 1 } },
  });
}
