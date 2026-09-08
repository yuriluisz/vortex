import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { getReplayPayload } from "@/lib/r2";
import { gunzipSync } from "node:zlib";

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

    const { id: sessionId } = await params;

    const recording = await prisma.sessionRecording.findUnique({
      where: { sessionId },
      include: {
        campaign: {
          select: { id: true, name: true, slug: true },
        },
      },
    });

    if (!recording || recording.tenantId !== session.tenantId) {
      return NextResponse.json({ error: "Gravação não encontrada." }, { status: 404 });
    }

    // Buscar buffer gzip do Cloudflare R2
    const gzipBuffer = await getReplayPayload(recording.r2Key);
    if (!gzipBuffer) {
      return NextResponse.json({ error: "Arquivo de gravação não encontrado no storage." }, { status: 404 });
    }

    // Limitar tamanho do buffer gzip para evitar zip bombs (max 5MB comprimido)
    const MAX_GZIP_SIZE = 5 * 1024 * 1024;
    if (gzipBuffer.length > MAX_GZIP_SIZE) {
      return NextResponse.json({ error: "Gravação excede o limite de tamanho." }, { status: 413 });
    }

    let events: unknown[] = [];
    try {
      const decompressed = gunzipSync(gzipBuffer, { maxOutputLength: 20 * 1024 * 1024 }).toString("utf-8");
      events = JSON.parse(decompressed);
    } catch {
      // Se não for gzip (fallback), tentar parse direto
      try {
        events = JSON.parse(gzipBuffer.toString("utf-8"));
      } catch (err) {
        console.error("Erro ao decodificar eventos da sessão:", err);
      }
    }

    return NextResponse.json({
      recording: {
        id: recording.id,
        sessionId: recording.sessionId,
        campaignId: recording.campaignId,
        campaignName: recording.campaign.name,
        duration: recording.duration,
        clicksCount: recording.clicksCount,
        device: recording.device,
        browser: recording.browser,
        os: recording.os,
        pageUrl: recording.pageUrl,
        utmSource: recording.utmSource,
        utmMedium: recording.utmMedium,
        utmCampaign: recording.utmCampaign,
        createdAt: recording.createdAt,
      },
      events,
    });
  } catch (error) {
    console.error("Erro ao buscar gravação:", error);
    return NextResponse.json({ error: "Erro interno no servidor." }, { status: 500 });
  }
}
