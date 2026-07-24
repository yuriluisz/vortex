import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

/**
 * /admin/whatsapp — Redireciona automaticamente:
 * - Se não tem instância configurada ou está desconectado → /config
 * - Se está conectado → /broadcast
 */
export default async function WhatsAppPage() {
  const session = await getSession();
  if (!session?.email || !session.tenantId) {
    redirect("/admin/login");
  }

  const instance = await prisma.evolutionInstance.findUnique({
    where: { tenantId: session.tenantId },
    select: { status: true },
  });

  if (!instance || instance.status !== "CONNECTED") {
    redirect("/admin/whatsapp/config");
  }

  redirect("/admin/whatsapp/broadcast");
}
