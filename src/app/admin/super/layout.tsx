import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { decrypt } from "@/lib/session";

export const metadata: Metadata = {
  title: "Super Admin — Vórtex+",
  description: "Painel de administração global do Vórtex+",
  robots: "noindex, nofollow",
};

const COOKIE_NAME = "vortex_admin_session";

/**
 * Layout do Super Admin.
 * Apenas SUPER_ADMIN pode acessar.
 */
export default async function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(COOKIE_NAME)?.value;
  const session = await decrypt(cookie);

  if (!session?.email || session.role !== "SUPER_ADMIN") {
    redirect("/admin");
  }

  return <>{children}</>;
}