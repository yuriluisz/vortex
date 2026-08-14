import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import HtmlRenderer from "../../[slug]/HtmlRenderer";
import MetaPixel from "@/components/MetaPixel";
import BlockedPage from "@/components/BlockedPage";
import { enforceSubscription } from "@/lib/subscription-guard";
import { buildCampaignMetadata } from "@/lib/campaign-meta";

export const revalidate = 60; // 60 segundos (Edge Cache para CDN)
interface PageProps {
  params: Promise<{ code: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { code } = await params;
  const campaign = await prisma.campaign.findFirst({
    where: { accessCode: code, active: true },
    include: { tenant: true },
  });
  if (!campaign || !campaign.tenant || !campaign.protected) return {};
  return buildCampaignMetadata(campaign);
}

export default async function ProtectedCampaignPage({ params }: PageProps) {
  const { code } = await params;

  // Buscar campanha pelo accessCode
  const campaign = await prisma.campaign.findFirst({
    where: { accessCode: code, active: true },
    include: { tenant: true },
  });

  if (!campaign || !campaign.tenant || !campaign.protected) {
    notFound();
  }

  // Validação de assinatura do Tenant via subscription-guard (unificada)
  const subCheck = await enforceSubscription(campaign.tenant.id);

  // Se não estiver permitido (grace period expirado), mostrar tela de bloqueio
  if (!subCheck.allowed) {
    return <BlockedPage slug={campaign.slug} />;
  }

  // Footer Vórtex aparece apenas no plano FREE
  const showVortexFooter = subCheck.planEffective === "FREE";

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
      {/* Meta Pixel — injeção dinâmica */}
      <MetaPixel pixelId={campaign.pixelId} />

      {/* Renderizar HTML customizado com slot do formulário */}
      <HtmlRenderer
        rawHtml={campaign.rawHtml}
        campaignId={campaign.id}
        slug={campaign.slug}
        formSchema={formSchema}
        campaignName={campaign.name}
        tenantSlug={campaign.tenant.slug}
        showVortexFooter={showVortexFooter}
      />
    </>
  );
}
