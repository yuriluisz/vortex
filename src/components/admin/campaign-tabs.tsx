"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Settings, MessageCircle, Users } from "lucide-react";

interface CampaignTabsProps {
  campaignId: string;
}

const TABS = [
  { segment: "", label: "Detalhes", icon: Settings },
  { segment: "/groups", label: "Grupos WhatsApp", icon: MessageCircle },
  { segment: "/leads", label: "Leads Capturados", icon: Users },
];

export function CampaignTabs({ campaignId }: CampaignTabsProps) {
  const pathname = usePathname();
  const basePath = `/admin/campaigns/${campaignId}`;

  return (
    <div className="mb-8 border-b border-border overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
      <nav className="-mb-px flex space-x-8 min-w-max px-1">
        {TABS.map((tab) => {
          const tabPath = `${basePath}${tab.segment}`;
          const isActive = tab.segment === ""
            ? pathname === basePath
            : pathname.startsWith(tabPath);

          return (
            <Link
              key={tab.segment}
              href={tabPath}
              className={`whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium flex items-center gap-2 transition-colors ${
                isActive
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:border-border hover:text-foreground/80"
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
