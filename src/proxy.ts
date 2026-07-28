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
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

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