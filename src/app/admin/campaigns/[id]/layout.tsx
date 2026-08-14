import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { notFound, redirect } from "next/navigation";
import React from "react";
import { CampaignLayoutShell } from "./layout-shell";

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
    select: { id: true, name: true, slug: true, active: true, tenantId: true },
  });

  if (!campaign || campaign.tenantId !== session.tenantId) {
    notFound();
  }

  return (
    <CampaignLayoutShell campaign={campaign}>
      {children}
    </CampaignLayoutShell>
  );
}
