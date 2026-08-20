import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { CampaignsClient } from "./campaigns-client";

export default async function CampaignsPage() {
  const session = await getSession();
  if (!session?.email || !session.tenantId) {
    redirect("/admin/login");
  }

  const campaigns = await prisma.campaign.findMany({
    where: { tenantId: session.tenantId },
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { leads: true, groups: true },
      },
    },
  });

  return <CampaignsClient initialCampaigns={campaigns} />;
}

