import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { decrypt } from "@/lib/session";

const COOKIE_NAME = "vortex_admin_session";

/**
 * Proxy do Vórtex+ (anteriormente Middleware, renomeado no Next.js 16).
 * Intercepta rotas /admin/* e valida sessão JWT.
 * Rota /admin/login é pública (permite acesso sem autenticação).
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Permitir acesso à página de login sem autenticação
  if (pathname === "/admin/login") {
    // Se já autenticado, redirecionar para o dashboard
    const cookie = request.cookies.get(COOKIE_NAME)?.value;
    const session = await decrypt(cookie);

    if (session?.email) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }

    return NextResponse.next();
  }

  // Para todas as outras rotas /admin/*, exigir autenticação
  if (pathname.startsWith("/admin")) {
    const cookie = request.cookies.get(COOKIE_NAME)?.value;
    const session = await decrypt(cookie);

    if (!session?.email) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
