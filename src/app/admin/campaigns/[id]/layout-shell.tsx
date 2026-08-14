"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { CampaignTabs } from "@/components/admin/campaign-tabs";
import React from "react";

interface CampaignLayoutShellProps {
  campaign: {
    id: string;
    name: string;
    slug: string;
    active: boolean;
  };
  children: React.ReactNode;
}

/**
 * Client-side layout shell for campaign pages.
 * 
 * On the main editor page (/admin/campaigns/[id]) the editor fills the entire
 * content area — no extra header or tabs are shown.
 * 
 * On sub-pages (groups, leads) the classic header with campaign name, slug badge,
 * status indicator, and navigation tabs is rendered.
 */
export function CampaignLayoutShell({ campaign, children }: CampaignLayoutShellProps) {
  const pathname = usePathname();
  const basePath = `/admin/campaigns/${campaign.id}`;

  // The main editor page is the exact base path
  const isEditorPage = pathname === basePath;

  if (isEditorPage) {
    // Uses absolute positioning to fill the admin shell content area exactly.
    // The parent div in AdminShell already has `relative z-10`, so this works.
    return <div className="absolute inset-0 overflow-hidden">{children}</div>;
  }

  // Sub-pages get the classic chrome with header + tabs
  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-6">
        <Link
          href={basePath}
          className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para Editor
        </Link>
        <h2 className="text-3xl font-bold text-foreground tracking-tight">{campaign.name}</h2>
        <div className="mt-2 flex items-center gap-3 text-sm text-muted-foreground">
          <span className="inline-flex items-center rounded-md bg-muted px-2 py-1 font-mono">
            /{campaign.slug}
          </span>
          <span className="flex items-center gap-1.5">
            <span className={`h-2 w-2 rounded-full ${campaign.active ? "bg-chart-1" : "bg-muted-foreground"}`}></span>
            {campaign.active ? "Ativa" : "Inativa"}
          </span>
        </div>
      </div>

      <CampaignTabs campaignId={campaign.id} />

      <div className="mt-6 animate-in fade-in duration-200">
        {children}
      </div>
    </div>
  );
}
