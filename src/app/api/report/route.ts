import { NextResponse } from "next/server";
import { sendReportEmail } from "@/lib/notifications";

/**
 * POST /api/report
 * Recebe um report de conteúdo de uma campanha e envia email para o suporte.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { reporterEmail, message, campaignSlug, campaignName, tenantSlug } = body;

    // Validação básica
    if (!reporterEmail || !message || !campaignSlug) {
      return NextResponse.json(
        { error: "Campos obrigatórios: reporterEmail, message, campaignSlug" },
        { status: 400 }
      );
    }

    if (!reporterEmail.includes("@")) {
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