import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import HtmlRenderer from "./HtmlRenderer";
import MetaPixel from "@/components/MetaPixel";
import BlockedPage from "@/components/BlockedPage";
import { enforceSubscription } from "@/lib/subscription-guard";

export const revalidate = 60; // 60 segundos (Edge Cache para CDN)
interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function CampaignPage({ params }: PageProps) {
  const { slug } = await params;

  // Buscar campanha pelo slug incluindo dados do tenant
  const campaign = await prisma.campaign.findFirst({
    where: { slug, active: true },
    include: { tenant: true },
  });

  if (!campaign || !campaign.tenant) {
    notFound();
  }

  // Se a campanha está protegida, retornar 404 — o slug não existe mais
  if (campaign.protected && campaign.accessCode) {
    notFound();
  }

  // Se a campanha possui um domínio customizado, ela não deve ser acessada via slug padrão
  if (campaign.customDomain) {
    notFound();
  }

  // Validação de assinatura do Tenant via subscription-guard (unificada)
  const subCheck = await enforceSubscription(campaign.tenant.id);

  // Se não estiver permitido (grace period expirado), mostrar tela de bloqueio
  if (!subCheck.allowed) {
    return <BlockedPage slug={slug} />;
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
