import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function WhatsAppPage() {
  const session = await getSession();
  if (!session?.email || !session.tenantId) {
    redirect("/admin/login");
  }

  redirect("/admin/whatsapp/broadcast");
}
