import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sanitizeForPreview } from "@/lib/template-sanitizer";
import { cookies } from "next/headers";
import { decrypt } from "@/lib/session";
import { rateLimit } from "@/lib/rate-limit";

const COOKIE_NAME = "vortex_admin_session";
const SLUG_REGEX = /^[a-z0-9-]{1,100}$/;

/**
 * GET /api/templates/[slug]/admin-preview
 *
 * Preview administrativo para SUPER_ADMIN revisar templates PENDING_REVIEW.
 * Retorna HTML sanitizado + código-fonte da versão pendente.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  // Validação de slug
  if (!SLUG_REGEX.test(slug)) {
    return NextResponse.json({ error: "Template não encontrado" }, { status: 404 });
  }

  // Verificar sessão de super admin
  const cookieStore = await cookies();
  const cookie = cookieStore.get(COOKIE_NAME)?.value;
  const session = await decrypt(cookie);

  if (!session?.email || session.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  // Rate limit por admin
  const rl = await rateLimit(`template:admin-preview:${session.email}`, {
    windowSeconds: 60,
    maxRequests: 60,
  });
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Muitas requisições. Tente novamente em instantes." },
      { status: 429, headers: { "Retry-After": String(rl.resetIn) } }
    );
  }

  try {
    const template = await prisma.template.findUnique({
      where: { slug },
      include: {
        versions: {
          orderBy: { version: "desc" },
          take: 1,
        },
        author: {
          select: { email: true, displayName: true, handle: true },
        },
      },
    });

    if (!template) {
      return NextResponse.json({ error: "Template não encontrado" }, { status: 404 });
    }

    const pendingVersion = template.versions[0];
    if (!pendingVersion) {
      return NextResponse.json({ error: "Template sem versão disponível" }, { status: 404 });
    }

    // Sanitizar para preview
    let previewHtml = sanitizeForPreview(pendingVersion.rawHtml);

    // Cores do template para o form dinâmico
    const primaryColor = template.primaryColor || "#6d28d9";
    const isDarkTheme = template.theme === "DARK";
    const textColor = isDarkTheme ? "#f8fafc" : "#1a1a1a";
    const inputBg = isDarkTheme ? "rgba(255,255,255,0.08)" : "#f8fafc";
    const inputBorder = isDarkTheme ? "rgba(255,255,255,0.15)" : "#e2e8f0";
    const cardBg = isDarkTheme ? "rgba(255,255,255,0.05)" : "#ffffff";
    const cardBorder = isDarkTheme ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)";
    const labelColor = isDarkTheme ? "#e2e8f0" : "#1a1a1a";

    // Substituir {{FORM_SLOT}} por um formulário que herda o estilo do template
    const staticForm = `
<div style="max-width:400px;margin:0 auto;padding:24px;background:${cardBg};border:1px solid ${cardBorder};border-radius:12px;box-shadow:0 4px 20px rgba(0,0,0,0.08);font-family:${template.typography || "inherit"};">
  <div style="margin-bottom:16px;">
    <label style="display:block;font-size:14px;font-weight:600;color:${labelColor};margin-bottom:6px;">Nome</label>
    <input type="text" placeholder="Seu nome" style="width:100%;padding:12px 14px;border:1px solid ${inputBorder};border-radius:8px;font-size:14px;color:${textColor};background:${inputBg};outline:none;" />
  </div>
  <div style="margin-bottom:16px;">
    <label style="display:block;font-size:14px;font-weight:600;color:${labelColor};margin-bottom:6px;">WhatsApp</label>
    <input type="tel" placeholder="(11) 99999-9999" style="width:100%;padding:12px 14px;border:1px solid ${inputBorder};border-radius:8px;font-size:14px;color:${textColor};background:${inputBg};outline:none;" />
  </div>
  <button type="button" style="width:100%;padding:14px;background:${primaryColor};color:#fff;border:none;border-radius:8px;font-size:15px;font-weight:700;cursor:pointer;">Enviar</button>
</div>`;

    previewHtml = previewHtml.replaceAll("{{FORM_SLOT}}", staticForm);

    // Extrair assets do <head> do template original
    const headMatch = pendingVersion.rawHtml.match(/<head[^>]*>([\s\S]*?)<\/head>/i);
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
    const bodyClassMatch = pendingVersion.rawHtml.match(/<body[^>]*\bclass=["']([^"']*)["']/i);
    const bodyStyleMatch = pendingVersion.rawHtml.match(/<body[^>]*\bstyle=["']([^"']*)["']/i);
    const bodyClass = bodyClassMatch ? bodyClassMatch[1] : "";
    const bodyStyle = bodyStyleMatch ? bodyStyleMatch[1] : "";

    // Montar HTML completo com CSS reset e viewport
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

    return NextResponse.json({
      html: fullHtml,
      sourceCode: pendingVersion.rawHtml,
      formSchema: pendingVersion.formSchema,
      template: {
        id: template.id,
        name: template.name,
        description: template.description,
        category: template.category,
        theme: template.theme,
        version: pendingVersion.version,
        author: template.author,
      },
    });
  } catch (error) {
    console.error("Admin preview error:", error);
    return NextResponse.json({ error: "Erro ao carregar preview" }, { status: 500 });
  }
}