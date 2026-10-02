import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import HtmlRenderer from "./HtmlRenderer";
import MetaPixel from "@/components/MetaPixel";
import GoogleTagManager from "@/components/GoogleTagManager";
import SessionTracker from "@/components/analytics/SessionTracker";
import BlockedPage from "@/components/BlockedPage";
import { enforceSubscription } from "@/lib/subscription-guard";
import { buildCampaignMetadata } from "@/lib/campaign-meta";
import { getSession } from "@/lib/session";
export const dynamic = "force-dynamic";
interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ preview?: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const campaign = await prisma.campaign.findFirst({
    where: { slug },
    include: { tenant: true },
  });
  if (!campaign || !campaign.tenant) return {};
  return buildCampaignMetadata(campaign);
}

export default async function CampaignPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};

  // Preview mode exige sessão de admin autenticado pertencente ao mesmo tenant — visitantes públicos não podem bypassar
  let isPreview = false;
  let sessionTenantId: string | undefined;
  if (resolvedSearchParams.preview === "true") {
    const session = await getSession();
    if (session?.tenantId) {
      isPreview = true;
      sessionTenantId = session.tenantId;
    }
  }

  // Buscar campanha pelo slug incluindo dados do tenant (no modo preview, restrito ao tenant autenticado)
  const campaign = await prisma.campaign.findFirst({
    where: isPreview ? { slug, tenantId: sessionTenantId } : { slug, active: true },
    include: { tenant: true },
  });

  if (!campaign || !campaign.tenant) {
    notFound();
  }

  // Se não for preview: verificar se está protegida ou se usa domínio customizado
  if (!isPreview) {
    if (campaign.protected && campaign.accessCode) {
      notFound();
    }
    if (campaign.customDomain) {
      notFound();
    }
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

      {/* Google Tag Manager — injeção dinâmica */}
      <GoogleTagManager gtmId={campaign.gtmId} />

      {/* Rastreamento de Sessões & Heatmap (se ativo) */}
      <SessionTracker
        campaignId={campaign.id}
        enabled={Boolean(campaign.sessionRecordingEnabled)}
      />

      {/* Renderizar HTML customizado com slot do formulário */}
      <HtmlRenderer
        rawHtml={campaign.rawHtml}
        campaignId={campaign.id}
        slug={campaign.slug}
        formSchema={formSchema}
        campaignName={campaign.name}
        tenantSlug={campaign.tenant.slug}
        showVortexFooter={showVortexFooter}
        isPreview={isPreview}
      />
    </>
  );
}
