"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { User, Building2, CreditCard } from "lucide-react";
import { ProfileForm } from "./profile-form";
import { AccountForm } from "./email-change-form";
import { PlanSelector } from "./plan-selector";
import type { Plan } from "@prisma/client";

interface UsageStats {
  campaigns: { current: number; max: number };
  groups: { current: number; max: number };
  leads: { current: number; max: number };
}

interface BillingInfo {
  billingCpfCnpj: string | null;
  billingPersonType: string | null;
  billingBusinessName: string | null;
  billingPhone: string | null;
  billingAddress: Record<string, string> | null;
}

interface SubscriptionInfo {
  status: string;
  currentPeriodEnd: string | null;
  pendingPlan: Plan | null;
  cancelAt: string | null;
  gracePeriodEnd: string | null;
  hasSubscription: boolean;
}

interface SettingsTabsProps {
  companyName: string;
  userName: string;
  slug: string;
  email: string;
  currentPlan: Plan;
  billingInfo: BillingInfo;
  subscriptionInfo: SubscriptionInfo;
  usage: UsageStats;
}

type Tab = "profile" | "account" | "subscription";

const TABS: { id: Tab; label: string; icon: typeof User }[] = [
  { id: "profile", label: "Perfil", icon: Building2 },
  { id: "account", label: "Conta", icon: User },
  { id: "subscription", label: "Assinatura", icon: CreditCard },
];

export function SettingsTabs({
  companyName,
  userName,
  slug,
  email,
  currentPlan,
  billingInfo,
  subscriptionInfo,
  usage,
}: SettingsTabsProps) {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const initialTab = TABS.find(t => t.id === tabParam)?.id || "profile";
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);

  return (
    <div>
      {/* Tab Navigation */}
      <div className="flex border-b border-border mb-8">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-medium transition-colors duration-150 border-b-2 -mb-px ${
                activeTab === tab.id
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === "profile" && (
        <div className="space-y-8 pb-16">
          <ProfileForm companyName={companyName} slug={slug} billingInfo={billingInfo} />
        </div>
      )}

      {activeTab === "account" && (
        <div className="space-y-8">
          <AccountForm currentEmail={email} userName={userName} />
        </div>
      )}

      {activeTab === "subscription" && (
        <PlanSelector
          currentPlan={currentPlan}
          usage={usage}
          billingInfo={billingInfo}
          subscriptionInfo={subscriptionInfo}
        />
      )}
    </div>
  );
}