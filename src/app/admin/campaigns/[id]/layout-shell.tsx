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
    return <div className="flex-1 flex flex-col min-h-0 w-full h-full overflow-hidden">{children}</div>;
  }

  // Sub-pages get the classic chrome with header + tabs
  return (
    <div className="mx-auto max-w-7xl w-full min-w-0 pb-16 pt-1 sm:pt-2">
      <div className="mb-6">
        <div className="mb-4 flex items-center">
          <Link
            href={basePath}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] hover:border-white/20 text-xs sm:text-sm font-medium text-neutral-300 hover:text-white transition-all shadow-xs group active:scale-95"
          >
            <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-1 text-neutral-400 group-hover:text-white" />
            <span>Voltar para Editor</span>
          </Link>
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight truncate">{campaign.name}</h2>
        <div className="mt-2 flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm text-muted-foreground">
          <span className="inline-flex items-center rounded-md bg-muted px-2 py-1 font-mono text-xs">
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
