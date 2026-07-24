"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { ProfileForm } from "./profile-form";
import { EmailChangeForm } from "./email-change-form";
import { PlanSelector } from "./plan-selector";
import type { Plan } from "@prisma/client";

interface UsageStats {
  campaigns: { current: number; max: number };
  groups: { current: number; max: number };
  leads: { current: number; max: number };
}

interface SettingsTabsProps {
  companyName: string;
  userName: string;
  slug: string;
  email: string;
  currentPlan: Plan;
  usage: UsageStats;
}

type Tab = "profile" | "account";

export function SettingsTabs({
  companyName,
  userName,
  slug,
  email,
  currentPlan,
  usage,
}: SettingsTabsProps) {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") === "account" ? "account" : "profile";
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);

  return (
    <div>
      {/* Tab Navigation */}
      <div className="flex border-b border-border mb-8">
        <button
          onClick={() => setActiveTab("profile")}
          className={`px-5 py-3 text-sm font-medium transition-colors duration-150 border-b-2 -mb-px ${
            activeTab === "profile"
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
          }`}
        >
          Perfil
        </button>
        <button
          onClick={() => setActiveTab("account")}
          className={`px-5 py-3 text-sm font-medium transition-colors duration-150 border-b-2 -mb-px ${
            activeTab === "account"
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
          }`}
        >
          Conta
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "profile" && (
        <ProfileForm
          companyName={companyName}
          userName={userName}
          slug={slug}
        />
      )}

      {activeTab === "account" && (
        <div className="space-y-10">
          <EmailChangeForm currentEmail={email} />
          <PlanSelector currentPlan={currentPlan} usage={usage} />
        </div>
      )}
    </div>
  );
}