import "server-only";
import { redis } from "@/lib/redis";
import { prisma } from "@/lib/prisma";
import type { Plan } from "@/lib/prisma-types";

const CAMPAIGN_CACHE_PREFIX = "cache:campaign:";
const TENANT_LEADS_PREFIX = "cache:tenant:leads:";
const CACHE_TTL_SECONDS = 300; // 5 minutos para campanha
const COUNT_TTL_SECONDS = 60; // 1 minuto para o contador

export interface CachedCampaignData {
  id: string;
  tenantId: string;
  active: boolean;
  plan: Plan;
}

/**
 * Obtém dados da campanha e do plano do tenant com cache via Redis.
 * Evita múltiplas consultas JOIN ao PostgreSQL em picos de tráfego.
 */
export async function getCachedCampaignData(campaignId: string): Promise<CachedCampaignData | null> {
  const key = `${CAMPAIGN_CACHE_PREFIX}${campaignId}`;
  const cached = await redis.get(key);
  
  if (cached) {
    return JSON.parse(cached);
  }
  
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    select: { 
      id: true, 
      tenantId: true, 
      active: true,
      tenant: {
        select: { plan: true }
      }
    },
  });
  
  if (!campaign) return null;
  
  const data: CachedCampaignData = {
    id: campaign.id,
    tenantId: campaign.tenantId,
    active: campaign.active,
    plan: campaign.tenant.plan as Plan,
  };
  
  await redis.set(key, JSON.stringify(data), "EX", CACHE_TTL_SECONDS);
  return data;
}

/**
 * Obtém a contagem de leads de um tenant usando cache.
 * Isso evita a operação cara de COUNT() no PostgreSQL durante picos.
 */
export async function getCachedLeadCount(tenantId: string): Promise<number> {
  const key = `${TENANT_LEADS_PREFIX}${tenantId}`;
  const cached = await redis.get(key);
  
  if (cached) {
    return parseInt(cached, 10);
  }
  
  const count = await prisma.lead.count({
    where: { tenantId },
  });
  
  await redis.set(key, count.toString(), "EX", COUNT_TTL_SECONDS);
  return count;
}

/**
 * Invalida o cache de uma campanha específica (usar ao editar/pausar campanha)
 */
export async function invalidateCampaignCache(campaignId: string) {
  await redis.del(`${CAMPAIGN_CACHE_PREFIX}${campaignId}`);
}
