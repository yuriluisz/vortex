import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";
import { sendReportEmail } from "@/lib/notifications";
import { rateLimit } from "@/lib/rate-limit";

const ReportSchema = z.object({
  reporterEmail: z.string().email("Email inválido."),
  message: z.string().min(10, "A mensagem deve ter pelo menos 10 caracteres."),
  campaignSlug: z.string().min(1, "Slug da campanha é obrigatório."),
  campaignName: z.string().optional(),
  tenantSlug: z.string().optional(),
  contentType: z.enum(["campaign", "template"]).optional().default("campaign"),
});

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
    const parsed = ReportSchema.safeParse(body);

    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message || "Dados inválidos.";
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const { reporterEmail, message, campaignSlug, campaignName, tenantSlug, contentType } = parsed.data;

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