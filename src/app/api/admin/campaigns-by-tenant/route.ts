import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import type { NextRequest } from "next/server";

/**
 * GET /api/admin/campaigns-by-tenant?tenantId=xxx
 * Retorna as campanhas de um tenant específico (apenas SUPER_ADMIN).
 */
export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session?.email || session.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const tenantId = searchParams.get("tenantId");

  if (!tenantId) {
    return NextResponse.json({ error: "tenantId é obrigatório." }, { status: 400 });
  }

  const campaigns = await prisma.campaign.findMany({
    where: { tenantId },
    select: {
      id: true,
      name: true,
      slug: true,
      active: true,
      views: true,
      _count: { select: { leads: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    campaigns: campaigns.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      active: c.active,
      views: c.views,
      leads: c._count.leads,
    })),
  });
}