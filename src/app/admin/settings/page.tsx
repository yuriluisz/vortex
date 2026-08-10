import { Suspense } from "react";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { SettingsTabs } from "./settings-tabs";
import { enforceSubscription } from "@/lib/subscription-guard";

export default async function SettingsPage() {
  const session = await getSession();
  if (!session?.email || !session.tenantId) {
    redirect("/admin/login");
  }

  // Enforcement de assinatura (pode aplicar downgrades automáticos)
  const subscriptionCheck = await enforceSubscription(session.tenantId);

  const [tenant, user, totalCampaigns, activeGroups, totalLeads] = await Promise.all([
    prisma.tenant.findUnique({
      where: { id: session.tenantId },
      select: {
        name: true,
        slug: true,
        plan: true,
        maxCampaigns: true,
        maxGroups: true,
        maxLeads: true,
        // Billing
        billingCpfCnpj: true,
        billingPersonType: true,
        billingBusinessName: true,
        billingPhone: true,
        billingAddress: true,
        // Subscription
        subscriptionStatus: true,
        currentPeriodEnd: true,
        asaasSubscriptionId: true,
        pendingPlan: true,
        cancelAt: true,
        gracePeriodEnd: true,
      },
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
    <div className="mx-auto max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Configurações
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Gerencie seu perfil, conta e assinatura.
        </p>
      </div>

      {/* Banner de aviso de assinatura */}
      {subscriptionCheck.warning && (
        <div className={`mb-6 rounded-xl border px-5 py-4 text-sm ${
          subscriptionCheck.status === "PAST_DUE"
            ? "border-destructive/30 bg-destructive/5 text-destructive"
            : subscriptionCheck.status === "CANCELING"
            ? "border-yellow-500/30 bg-yellow-500/5 text-yellow-700 dark:text-yellow-400"
            : "border-blue-500/30 bg-blue-500/5 text-blue-700 dark:text-blue-400"
        }`}>
          {subscriptionCheck.warning}
        </div>
      )}

      <Suspense fallback={null}>
        <SettingsTabs
          companyName={tenant.name}
          userName={user.name ?? ""}
          email={user.email}
          currentPlan={tenant.plan}
          billingInfo={{
            billingCpfCnpj: tenant.billingCpfCnpj,
            billingPersonType: tenant.billingPersonType,
            billingBusinessName: tenant.billingBusinessName,
            billingPhone: tenant.billingPhone,
            billingAddress: tenant.billingAddress as any,
          }}
          subscriptionInfo={{
            status: tenant.subscriptionStatus,
            currentPeriodEnd: tenant.currentPeriodEnd?.toISOString() || null,
            pendingPlan: tenant.pendingPlan,
            cancelAt: tenant.cancelAt?.toISOString() || null,
            gracePeriodEnd: tenant.gracePeriodEnd?.toISOString() || null,
            hasSubscription: !!tenant.asaasSubscriptionId,
          }}
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