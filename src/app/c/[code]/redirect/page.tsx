import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getActiveGroupForCampaign } from "@/lib/rotator";
import MetaPixel from "@/components/MetaPixel";
import GoogleTagManager from "@/components/GoogleTagManager";
import RedirectClient from "@/app/[slug]/redirect/RedirectClient";
import BlockedPage from "@/components/BlockedPage";
import { enforceSubscription } from "@/lib/subscription-guard";
import { buildCampaignMetadata } from "@/lib/campaign-meta";

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

/**
 * Rota protegida de redirecionamento ao grupo de WhatsApp.
 * Acessível apenas pelo accessCode (campanha protegida).
 */
export default async function ProtectedRedirectPage({ params }: PageProps) {
  const { code } = await params;

  // Buscar campanha pelo accessCode
  const campaign = await prisma.campaign.findFirst({
    where: { accessCode: code, active: true },
    select: { id: true, pixelId: true, gtmId: true, tenantId: true, slug: true, protected: true },
  });

  if (!campaign || !campaign.protected) {
    notFound();
  }

  // Validação de assinatura do Tenant via subscription-guard (unificada)
  const subCheck = await enforceSubscription(campaign.tenantId);

  // Se não estiver permitido (grace period expirado), mostrar tela de bloqueio
  if (!subCheck.allowed) {
    return <BlockedPage slug={campaign.slug} />;
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
      <RedirectClient groupUrl={group?.url ?? null} slug={campaign.slug} />
    </>
  );
}