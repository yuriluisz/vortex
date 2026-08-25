"use client";

import React, { useState } from "react";
import { useSearchParams } from "next/navigation";
import { User, CreditCard } from "lucide-react";
import { ProfileForm } from "./profile-form";
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
  email: string;
  currentPlan: Plan;
  billingInfo: BillingInfo;
  subscriptionInfo: SubscriptionInfo;
  usage: UsageStats;
  displayName?: string | null;
  handle?: string | null;
  bio?: string | null;
  publicProfile?: boolean;
  profileLinks?: Record<string, string> | null;
}

type Tab = "profile" | "subscription";

const TABS: { id: Tab; label: string; icon: typeof User }[] = [
  { id: "profile", label: "Perfil", icon: User },
  { id: "subscription", label: "Assinatura", icon: CreditCard },
];

export function SettingsTabs({
  companyName,
  userName,
  email,
  currentPlan,
  billingInfo,
  subscriptionInfo,
  usage,
  displayName,
  handle,
  bio,
  publicProfile,
  profileLinks,
}: SettingsTabsProps) {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState<Tab>(
    (TABS.find(t => t.id === tabParam)?.id) || "profile"
  );

  return (
    <div>
      {/* Tab Navigation */}
      <div className="flex overflow-x-auto border-b border-border mb-8 no-scrollbar">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
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
      {activeTab === "profile" ? (
        <ProfileForm
          companyName={companyName}
          userName={userName}
          email={email}
          billingInfo={billingInfo}
          displayName={displayName}
          handle={handle}
          bio={bio}
          publicProfile={publicProfile}
          profileLinks={profileLinks}
        />
      ) : (
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