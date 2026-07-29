import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import HtmlRenderer from "../../[slug]/HtmlRenderer";
import MetaPixel from "@/components/MetaPixel";
import BlockedPage from "@/components/BlockedPage";
import { enforceSubscription } from "@/lib/subscription-guard";

interface PageProps {
  params: Promise<{ hostname: string }>;
}

export default async function DomainCampaignPage({ params }: PageProps) {
  const rawHost = await params;
  const cleanHost = decodeURIComponent(rawHost.hostname)
    .toLowerCase()
    .trim()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "");

  const campaign = await prisma.campaign.findFirst({
    where: {
      OR: [
        { customDomain: cleanHost },
        { customDomain: `https://${cleanHost}` },
        { customDomain: `http://${cleanHost}` },
        { customDomain: { equals: cleanHost, mode: "insensitive" } },
      ],
      active: true,
    },
    include: { tenant: true },
  });

  if (!campaign || !campaign.tenant) {
    notFound();
  }

  // Se a campanha está protegida, retornar 404
  if (campaign.protected && campaign.accessCode) {
    notFound();
  }

  // Validação de assinatura do Tenant
  const subCheck = await enforceSubscription(campaign.tenant.id);

  // Bloqueio se não estiver permitido (inadimplente/cancelado) 
  // OU se o plano for diferente de ULTRA
  if (!subCheck.allowed || subCheck.planEffective !== "ULTRA") {
    // Reutilizando o BlockedPage. Poderia ser um DomainBlockedPage no futuro.
    return <BlockedPage slug={campaign.slug} />;
  }

  // Parse do formSchema
  const formSchema = campaign.formSchema as Array<{
    id: string;
    type: "text" | "email" | "tel" | "select" | "textarea";
    label: string;
    placeholder?: string;
    required?: boolean;
    options?: string[];
  }>;

  return (
    <>
      <MetaPixel pixelId={campaign.pixelId} />
      <HtmlRenderer
        rawHtml={campaign.rawHtml}
        campaignId={campaign.id}
        slug={campaign.slug}
        formSchema={formSchema}
        campaignName={campaign.name}
        tenantSlug={campaign.tenant.slug}
        showVortexFooter={false} // Planos ULTRA não exibem a marca do Vórtex
        isCustomDomain={true}
      />
    </>
  );
}
