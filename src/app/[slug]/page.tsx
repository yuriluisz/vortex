import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Script from "next/script";
import HtmlRenderer from "./HtmlRenderer";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function CampaignPage({ params }: PageProps) {
  const { slug } = await params;

  // Buscar campanha pelo slug (agora slug é único por tenant, não global)
  const campaign = await prisma.campaign.findFirst({
    where: { slug, active: true },
  });

  if (!campaign) {
    notFound();
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
      {/* Meta Pixel — injeção dinâmica */}
      {campaign.pixelId && (
        <Script
          id="meta-pixel"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '${campaign.pixelId}');
              fbq('track', 'PageView');
            `,
          }}
        />
      )}

      {/* Renderizar HTML customizado com slot do formulário */}
      <HtmlRenderer
        rawHtml={campaign.rawHtml}
        campaignId={campaign.id}
        slug={campaign.slug}
        formSchema={formSchema}
      />
    </>
  );
}
