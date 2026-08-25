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
  avatarUrl?: string | null;
  publicProfile?: boolean;
  profileLinks?: Record<string, string> | null;
}

type Tab = "profile" | "subscription";

const TABS: { id: Tab; label: string; icon: typeof User }[] = [
  { id: "profile", label: "Perfil & Conta", icon: User },
  { id: "subscription", label: "Planos & Assinatura", icon: CreditCard },
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
  avatarUrl,
  publicProfile,
  profileLinks,
}: SettingsTabsProps) {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState<Tab>(
    (TABS.find(t => t.id === tabParam)?.id) || "profile"
  );

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="border-b border-border/60 pb-3 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <nav className="flex space-x-2 sm:space-x-3 min-w-max">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="animate-in fade-in duration-200">
        {activeTab === "profile" ? (
          <ProfileForm
            companyName={companyName}
            userName={userName}
            email={email}
            billingInfo={billingInfo}
            displayName={displayName}
            handle={handle}
            bio={bio}
            avatarUrl={avatarUrl}
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
    </div>
  );
}