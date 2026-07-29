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
  const hostname = request.headers.get("host") || "";

  // ==========================================================================
  // ROTEAMENTO DE DOMÍNIOS CUSTOMIZADOS
  // ==========================================================================
  // O domínio principal do sistema
  const mainDomain = process.env.NEXT_PUBLIC_APP_URL ? new URL(process.env.NEXT_PUBLIC_APP_URL).host : "vortexpages.online";
  
  // Se for um hostname diferente do principal e não for ambiente de dev local/tunnel
  if (
    hostname &&
    !hostname.includes(mainDomain) &&
    !hostname.includes("localhost") &&
    !hostname.includes("loca.lt") &&
    !hostname.includes("ngrok") &&
    !hostname.includes("trycloudflare.com") &&
    !hostname.includes("vercel.app") // Vercel defaults
  ) {
    // Reescreve a requisição para a rota interna responsável pelo domínio
    // Mantemos o pathname caso o usuário acesse algo específico, 
    // mas a raiz '/' renderizará a campanha do domínio
    const url = new URL(`/_domain/${hostname}${pathname}`, request.url);
    return NextResponse.rewrite(url);
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