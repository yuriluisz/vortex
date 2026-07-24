import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { WhatsAppTabs } from "@/components/admin/whatsapp-tabs";

export default async function WhatsAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session?.email || !session.tenantId) {
    redirect("/admin/login");
  }

  // Verificar plano ULTRA
  const tenant = await prisma.tenant.findUnique({
    where: { id: session.tenantId },
    select: { plan: true },
  });

  if (!tenant || tenant.plan !== "ULTRA") {
    redirect("/admin");
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2 mb-4">
        <h2 className="text-3xl font-bold tracking-tight">WhatsApp</h2>
      </div>
      <WhatsAppTabs />
      {children}
    </div>
  );
}
