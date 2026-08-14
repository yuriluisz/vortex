import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getActiveGroupForCampaign } from "@/lib/rotator";
import MetaPixel from "@/components/MetaPixel";
import RedirectClient from "../../../[slug]/redirect/RedirectClient";
import BlockedPage from "@/components/BlockedPage";
import { enforceSubscription } from "@/lib/subscription-guard";
import { buildCampaignMetadata } from "@/lib/campaign-meta";

interface PageProps {
  params: Promise<{ hostname: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
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
  if (!campaign || !campaign.tenant) return {};
  return buildCampaignMetadata(campaign);
}

export default async function DomainRedirectPage({ params }: PageProps) {
  const rawHost = await params;
  const cleanHost = decodeURIComponent(rawHost.hostname)
    .toLowerCase()
    .trim()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "");

  // Buscar campanha pelo domínio customizado
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
    select: { id: true, pixelId: true, tenantId: true, protected: true, accessCode: true, slug: true },
  });

  if (!campaign) {
    notFound();
  }

  // Se a campanha está protegida, retornar 404 — o domínio customizado não expõe acesso direto
  if (campaign.protected && campaign.accessCode) {
    notFound();
  }

  // Validação de assinatura do Tenant
  const subCheck = await enforceSubscription(campaign.tenantId);

  // Se não estiver permitido OU se o plano for diferente de ULTRA
  if (!subCheck.allowed || subCheck.planEffective !== "ULTRA") {
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
      <RedirectClient groupUrl={group?.url ?? null} slug="/" />
    </>
  );
}
