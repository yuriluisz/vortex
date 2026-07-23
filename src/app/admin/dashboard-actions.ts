"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export interface DayPoint {
  date: string;
  count: number;
}

/**
 * Retorna a série temporal de leads por dia para o tenant autenticado.
 * @param days  7 ou 30
 * @param campaignId  opcional — filtra por campanha específica
 */
export async function getLeadsTimeSeries(
  days: 7 | 30,
  campaignId?: string
): Promise<DayPoint[]> {
  const session = await getSession();
  if (!session?.tenantId) throw new Error("Não autorizado.");

  const since = new Date();
  since.setDate(since.getDate() - days);
  since.setHours(0, 0, 0, 0);

  // Monta o where dinâmico
  const where: Record<string, unknown> = {
    tenantId: session.tenantId,
    createdAt: { gte: since },
  };
  if (campaignId) {
    where.campaignId = campaignId;
  }

  const rows = await prisma.lead.findMany({
    where: where as never,
    select: { createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  // Agrupa por data (YYYY-MM-DD)
  const map = new Map<string, number>();
  for (const row of rows) {
    const key = row.createdAt.toISOString().slice(0, 10);
    map.set(key, (map.get(key) || 0) + 1);
  }

  // Preenche todos os dias do intervalo
  const result: DayPoint[] = [];
  const cursor = new Date(since);
  const today = new Date();
  while (cursor <= today) {
    const key = cursor.toISOString().slice(0, 10);
    result.push({ date: key, count: map.get(key) || 0 });
    cursor.setDate(cursor.getDate() + 1);
  }

  return result;
}

/**
 * Retorna lista de campanhas ativas do tenant para o filtro.
 */
export async function getCampaignsForFilter(): Promise<
  { id: string; name: string }[]
> {
  const session = await getSession();
  if (!session?.tenantId) throw new Error("Não autorizado.");

  return prisma.campaign.findMany({
    where: { active: true, tenantId: session.tenantId },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
}