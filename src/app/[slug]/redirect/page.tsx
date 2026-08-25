import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getActiveGroupForCampaign } from "@/lib/rotator";
import MetaPixel from "@/components/MetaPixel";
import GoogleTagManager from "@/components/GoogleTagManager";
import RedirectClient from "./RedirectClient";
import BlockedPage from "@/components/BlockedPage";
import { enforceSubscription } from "@/lib/subscription-guard";
import { buildCampaignMetadata } from "@/lib/campaign-meta";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const campaign = await prisma.campaign.findFirst({
    where: { slug, active: true, protected: false },
    include: { tenant: true },
  });
  if (!campaign || !campaign.tenant) return {};
  return buildCampaignMetadata(campaign);
}

/**
 * Rota de alta velocidade para redirecionamento ao grupo de WhatsApp.
 * Busca o grupo ativo via cache Redis + Postgres e renderiza um componente
 * client-side que dispara o evento CompleteRegistration no Meta Pixel
 * antes de redirecionar.
 *
 * Se a campanha estiver protegida, redireciona para a rota protegida.
 */
export default async function RedirectPage({ params }: PageProps) {
  const { slug } = await params;

  // Buscar campanha (slug agora é único por tenant, não global)
  const campaign = await prisma.campaign.findFirst({
    where: { slug, active: true },
    select: { id: true, pixelId: true, gtmId: true, tenantId: true, protected: true, accessCode: true, customDomain: true },
  });

  if (!campaign) {
    notFound();
  }

  // Se a campanha está protegida, retornar 404 — o slug não existe mais
  if (campaign.protected && campaign.accessCode) {
    notFound();
  }

  // Se a campanha possui um domínio customizado, o slug padrão também é desativado
  if (campaign.customDomain) {
    notFound();
  }

  // Validação de assinatura do Tenant via subscription-guard (unificada)
  const subCheck = await enforceSubscription(campaign.tenantId);

  // Se não estiver permitido (grace period expirado), mostrar tela de bloqueio
  if (!subCheck.allowed) {
    return <BlockedPage slug={slug} />;
  }

  // Obter grupo ativo via rotacionador
  const group = await getActiveGroupForCampaign(campaign.id);

  return (
    <>
      {/* Meta Pixel — injeção + evento CompleteRegistration */}
      <MetaPixel
        pixelId={campaign.pixelId}
        trackEvent="CompleteRegistration"
        redirectUrl={group?.url}
      />

      {/* Google Tag Manager — injeção + evento join_group */}
      <GoogleTagManager
        gtmId={campaign.gtmId}
        trackEvent="join_group"
        redirectUrl={group?.url}
      />

      {/* Componente client que executa o redirect */}
      <RedirectClient groupUrl={group?.url ?? null} slug={slug} />
    </>
  );
}