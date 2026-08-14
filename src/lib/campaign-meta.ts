import type { Metadata } from "next";

interface CampaignMetaSource {
  name: string;
  slug: string;
  metaTitle?: string | null;
  metaDescription?: string | null;
  ogImageUrl?: string | null;
  faviconUrl?: string | null;
  tenant: { plan?: string | null };
}

/** Apenas PRO e ULTRA podem personalizar a identidade do link. */
export function canCustomizeLink(plan: string | null | undefined): boolean {
  return plan === "PRO" || plan === "ULTRA";
}

/**
 * Monta a Metadata da página de campanha.
 * Se o tenant não for PRO/ULTRA (ou não preencheu os campos), cai no
 * branding padrão da Vórtex — comportamento atual preservado.
 * A URL é absoluta (necessária para OG no WhatsApp).
 */
export function buildCampaignMetadata(campaign: CampaignMetaSource): Metadata {
  const plan = campaign.tenant?.plan;
  const canCustomize = canCustomizeLink(plan);
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://vortexpages.online";
  const pageUrl = `${baseUrl}/${campaign.slug}`;

  const title = canCustomize && campaign.metaTitle ? campaign.metaTitle : "Vórtex+ — Gerenciador de Lançamentos";
  const description =
    canCustomize && campaign.metaDescription
      ? campaign.metaDescription
      : "Plataforma de captação de leads com rotação automática de grupos WhatsApp.";
  const ogImage =
    canCustomize && campaign.ogImageUrl
      ? campaign.ogImageUrl
      : `${baseUrl}/web-app-manifest-512x512.png`;
  const favicon =
    canCustomize && campaign.faviconUrl ? campaign.faviconUrl : undefined;

  return {
    title,
    description,
    ...(favicon
      ? {
          icons: {
            icon: [{ url: favicon }],
          },
        }
      : {}),
    openGraph: {
      title,
      description,
      url: pageUrl,
      images: [
        {
          url: ogImage,
          alt: campaign.metaTitle || campaign.name,
        },
      ],
    },
  };
}