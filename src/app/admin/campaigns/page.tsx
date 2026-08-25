import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { CampaignsClient } from "./campaigns-client";

export default async function CampaignsPage() {
  const session = await getSession();
  if (!session?.email || !session.tenantId) {
    redirect("/admin/login");
  }

  // 1. Minhas campanhas no tenant ativo
  const ownCampaigns = await prisma.campaign.findMany({
    where: { tenantId: session.tenantId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      slug: true,
      active: true,
      views: true,
      customDomain: true,
      _count: {
        select: { leads: true, groups: true },
      },
    },
  });

  // 2. Campanhas compartilhadas com o usuário de outros tenants
  const sharedCampaignsRaw = await prisma.campaignShare.findMany({
    where: {
      OR: [
        { userId: session.userId },
        { email: { equals: session.email, mode: "insensitive" } },
      ],
      campaign: {
        tenantId: { not: session.tenantId },
      },
    },
    include: {
      campaign: {
        select: {
          id: true,
          name: true,
          slug: true,
          active: true,
          views: true,
          customDomain: true,
          tenant: {
            select: { name: true, slug: true },
          },
          _count: {
            select: { leads: true, groups: true },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const sharedCampaigns = sharedCampaignsRaw.map((s) => ({
    id: s.campaign.id,
    name: s.campaign.name,
    slug: s.campaign.slug,
    active: s.campaign.active,
    views: s.campaign.views,
    customDomain: s.campaign.customDomain,
    _count: s.campaign._count,
    sharedPermission: s.permission,
    sharedByOwnerName: s.campaign.tenant?.name || "Outro Usuário",
  }));

  return (
    <CampaignsClient
      initialCampaigns={ownCampaigns}
      sharedCampaigns={sharedCampaigns}
    />
  );
}
