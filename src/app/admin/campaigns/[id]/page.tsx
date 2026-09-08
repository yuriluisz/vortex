import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { notFound, redirect } from "next/navigation";
import { getUserTenant } from "@/lib/auth";
import { checkCampaignAccess } from "@/lib/permissions";
import { CampaignEditor } from "@/components/admin/campaign-editor";

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
  const access = await checkCampaignAccess(id, session.userId, session.tenantId);
  if (!access.allowed) {
    notFound();
  }

  const campaign = await prisma.campaign.findUnique({
    where: { id },
    include: {
      groups: {
        orderBy: { createdAt: "asc" }
      }
    }
  });

  if (!campaign) {
    notFound();
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: campaign.tenantId },
    select: { maxGroups: true }
  });

  let plan = "FREE";
  if (session.userId) {
    const tenantInfo = await getUserTenant(session.userId);
    if (tenantInfo) {
      plan = tenantInfo.plan;
    }
  }

  return (
    <CampaignEditor
      mode="edit"
      plan={plan}
      campaign={{
        id: campaign.id,
        name: campaign.name,
        slug: campaign.slug,
        rawHtml: campaign.rawHtml,
        formSchema: campaign.formSchema,
        pixelId: campaign.pixelId,
        gtmId: campaign.gtmId,
        customDomain: campaign.customDomain,
        active: campaign.active,
        protected: campaign.protected,
        accessCode: campaign.accessCode,
        metaTitle: campaign.metaTitle,
        metaDescription: campaign.metaDescription,
        ogImageUrl: campaign.ogImageUrl,
        faviconUrl: campaign.faviconUrl,
        groupMaxCapacity: campaign.groupMaxCapacity,
        groupSupportPhones: campaign.groupSupportPhones,
        groupDescription: campaign.groupDescription,
        groupImageUrl: campaign.groupImageUrl,
        sessionRecordingEnabled: campaign.sessionRecordingEnabled,
        groups: campaign.groups.map(g => ({
          id: g.id,
          name: g.name,
          url: g.url,
          currentCount: g.currentCount,
          maxCapacity: g.maxCapacity,
          active: g.active,
        })),
      }}
      tenantId={session.tenantId}
      tenantMaxGroups={tenant?.maxGroups || 3}
    />
  );
}