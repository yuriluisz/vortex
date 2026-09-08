import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

interface RouteProps {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteProps) {
  try {
    const session = await getSession();
    if (!session?.tenantId) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }

    const { id: campaignId } = await params;
    const { searchParams } = new URL(req.url);
    const device = searchParams.get("device") || "all";

    // Verificar posse da campanha pelo tenant
    const campaign = await prisma.campaign.findFirst({
      where: { id: campaignId, tenantId: session.tenantId },
      select: { id: true, name: true, slug: true },
    });

    if (!campaign) {
      return NextResponse.json({ error: "Campanha não encontrada." }, { status: 404 });
    }

    // Filtrar cliques dos últimos 7 dias (retenção)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const whereClause: {
      campaignId: string;
      createdAt: { gte: Date };
      device?: string;
    } = {
      campaignId,
      createdAt: { gte: sevenDaysAgo },
    };

    if (device === "mobile" || device === "desktop") {
      whereClause.device = device;
    }

    const clicks = await prisma.heatmapClick.findMany({
      where: whereClause,
      select: {
        x: true,
        y: true,
        device: true,
      },
      orderBy: { createdAt: "desc" },
      take: 2500, // Limite seguro para visualização no canvas
    });

    return NextResponse.json({
      campaign: {
        id: campaign.id,
        name: campaign.name,
        slug: campaign.slug,
      },
      totalClicks: clicks.length,
      clicks,
    });
  } catch (error) {
    console.error("Erro ao buscar heatmap:", error);
    return NextResponse.json({ error: "Erro interno no servidor." }, { status: 500 });
  }
}
