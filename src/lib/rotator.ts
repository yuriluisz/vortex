import "server-only";

import { redis } from "@/lib/redis";
import { prisma } from "@/lib/prisma";

const GROUPS_CACHE_PREFIX = "campaign:groups_list:";
const GROUP_COUNT_PREFIX = "group:count:";
const CACHE_TTL_SECONDS = 60; // 1 minuto de cache para a lista de grupos

// Script Lua para incrementar de forma atômica se não estiver cheio.
// KEYS[1] = chave do contador do grupo
// ARGV[1] = capacidade máxima
// ARGV[2] = contagem inicial
const INCREMENT_IF_NOT_FULL_SCRIPT = `
  local key = KEYS[1]
  local max_capacity = tonumber(ARGV[1])
  local initial_count = tonumber(ARGV[2])

  local current = redis.call('GET', key)
  if not current then
    redis.call('SET', key, initial_count)
    current = initial_count
  else
    current = tonumber(current)
  end

  if current < max_capacity then
    redis.call('INCR', key)
    redis.call('EXPIRE', key, 2592000)
    return current + 1 -- Sucesso, retorna a nova contagem
  else
    return -1 -- Cheio
  end
`;

redis.defineCommand("incrementIfNotFull", {
  numberOfKeys: 1,
  lua: INCREMENT_IF_NOT_FULL_SCRIPT,
});

declare module "ioredis" {
  interface Redis {
    incrementIfNotFull(
      key: string,
      maxCapacity: number | string,
      initialCount: number | string
    ): Promise<number>;
  }
}

interface RotatorGroup {
  id: string;
  url: string;
  currentCount: number;
  maxCapacity: number;
  tenantId: string;
  name: string;
}

export async function getActiveGroupForCampaign(
  campaignId: string
): Promise<{ url: string } | null> {
  const listCacheKey = `${GROUPS_CACHE_PREFIX}${campaignId}`;

  let groups: RotatorGroup[] = [];
  const cachedList = await redis.get(listCacheKey);

  if (cachedList) {
    groups = JSON.parse(cachedList);
  } else {
    const dbGroups = await prisma.group.findMany({
      where: {
        campaignId,
        active: true,
      },
      orderBy: { createdAt: "asc" },
      select: { id: true, url: true, currentCount: true, maxCapacity: true, tenantId: true, name: true },
    });

    groups = dbGroups;

    if (groups.length > 0) {
      await redis.set(listCacheKey, JSON.stringify(groups), "EX", CACHE_TTL_SECONDS);
    }
  }

  if (groups.length === 0) {
    return null;
  }

  for (const group of groups) {
    const groupCountKey = `${GROUP_COUNT_PREFIX}${group.id}`;

    const result = await redis.incrementIfNotFull(
      groupCountKey,
      group.maxCapacity,
      group.currentCount
    );

    if (result !== -1) {
      // Import dinâmico da fila para evitar warnings de dependência circular no boot
      const { groupsQueue } = await import("@/lib/queue");
      
      // Disparo Eager: Se atingir exatamente 80% da capacidade, pede a criação do próximo grupo
      const threshold = Math.floor(group.maxCapacity * 0.8);
      if (result === threshold) {
        console.log(`[Rotator] Grupo ${group.name} atingiu 80% (${result}/${group.maxCapacity}). Solicitando auto-criação...`);
        groupsQueue.add("auto-create", {
          tenantId: group.tenantId,
          campaignId,
          currentGroupName: group.name,
        }).catch(err => console.error("Erro ao enviar job de auto-criação", err));
      }

      incrementGroupCountFireAndForget(group.id);
      return { url: group.url };
    }
  }

  return null;
}

/**
 * Incrementa o currentCount do grupo no banco de dados de forma não bloqueante.
 * Em um cenário de altíssima concorrência, isso ainda gera carga no PG, 
 * mas não trava o redirect do usuário. O ideal definitivo é fazer via BullMQ.
 */
function incrementGroupCountFireAndForget(groupId: string) {
  prisma.group.update({
    where: { id: groupId },
    data: { currentCount: { increment: 1 } },
  }).catch((err) => {
    console.error(`[Rotator] Erro ao sincronizar contagem do grupo ${groupId} no BD:`, err);
  });
}
