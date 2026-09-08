import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

interface RouteProps {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: NextRequest, { params }: RouteProps) {
  try {
    const session = await getSession();
    if (!session?.tenantId) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }

    const { id: campaignId } = await params;
    const body = await req.json().catch(() => ({}));
    const enabled = Boolean(body.enabled);

    // Verificar se o tenant é ULTRA
    const tenant = await prisma.tenant.findUnique({
      where: { id: session.tenantId },
      select: { plan: true },
    });

    if (!tenant || tenant.plan !== "ULTRA") {
      return NextResponse.json(
        { error: "Recurso exclusivo para assinantes do plano ULTRA." },
        { status: 403 }
      );
    }

    // Verificar posse da campanha
    const campaign = await prisma.campaign.findFirst({
      where: { id: campaignId, tenantId: session.tenantId },
    });

    if (!campaign) {
      return NextResponse.json({ error: "Campanha não encontrada." }, { status: 404 });
    }

    const updated = await prisma.campaign.update({
      where: { id: campaignId },
      data: { sessionRecordingEnabled: enabled },
      select: { id: true, sessionRecordingEnabled: true },
    });

    return NextResponse.json({ ok: true, sessionRecordingEnabled: updated.sessionRecordingEnabled });
  } catch (error) {
    console.error("Erro ao alterar gravação da campanha:", error);
    return NextResponse.json({ error: "Erro interno no servidor." }, { status: 500 });
  }
}
