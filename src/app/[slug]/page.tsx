import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Script from "next/script";
import HtmlRenderer from "./HtmlRenderer";

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

  // Validação de assinatura do Tenant
  const { subscriptionStatus, trialEndsAt } = campaign.tenant;
  let isBlocked = false;

  if (subscriptionStatus === "PAST_DUE") {
    isBlocked = true;
  } else if (subscriptionStatus === "TRIAL" && trialEndsAt) {
    if (new Date() > new Date(trialEndsAt)) {
      isBlocked = true;
    }
  }

  if (isBlocked) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 text-gray-800 p-4">
        <div className="text-center max-w-md">
          <h1 className="text-3xl font-bold mb-2">Página Indisponível</h1>
          <p className="text-gray-500">
            A conta responsável por esta página encontra-se com restrições administrativas.
          </p>
        </div>
      </div>
    );
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
