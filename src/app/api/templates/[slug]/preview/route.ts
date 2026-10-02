import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sanitizeForPreview } from "@/lib/template-sanitizer";
import { rateLimit } from "@/lib/rate-limit";

const SLUG_REGEX = /^[a-z0-9-]{1,100}$/;

/**
 * GET /api/templates/[slug]/preview
 *
 * Retorna o HTML sanitizado do template para preview em iframe.
 * Usa sanitizeForPreview (mais leve) porque o iframe já tem sandbox.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  // Rate limit por IP (rota pública)
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const rl = await rateLimit(`template:preview:${ip}`, {
    windowSeconds: 60,
    maxRequests: 120,
  });
  if (!rl.allowed) {
    return new NextResponse("Muitas requisições. Tente novamente em instantes.", {
      status: 429,
      headers: { "Retry-After": String(rl.resetIn) },
    });
  }

  // Validação de slug
  if (!SLUG_REGEX.test(slug)) {
    return new NextResponse("Template não encontrado", { status: 404 });
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

    if (!template) {
      return new NextResponse("Template não encontrado", { status: 404 });
    }

    const activeVersion = template.versions[0];
    if (!activeVersion) {
      return new NextResponse("Template sem versão publicada", { status: 404 });
    }

    // Sanitizar para preview (mantém scripts, mas remove handlers perigosos)
    let previewHtml = sanitizeForPreview(activeVersion.rawHtml);

    // Cores do template para o form dinâmico
    const primaryColor = template.primaryColor || "#6d28d9";
    const isDarkTheme = template.theme === "DARK";
    const textColor = isDarkTheme ? "#f8fafc" : "#1a1a1a";
    const inputBg = isDarkTheme ? "rgba(255,255,255,0.08)" : "#f8fafc";
    const inputBorder = isDarkTheme ? "rgba(255,255,255,0.15)" : "#e2e8f0";
    const cardBg = isDarkTheme ? "rgba(255,255,255,0.05)" : "#ffffff";
    const cardBorder = isDarkTheme ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)";
    const labelColor = isDarkTheme ? "#e2e8f0" : "#1a1a1a";
    const placeholderColor = isDarkTheme ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.35)";

    // Substituir {{FORM_SLOT}} por um formulário que herda o estilo do template
    const staticForm = `
<div style="max-width:400px;margin:0 auto;padding:24px;background:${cardBg};border:1px solid ${cardBorder};border-radius:12px;box-shadow:0 4px 20px rgba(0,0,0,0.08);font-family:${template.typography || "inherit"};">
  <div style="margin-bottom:16px;">
    <label style="display:block;font-size:14px;font-weight:600;color:${labelColor};margin-bottom:6px;">Nome</label>
    <input type="text" placeholder="Seu nome" style="width:100%;padding:12px 14px;border:1px solid ${inputBorder};border-radius:8px;font-size:14px;color:${textColor};background:${inputBg};outline:none;::placeholder{color:${placeholderColor}}" />
  </div>
  <div style="margin-bottom:16px;">
    <label style="display:block;font-size:14px;font-weight:600;color:${labelColor};margin-bottom:6px;">WhatsApp</label>
    <input type="tel" placeholder="(11) 99999-9999" style="width:100%;padding:12px 14px;border:1px solid ${inputBorder};border-radius:8px;font-size:14px;color:${textColor};background:${inputBg};outline:none;" />
  </div>
  <button type="button" style="width:100%;padding:14px;background:${primaryColor};color:#fff;border:none;border-radius:8px;font-size:15px;font-weight:700;cursor:pointer;">Enviar</button>
</div>`;

    previewHtml = previewHtml.replaceAll("{{FORM_SLOT}}", staticForm);

    // Extrair assets do <head> do template original (Tailwind CDN, config, fontes do Google e estilos)
    const headMatch = activeVersion.rawHtml.match(/<head[^>]*>([\s\S]*?)<\/head>/i);
    let headAssets = "";
    if (headMatch) {
      const rawHead = headMatch[1];
      const tailwindScriptMatch = rawHead.match(/<script[^>]*src=["']https:\/\/cdn\.tailwindcss\.com["'][^>]*>[\s\S]*?<\/script>|<script[^>]*src=["']https:\/\/cdn\.tailwindcss\.com["'][^>]*\/>/i);
      const tailwindConfigMatch = rawHead.match(/<script[^>]*>[\s\S]*?tailwind\.config[\s\S]*?<\/script>/i);
      const fontLinks = rawHead.match(/<link[^>]*href=["']https:\/\/fonts\.(?:googleapis|gstatic)\.com[^"']*["'][^>]*>/gi) || [];
      const styles = rawHead.match(/<style[^>]*>[\s\S]*?<\/style>/gi) || [];
      
      headAssets = [
        tailwindScriptMatch ? tailwindScriptMatch[0] : '<script src="https://cdn.tailwindcss.com"></script>',
        tailwindConfigMatch ? tailwindConfigMatch[0] : '',
        ...fontLinks,
        ...styles,
      ].filter(Boolean).join("\n");
    } else {
      headAssets = '<script src="https://cdn.tailwindcss.com"></script>';
    }

    // Extrair classes e estilos do <body ...> do template original
    const bodyClassMatch = activeVersion.rawHtml.match(/<body[^>]*\bclass=["']([^"']*)["']/i);
    const bodyStyleMatch = activeVersion.rawHtml.match(/<body[^>]*\bstyle=["']([^"']*)["']/i);
    const bodyClass = bodyClassMatch ? bodyClassMatch[1] : "";
    const bodyStyle = bodyStyleMatch ? bodyStyleMatch[1] : "";

    // Montar HTML completo com CSS reset, background e viewport
    const fullHtml = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <base href="/">
  ${headAssets}
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body {
      width: 100%;
      min-height: 100%;
      overflow-x: hidden;
      background-color: ${isDarkTheme ? "#0B0F17" : "#ffffff"};
      color: ${textColor};
    }
    
    /* Desabilitar todos os links e botões — apenas visuais */
    a, button, [role="button"], input, select, textarea, [onclick] {
      pointer-events: none !important;
      cursor: default !important;
    }
  </style>
</head>
<body class="${bodyClass}" style="${bodyStyle}">
${previewHtml}
</body>
</html>`;

    return new NextResponse(fullHtml, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "X-Content-Type-Options": "nosniff",
        "Content-Security-Policy": "default-src 'self'; script-src 'unsafe-inline' 'unsafe-eval' https://cdn.tailwindcss.com; img-src 'self' data: https:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' data: https://fonts.gstatic.com; frame-src https://www.youtube.com https://player.vimeo.com;",
      },
    });
  } catch (error) {
    console.error("Preview error:", error);
    return new NextResponse("Erro ao carregar preview", { status: 500 });
  }
}