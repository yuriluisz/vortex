import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getActiveGroupForCampaign } from "@/lib/rotator";
import MetaPixel from "@/components/MetaPixel";
import RedirectClient from "@/app/[slug]/redirect/RedirectClient";
import BlockedPage from "@/components/BlockedPage";
import { enforceSubscription } from "@/lib/subscription-guard";

interface PageProps {
  params: Promise<{ code: string }>;
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
    select: { id: true, pixelId: true, tenantId: true, slug: true },
  });

  if (!campaign) {
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

      {/* Componente client que executa o redirect */}
      <RedirectClient groupUrl={group?.url ?? null} slug={campaign.slug} />
    </>
  );
}