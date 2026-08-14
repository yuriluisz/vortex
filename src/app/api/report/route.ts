import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { sendReportEmail } from "@/lib/notifications";
import { rateLimit } from "@/lib/rate-limit";

/**
 * POST /api/report
 * Recebe um report de conteúdo de uma campanha e envia email para o suporte.
 */
export async function POST(req: Request) {
  try {
    // Rate limit: 3 reports por hora por IP
    const headersList = await headers();
    const ip =
      headersList.get("cf-connecting-ip") ||
      headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      "unknown";
    const rl = await rateLimit(`report:${ip}`, { windowSeconds: 3600, maxRequests: 3 });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Muitos reports enviados. Tente novamente mais tarde." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { reporterEmail, message, campaignSlug, campaignName, tenantSlug, contentType } = body;

    // Validação básica
    if (!reporterEmail || !message || !campaignSlug) {
      return NextResponse.json(
        { error: "Campos obrigatórios: reporterEmail, message, campaignSlug" },
        { status: 400 }
      );
    }

    if (!reporterEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(reporterEmail)) {
      return NextResponse.json(
        { error: "Email inválido." },
        { status: 400 }
      );
    }

    if (message.length < 10) {
      return NextResponse.json(
        { error: "A mensagem deve ter pelo menos 10 caracteres." },
        { status: 400 }
      );
    }

    const result = await sendReportEmail({
      reporterEmail,
      message,
      campaignSlug,
      campaignName: campaignName || campaignSlug,
      tenantSlug: tenantSlug || "unknown",
      contentType: contentType === "template" ? "template" : "campaign",
    });

    if (!result.success) {
      return NextResponse.json(
        { error: "Erro ao enviar report. Tente novamente." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Report API] Error:", error);
    return NextResponse.json(
      { error: "Erro interno." },
      { status: 500 }
    );
  }
}