"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageCircle, Users, Code } from "lucide-react";

interface CampaignTabsProps {
  campaignId: string;
}

const TABS = [
  { segment: "", label: "Editor de Página", icon: Code, exact: true },
  { segment: "/groups", label: "Grupos WhatsApp", icon: MessageCircle },
  { segment: "/leads", label: "Leads", icon: Users },
];

export function CampaignTabs({ campaignId }: CampaignTabsProps) {
  const pathname = usePathname();
  const basePath = `/admin/campaigns/${campaignId}`;

  return (
    <div className="mb-6 border-b border-border/60 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
      <nav className="-mb-px flex space-x-2 sm:space-x-4 min-w-max pb-2 px-1">
        {TABS.map((tab) => {
          const tabPath = `${basePath}${tab.segment}`;
          const isActive = tab.exact ? pathname === basePath : pathname.startsWith(tabPath);

          return (
            <Link
              key={tab.segment || "editor"}
              href={tabPath}
              className={`whitespace-nowrap py-2 px-3.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all duration-200 ${
                isActive
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
