import { cookies } from "next/headers";
import { decrypt } from "@/lib/session";
import { getUserTenant } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CampaignEditor } from "@/components/admin/campaign-editor";

export default async function NewCampaignPage({
  searchParams,
}: {
  searchParams: Promise<{ template?: string }>;
}) {
  const cookieStore = await cookies();
  const cookie = cookieStore.get("vortex_admin_session")?.value;
  const session = await decrypt(cookie);

  let plan = "FREE";
  if (session?.userId) {
    const userTenant = await getUserTenant(session.userId);
    if (userTenant) {
      plan = userTenant.plan;
    }
  }

  const { template: templateSlug } = await searchParams;
  let templateData: any = undefined;

  if (templateSlug) {
    const template = await prisma.template.findUnique({
      where: { slug: templateSlug, status: "PUBLISHED" },
      include: {
        versions: {
          where: { status: "PUBLISHED" },
          orderBy: { version: "desc" },
          take: 1,
        },
      },
    });

    if (template && template.versions[0]) {
      templateData = {
        name: template.name,
        rawHtml: template.versions[0].rawHtml,
        formSchema: template.versions[0].formSchema,
        metaTitle: template.name,
        metaDescription: template.description || "",
      };
    }
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 w-full h-full overflow-hidden">
      <CampaignEditor mode="create" plan={plan} campaign={templateData} />
    </div>
  );
}