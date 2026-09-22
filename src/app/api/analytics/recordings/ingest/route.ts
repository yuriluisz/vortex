import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { uploadReplayPayload } from "@/lib/r2";
import { gzip, gunzip } from "node:zlib";
import { promisify } from "node:util";

const gzipAsync = promisify(gzip);
const gunzipAsync = promisify(gunzip);

export const dynamic = "force-dynamic";

// Rate limiting simples por IP (60 req/min por IP)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 60;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }
  entry.count++;
  return entry.count > RATE_LIMIT_MAX;
}

// Limpar IPs expirados a cada 5 min
if (typeof globalThis !== "undefined") {
  const cleanupInterval = 5 * 60_000;
  setInterval(() => {
    const now = Date.now();
    for (const [ip, entry] of rateLimitMap) {
      if (now > entry.resetAt) rateLimitMap.delete(ip);
    }
  }, cleanupInterval).unref?.();
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    // Rate limit por IP
    const clientIp = req.headers?.get?.("x-forwarded-for")?.split(",")[0]?.trim() || req.headers?.get?.("x-real-ip") || "unknown";
    if (isRateLimited(clientIp)) {
      return NextResponse.json({ error: "Rate limit excedido." }, { status: 429 });
    }

    const body = await req.json().catch(() => null);
    if (!body || !body.campaignId || !body.sessionId) {
      return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
    }

    const SESSION_ID_REGEX = /^[a-zA-Z0-9_-]{1,128}$/;
    const CAMPAIGN_ID_REGEX = /^[a-zA-Z0-9_-]{1,64}$/;
    if (
      typeof body.sessionId !== "string" ||
      !SESSION_ID_REGEX.test(body.sessionId) ||
      typeof body.campaignId !== "string" ||
      !CAMPAIGN_ID_REGEX.test(body.campaignId)
    ) {
      return NextResponse.json({ error: "Identificador de sessão ou campanha inválido." }, { status: 400 });
    }

    const {
      campaignId,
      sessionId,
      duration = 0,
      clicksCount = 0,
      clicks = [],
      device = "mobile",
      browser,
      os,
      pageUrl = "",
      utmSource,
      utmMedium,
      utmCampaign,
      events,
      gzip,
    } = body;

    // Verificar se a campanha existe e tem gravação ativa
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: { tenant: { select: { id: true, plan: true } } },
    });

    if (!campaign || !campaign.active || !campaign.sessionRecordingEnabled) {
      return NextResponse.json({ ok: false, reason: "recording_disabled" }, { status: 200 });
    }

    // Exclusivo para plano ULTRA
    if (campaign.tenant.plan !== "ULTRA") {
      return NextResponse.json({ ok: false, reason: "plan_not_ultra" }, { status: 200 });
    }

    // Preparar buffer gzip
    let gzipBuffer: Buffer | null = null;
    if (gzip && typeof gzip === "string") {
      try {
        const decoded = Buffer.from(gzip, "base64");
        // Validação do cabeçalho mágico do gzip (0x1f 0x8b)
        if (decoded.length >= 2 && decoded[0] === 0x1f && decoded[1] === 0x8b) {
          gzipBuffer = decoded;
        } else {
          gzipBuffer = await gzipAsync(decoded);
        }
      } catch {
        gzipBuffer = null;
      }
    } else if (events && Array.isArray(events) && events.length > 0) {
      const jsonStr = JSON.stringify(events);
      gzipBuffer = await gzipAsync(Buffer.from(jsonStr));
    }

    const MAX_GZIP_SIZE = 5 * 1024 * 1024; // 5MB
    if (gzipBuffer && gzipBuffer.length > MAX_GZIP_SIZE) {
      return NextResponse.json({ error: "Tamanho do payload excede o limite (5MB)." }, { status: 413 });
    }

    // Proteção contra gzip bomb: checar expansão de no máximo 20MB
    if (gzipBuffer && gzipBuffer.length > 0) {
      try {
        await gunzipAsync(gzipBuffer, { maxOutputLength: 20 * 1024 * 1024 });
      } catch {
        return NextResponse.json({ error: "Payload comprimido inválido ou expansão excede o limite seguro." }, { status: 400 });
      }
    }

    const r2Key = `replays/${campaignId}/${sessionId}.json.gz`;

    // Buscar gravação existente para garantir monotonicidade de duration e clicks
    const existing = await prisma.sessionRecording.findUnique({
      where: { sessionId },
      select: { duration: true, clicksCount: true },
    });

    const parsedDuration = Math.round(Number(duration) || 0);
    const finalDuration = Math.max(existing?.duration || 0, parsedDuration);
    const parsedClicksCount = Number(clicksCount) || 0;
    const finalClicksCount = Math.max(existing?.clicksCount || 0, parsedClicksCount);

    // Guarda de integridade: só atualiza o arquivo no R2 se o pacote atual tiver duração >= à já gravada
    if (gzipBuffer && gzipBuffer.length > 0 && (!existing || parsedDuration >= (existing.duration || 0))) {
      try {
        await uploadReplayPayload(r2Key, gzipBuffer, "application/gzip");
      } catch (uploadErr) {
        console.error(`[Ingest] Falha no upload para R2 (${r2Key}):`, uploadErr);
      }
    }

    // Upsert nos metadados da sessão com monotonicidade
    await prisma.sessionRecording.upsert({
      where: { sessionId },
      create: {
        sessionId,
        campaignId,
        tenantId: campaign.tenant.id,
        duration: finalDuration,
        clicksCount: finalClicksCount,
        device: String(device || "mobile"),
        browser: browser ? String(browser) : null,
        os: os ? String(os) : null,
        pageUrl: String(pageUrl).slice(0, 500),
        utmSource: utmSource ? String(utmSource).slice(0, 100) : null,
        utmMedium: utmMedium ? String(utmMedium).slice(0, 100) : null,
        utmCampaign: utmCampaign ? String(utmCampaign).slice(0, 100) : null,
        r2Key,
      },
      update: {
        duration: finalDuration,
        clicksCount: finalClicksCount,
        pageUrl: String(pageUrl).slice(0, 500),
      },
    });

    // Inserir pontos de clique para o mapa de calor
    if (Array.isArray(clicks) && clicks.length > 0) {
      const heatmapRecords = clicks.slice(0, 100).map((c: { x: number; y: number }) => ({
        campaignId,
        x: Math.max(0, Math.min(100, Number(c.x) || 0)),
        y: Math.max(0, Math.min(100, Number(c.y) || 0)),
        device: String(device || "mobile"),
      }));

      await prisma.heatmapClick.createMany({
        data: heatmapRecords,
      });
    }

    return NextResponse.json(
      { ok: true, sessionId },
      {
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch (error) {
    console.error("Erro na ingestão de gravação:", error);
    return NextResponse.json({ error: "Erro interno no servidor." }, { status: 500 });
  }
}
