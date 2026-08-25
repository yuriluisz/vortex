import { Suspense } from "react";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { SettingsTabs } from "./settings-tabs";
import { enforceSubscription } from "@/lib/subscription-guard";
import { AlertTriangle, Clock, AlertCircle } from "lucide-react";

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
      select: {
        name: true,
        email: true,
        displayName: true,
        handle: true,
        bio: true,
        avatarUrl: true,
        publicProfile: true,
        profileLinks: true,
      },
    }),
    prisma.campaign.count({ where: { active: true, tenantId: session.tenantId } }),
    prisma.group.count({ where: { active: true, tenantId: session.tenantId } }),
    prisma.lead.count({ where: { tenantId: session.tenantId } }),
  ]);

  if (!tenant || !user) {
    redirect("/admin/login");
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
          Configurações
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
          Gerencie seu perfil, conta, segurança e assinatura de planos.
        </p>
      </div>

      {/* Banner de aviso de assinatura */}
      {subscriptionCheck.warning && (
        <div
          className={`rounded-2xl border px-5 py-4 text-xs sm:text-sm flex items-center gap-3 shadow-md animate-in fade-in duration-200 ${
            subscriptionCheck.status === "PAST_DUE"
              ? "border-destructive/30 bg-destructive/10 text-destructive font-medium"
              : subscriptionCheck.status === "CANCELING"
              ? "border-yellow-500/30 bg-yellow-500/10 text-yellow-400 font-medium"
              : "border-blue-500/30 bg-blue-500/10 text-blue-400 font-medium"
          }`}
        >
          {subscriptionCheck.status === "PAST_DUE" ? (
            <AlertCircle className="w-5 h-5 shrink-0" />
          ) : subscriptionCheck.status === "CANCELING" ? (
            <Clock className="w-5 h-5 shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 shrink-0" />
          )}
          <span>{subscriptionCheck.warning}</span>
        </div>
      )}

      <Suspense fallback={null}>
        <SettingsTabs
          companyName={tenant.name}
          userName={user.name ?? ""}
          email={user.email}
          displayName={user.displayName}
          handle={user.handle}
          bio={user.bio}
          avatarUrl={user.avatarUrl}
          publicProfile={user.publicProfile}
          profileLinks={user.profileLinks as Record<string, string> | null}
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