import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { CampaignTabs } from "@/components/admin/campaign-tabs";
import React from "react";

export default async function CampaignLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session?.email || !session.tenantId) {
    redirect("/admin/login");
  }

  const { id } = await params;
  const campaign = await prisma.campaign.findUnique({
    where: { id },
  });

  if (!campaign || campaign.tenantId !== session.tenantId) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-6">
        <Link
          href="/admin/campaigns"
          className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para Campanhas
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

      {/* Tabs de navegação — client component com indicador ativo */}
      <CampaignTabs campaignId={campaign.id} />

      {/* Conteúdo da Tab */}
      <div className="mt-6 animate-in fade-in duration-200">
        {children}
      </div>
    </div>
  );
}
