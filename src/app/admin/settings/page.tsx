import { Suspense } from "react";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { SettingsTabs } from "./settings-tabs";

export default async function SettingsPage() {
  const session = await getSession();
  if (!session?.email || !session.tenantId) {
    redirect("/admin/login");
  }

  const [tenant, user, totalCampaigns, activeGroups, totalLeads] = await Promise.all([
    prisma.tenant.findUnique({
      where: { id: session.tenantId },
      select: { name: true, slug: true, plan: true, maxCampaigns: true, maxGroups: true, maxLeads: true },
    }),
    prisma.user.findUnique({
      where: { id: session.userId },
      select: { name: true, email: true },
    }),
    prisma.campaign.count({ where: { active: true, tenantId: session.tenantId } }),
    prisma.group.count({ where: { active: true, tenantId: session.tenantId } }),
    prisma.lead.count({ where: { tenantId: session.tenantId } }),
  ]);

  if (!tenant || !user) {
    redirect("/admin/login");
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Configurações
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Gerencie seu perfil, conta e plano.
        </p>
      </div>

      <Suspense fallback={null}>
        <SettingsTabs
          companyName={tenant.name}
          userName={user.name ?? ""}
          slug={tenant.slug}
          email={user.email}
          currentPlan={tenant.plan}
          usage={{
            campaigns: { current: totalCampaigns, max: tenant.maxCampaigns },
            groups: { current: activeGroups, max: tenant.maxGroups },
            leads: { current: totalLeads, max: tenant.maxLeads },
          }}
        />
      </Suspense>
    </div>
  );
}