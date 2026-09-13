import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { decrypt } from "@/lib/session";

const COOKIE_NAME = "vortex_admin_session";

/**
 * Proxy do Vórtex+ (Next.js 16).
 *
 * Pipeline:
 * 1. /admin/login → pública (redireciona se já logado)
 * 2. /admin/* → verifica sessão JWT
 * 3. Demais rotas → NextResponse.next()
 */
export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Rotas de API sao sempre globais e nunca devem ser reescritas para dominios customizados
  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }
  // ==========================================================================
  // ROTEAMENTO DE DOMÍNIOS CUSTOMIZADOS
  // ==========================================================================
  // O domínio principal do sistema
  const mainDomain = process.env.NEXT_PUBLIC_APP_URL ? new URL(process.env.NEXT_PUBLIC_APP_URL).host : "vortexpages.online";



  // Cabeçalho secreto enviado EXCLUSIVAMENTE pelo Cloudflare Worker para domínios customizados
  const vortexHost = request.headers.get("x-vortex-host");
  const vortexSecret = (request.headers.get("x-vortex-secret") || "").trim();
  const expectedSecret = (process.env.CLOUDFLARE_WORKER_SECRET || "").trim();
  
  if (vortexHost && !vortexHost.includes(mainDomain)) {
    // Validar que veio do Worker legítimo
    if (!expectedSecret || vortexSecret !== expectedSecret) {
      console.error(`[Proxy] Forbidden: secret mismatch. Expected length: ${expectedSecret.length}, Received length: ${vortexSecret.length}`);
      return new NextResponse("Forbidden", { status: 403 });
    }
    // Worker enviou o domínio original do cliente — reescreve para a rota interna
    const cleanHost = vortexHost.split(':')[0].trim().toLowerCase();
    const url = new URL(`/custom-domain/${cleanHost}${pathname}`, request.url);
    
    // CORREÇÃO SERVER ACTIONS: 
    // Sobrescrever o header 'x-forwarded-host' para bater com a Origin 
    // Isso evita o erro: `x-forwarded-host` header does not match `origin`
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-forwarded-host", cleanHost);

    return NextResponse.rewrite(url, {
      request: {
        headers: requestHeaders,
      },
    });
  }

  const hostname = (request.headers.get("host") || "").split(':')[0];
  
  // Se for um hostname diferente do principal e não for ambiente de dev local/tunnel
  if (
    hostname &&
    !hostname.includes(mainDomain) &&
    !hostname.includes("localhost") &&
    !hostname.includes("loca.lt") &&
    !hostname.includes("ngrok") &&
    !hostname.includes("trycloudflare.com") &&
    !hostname.includes("vercel.app")
  ) {
    // 🔒 Produção exige validação do segredo para evitar spoofing direto de cabeçalho Host
    if (process.env.NODE_ENV === "production" && (!expectedSecret || vortexSecret !== expectedSecret)) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    // Fallback: se não veio X-Vortex-Host mas o Hostname é diferente, tenta reescrever
    const url = new URL(`/custom-domain/${hostname}${pathname}`, request.url);
    
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-forwarded-host", hostname);
    
    return NextResponse.rewrite(url, {
      request: {
        headers: requestHeaders,
      },
    });
  }

  // ==========================================================================
  // PASSO 1: /admin/login — rota pública
  // ==========================================================================
  if (pathname === "/admin/login") {
    const cookie = request.cookies.get(COOKIE_NAME)?.value;
    const session = await decrypt(cookie);

    if (session?.email) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }

    return NextResponse.next();
  }

  // ==========================================================================
  // PASSO 2: /admin/super/* — proteção extra (apenas SUPER_ADMIN)
  // ==========================================================================
  if (pathname.startsWith("/admin/super")) {
    const cookie = request.cookies.get(COOKIE_NAME)?.value;
    const session = await decrypt(cookie);

    if (!session?.email || session.role !== "SUPER_ADMIN") {
      return NextResponse.redirect(new URL("/admin", request.url));
    }

    return NextResponse.next();
  }

  // ==========================================================================
  // PASSO 3: /admin/* — proteção de autenticação
  // ==========================================================================
  if (pathname.startsWith("/admin")) {
    const cookie = request.cookies.get(COOKIE_NAME)?.value;
    const session = await decrypt(cookie);

    if (!session?.email) {
      const loginUrl = new URL("/admin/login", request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.svg|.*\\.png|.*\\.webmanifest|api/webhooks).*)",
  ],
};