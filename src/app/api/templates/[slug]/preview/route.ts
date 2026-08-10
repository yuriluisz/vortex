import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sanitizeForPreview } from "@/lib/template-sanitizer";

/**
 * GET /api/templates/[slug]/preview
 *
 * Retorna o HTML sanitizado do template para preview em iframe.
 * Usa sanitizeForPreview (mais leve) porque o iframe já tem sandbox.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  try {
    const template = await prisma.template.findUnique({
      where: { slug },
      include: {
        versions: {
          where: { status: "PUBLISHED" },
          orderBy: { version: "desc" },
          take: 1,
        },
      },
    });

    if (!template) {
      return new NextResponse("Template não encontrado", { status: 404 });
    }

    const activeVersion = template.versions[0];
    if (!activeVersion) {
      return new NextResponse("Template sem versão publicada", { status: 404 });
    }

    // Sanitizar para preview (mantém scripts, mas remove handlers perigosos)
    const previewHtml = sanitizeForPreview(activeVersion.rawHtml);

    // Montar HTML completo com CSS reset e viewport
    const fullHtml = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <base href="/">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; height: 100%; overflow-x: hidden; }
    
    /* Desabilitar todos os links e botões — apenas visuais */
    a, button, [role="button"], input, select, textarea, [onclick] {
      pointer-events: none !important;
      cursor: default !important;
    }
  </style>
</head>
<body>
${previewHtml}
</body>
</html>`;

    return new NextResponse(fullHtml, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "X-Content-Type-Options": "nosniff",
        "Content-Security-Policy": "default-src 'self' 'unsafe-inline' 'unsafe-eval' https:; img-src 'self' data: https:; style-src 'self' 'unsafe-inline' https:; font-src 'self' https:; frame-src 'self' https://www.youtube.com https://player.vimeo.com;",
      },
    });
  } catch (error) {
    console.error("Preview error:", error);
    return new NextResponse("Erro ao carregar preview", { status: 500 });
  }
}