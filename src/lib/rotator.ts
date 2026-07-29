import "server-only";

import { redis } from "@/lib/redis";
import { prisma } from "@/lib/prisma";

const GROUPS_CACHE_PREFIX = "campaign:groups_list:";
const GROUP_COUNT_PREFIX = "group:count:";
const CACHE_TTL_SECONDS = 60; // 1 minuto de cache para a lista de grupos

// Script Lua para incrementar de forma atômica se não estiver cheio.
// KEYS[1] = chave do contador do grupo
// ARGV[1] = capacidade máxima
// ARGV[2] = contagem inicial (caso a chave não exista no Redis, inicia com valor do banco)
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
    -- Opcional: setar um TTL na chave do contador para não ficar pra sempre (ex: 30 dias)
    redis.call('EXPIRE', key, 2592000)
    return 1 -- Sucesso
  else
    return 0 -- Cheio
  end
`;

// Define o comando no Redis na primeira vez
redis.defineCommand("incrementIfNotFull", {
  numberOfKeys: 1,
  lua: INCREMENT_IF_NOT_FULL_SCRIPT,
});

// Tipagem estendida para o ioredis reconhecer o comando customizado
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
}

/**
 * Obtém o grupo ativo para uma campanha de forma atômica (100% à prova de concorrência).
 * 1. Busca a lista de grupos (do Redis ou do Postgres).
 * 2. Tenta incrementar a vaga do grupo usando script Lua atômico.
 * 3. Se conseguir, retorna a URL. Se não, passa pro próximo da lista.
 */
export async function getActiveGroupForCampaign(
  campaignId: string
): Promise<{ url: string } | null> {
  const listCacheKey = `${GROUPS_CACHE_PREFIX}${campaignId}`;

  // Passo 1: Obter a lista de grupos ordenados
  let groups: RotatorGroup[] = [];
  const cachedList = await redis.get(listCacheKey);

  if (cachedList) {
    groups = JSON.parse(cachedList);
  } else {
    // Buscar no banco se não estiver em cache
    const dbGroups = await prisma.group.findMany({
      where: {
        campaignId,
        active: true,
      },
      orderBy: { createdAt: "asc" },
      select: { id: true, url: true, currentCount: true, maxCapacity: true },
    });

    groups = dbGroups;

    // Fazer cache da lista por 1 minuto
    if (groups.length > 0) {
      await redis.set(listCacheKey, JSON.stringify(groups), "EX", CACHE_TTL_SECONDS);
    }
  }

  if (groups.length === 0) {
    return null;
  }

  // Passo 2: Iterar sobre os grupos e tentar reservar uma vaga atomicamente
  for (const group of groups) {
    const groupCountKey = `${GROUP_COUNT_PREFIX}${group.id}`;

    // Executa o script Lua atômico
    const result = await redis.incrementIfNotFull(
      groupCountKey,
      group.maxCapacity,
      group.currentCount
    );

    if (result === 1) {
      // Conseguimos uma vaga neste grupo!
      
      // Obs: O incremento no banco de dados (Prisma) não é feito aqui de forma síncrona
      // para evitar gargalos em picos. A inserção do lead em background (BullMQ)
      // ficará responsável por sincronizar essa contagem final no banco de dados depois.
      // Caso não haja BullMQ ainda, faremos um incremento fire-and-forget para manter o BD minimamente atualizado:
      incrementGroupCountFireAndForget(group.id);

      return { url: group.url };
    }
    // Se result === 0, o grupo está cheio, continua o loop para tentar o próximo grupo.
  }

  // Se todos os grupos estiverem cheios, retorna nulo (ou poderia retornar o último como fallback)
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
