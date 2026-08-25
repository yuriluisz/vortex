import type { Metadata } from "next";
import { cookies } from "next/headers";
import { decrypt } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { AdminShell } from "@/components/admin/admin-shell";
import { getUserAccessibleTenants } from "@/lib/permissions";
import { redirect } from "next/navigation";

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
  let realName = session?.tenantSlug || "Meu Workspace";
  let subscriptionStatus = "TRIAL";
  let trialEndsAt: Date | null = null;
  let workspaces: Array<{
    tenantId: string;
    name: string;
    slug: string;
    plan: string;
    role: "OWNER" | "ADMIN" | "MEMBER";
    isPrimary: boolean;
  }> = [];
  
  if (session?.userId) {
    workspaces = await getUserAccessibleTenants(session.userId);
  }

  if (session?.tenantId) {
    const tenant = await prisma.tenant.findUnique({
      where: { id: session.tenantId },
      select: { name: true, plan: true, subscriptionStatus: true, trialEndsAt: true, active: true },
    });
    
    if (tenant) {
      if (!tenant.active) {
        // Se desativou a conta, derrubar do painel admin.
        redirect("/admin/login");
      }
      realName = tenant.name;
      realPlan = tenant.plan;
      subscriptionStatus = tenant.subscriptionStatus;
      trialEndsAt = tenant.trialEndsAt;
    }
  }

  const tenantInfo = session?.tenantSlug
    ? {
        id: session.tenantId,
        name: realName,
        slug: session.tenantSlug,
        plan: realPlan,
        role: session.role || undefined,
        subscriptionStatus,
        trialEndsAt: trialEndsAt?.toISOString(),
        workspaces,
      }
    : null;

  return <AdminShell tenantInfo={tenantInfo}>{children}</AdminShell>;
}