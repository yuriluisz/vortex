import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { notFound, redirect } from "next/navigation";
import { getUserTenant } from "@/lib/auth";
import { EditCampaignForm } from "./EditCampaignForm";
import { CampaignControls } from "./CampaignControls";

export default async function CampaignDetailsPage({
  params,
}: {
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

  let plan = "FREE";
  if (session.userId) {
    const tenantInfo = await getUserTenant(session.userId);
    if (tenantInfo) {
      plan = tenantInfo.plan;
    }
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <CampaignControls
        campaignId={campaign.id}
        initialActive={campaign.active}
        initialProtected={campaign.protected}
        slug={campaign.slug}
        accessCode={campaign.accessCode}
        customDomain={campaign.customDomain}
      />

      <EditCampaignForm campaign={campaign} plan={plan} />
    </div>
  );
}