import type { Metadata } from "next";
import { cookies } from "next/headers";
import { decrypt } from "@/lib/session";
import { AdminShell } from "@/components/admin/admin-shell";

export const metadata: Metadata = {
  title: "Vórtex+ — Documentação",
  description: "Documentação oficial do Vórtex+",
};

const COOKIE_NAME = "vortex_admin_session";

export default async function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(COOKIE_NAME)?.value;
  const session = await decrypt(cookie);

  const tenantInfo = session?.tenantSlug
    ? {
        name: session.tenantSlug,
        slug: session.tenantSlug,
        plan: (session.plan as string) || "FREE",
        role: session.role || undefined,
      }
    : null;

  return <AdminShell tenantInfo={tenantInfo}>{children}</AdminShell>;
}