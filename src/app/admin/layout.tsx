import type { Metadata } from "next";
import { cookies } from "next/headers";
import { decrypt } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { AdminShell } from "@/components/admin/admin-shell";

export const metadata: Metadata = {
  title: "Vórtex+ — Painel Admin",
  description: "Painel administrativo do Vórtex+",
  robots: "noindex, nofollow",
};

const COOKIE_NAME = "vortex_admin_session";

/**
 * Layout do painel admin (Server Component).
 *
 * Lê a sessão do cookie e passa os dados do tenant para o AdminShell.
 * A proteção de autenticação é feita pelo proxy.ts (middleware).
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(COOKIE_NAME)?.value;
  const session = await decrypt(cookie);

  let realPlan = "FREE";
  if (session?.tenantId) {
    const tenant = await prisma.tenant.findUnique({
      where: { id: session.tenantId },
      select: { plan: true },
    });
    if (tenant) {
      realPlan = tenant.plan;
    }
  }

  const tenantInfo = session?.tenantSlug
    ? {
        name: session.tenantSlug,
        slug: session.tenantSlug,
        plan: realPlan,
        role: session.role || undefined,
      }
    : null;

  return <AdminShell tenantInfo={tenantInfo}>{children}</AdminShell>;
}