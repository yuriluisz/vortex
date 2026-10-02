import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";

const SLUG_REGEX = /^[a-z0-9-]{1,100}$/;

/**
 * GET /api/templates/[slug]
 *
 * Retorna os detalhes do template publicado e o rawHtml de sua versão ativa.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  // Rate limit por IP
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const rl = await rateLimit(`template:detail:${ip}`, {
    windowSeconds: 60,
    maxRequests: 120,
  });
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Muitas requisições. Tente novamente em instantes." },
      { status: 429, headers: { "Retry-After": String(rl.resetIn) } }
    );
  }

  if (!SLUG_REGEX.test(slug)) {
    return NextResponse.json({ error: "Template não encontrado." }, { status: 404 });
  }

  try {
    const template = await prisma.template.findUnique({
      where: { slug, status: "PUBLISHED" },
      include: {
        versions: {
          where: { status: "PUBLISHED" },
          orderBy: { version: "desc" },
          take: 1,
        },
      },
    });

    if (!template || !template.versions[0]) {
      return NextResponse.json({ error: "Template não encontrado." }, { status: 404 });
    }

    const activeVersion = template.versions[0];

    return NextResponse.json({
      template: {
        id: template.id,
        slug: template.slug,
        name: template.name,
        description: template.description,
        category: template.category,
        theme: template.theme,
        primaryColor: template.primaryColor,
        typography: template.typography,
        rawHtml: activeVersion.rawHtml,
        formSchema: activeVersion.formSchema,
      },
    });
  } catch (error) {
    console.error("Get template error:", error);
    return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 });
  }
}
