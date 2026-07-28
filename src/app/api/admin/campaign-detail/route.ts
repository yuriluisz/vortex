import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import type { NextRequest } from "next/server";

/**
 * GET /api/admin/campaign-detail?campaignId=xxx
 * Retorna os dados completos de uma campanha (apenas SUPER_ADMIN).
 */
export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session?.email || session.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const campaignId = searchParams.get("campaignId");

  if (!campaignId) {
    return NextResponse.json({ error: "campaignId é obrigatório." }, { status: 400 });
  }

  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    select: {
      id: true,
      name: true,
      slug: true,
      pixelId: true,
      rawHtml: true,
      formSchema: true,
    },
  });

  if (!campaign) {
    return NextResponse.json({ error: "Campanha não encontrada." }, { status: 404 });
  }

  return NextResponse.json({ campaign });
}