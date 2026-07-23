import "server-only";
import type { Plan } from "@/lib/prisma-types";

/**
 * Limites e recursos de cada plano.
 * Valores -1 = ilimitado.
 */
export const PLAN_LIMITS: Record<
  Plan,
  {
    maxCampaigns: number;
    maxGroups: number;
    maxLeads: number;
    customDomain: boolean;
    removeBranding: boolean;
    prioritySupport: boolean;
  }
> = {
  FREE: {
    maxCampaigns: 1,
    maxGroups: 3,
    maxLeads: 100,
    customDomain: false,
    removeBranding: false,
    prioritySupport: false,
  },
  PRO: {
    maxCampaigns: 10,
    maxGroups: 50,
    maxLeads: 10_000,
    customDomain: true,
    removeBranding: true,
    prioritySupport: false,
  },
  ULTRA: {
    maxCampaigns: -1, // ilimitado
    maxGroups: -1,
    maxLeads: -1,
    customDomain: true,
    removeBranding: true,
    prioritySupport: true,
  },
};

export type ResourceType = "campaigns" | "groups" | "leads";

/**
 * Retorna o limite numérico de um recurso para um plano.
 */
export function getLimitForPlan(
  plan: Plan,
  resource: ResourceType
): number {
  const limits = PLAN_LIMITS[plan];
  switch (resource) {
    case "campaigns":
      return limits.maxCampaigns;
    case "groups":
      return limits.maxGroups;
    case "leads":
      return limits.maxLeads;
  }
}

/**
 * Verifica se um valor representa "ilimitado" (-1).
 */
export function isUnlimited(value: number): boolean {
  return value === -1;
}

/**
 * Verifica se o tenant pode criar mais recursos de um determinado tipo.
 * Retorna { allowed: true } ou { allowed: false, reason: string }.
 */
export function canCreateResource(
  plan: Plan,
  resource: ResourceType,
  currentCount: number
): { allowed: true } | { allowed: false; reason: string } {
  const limit = getLimitForPlan(plan, resource);

  if (isUnlimited(limit)) {
    return { allowed: true };
  }

  if (currentCount >= limit) {
    const resourceNames: Record<ResourceType, string> = {
      campaigns: "campanhas",
      groups: "grupos",
      leads: "leads",
    };

    return {
      allowed: false,
      reason: `Limite de ${resourceNames[resource]} atingido para o seu plano (${limit}). Faça upgrade para criar mais.`,
    };
  }

  return { allowed: true };
}