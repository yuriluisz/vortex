import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getActiveGroupForCampaign } from "@/lib/rotator";

interface PageProps {
  params: Promise<{ slug: string }>;
}

/**
 * Rota de alta velocidade para redirecionamento ao grupo de WhatsApp.
 * Busca o grupo ativo via cache Redis + Postgres e redireciona (HTTP 307).
 */
export default async function RedirectPage({ params }: PageProps) {
  const { slug } = await params;

  // Buscar campanha (slug agora é único por tenant, não global)
  const campaign = await prisma.campaign.findFirst({
    where: { slug, active: true },
    select: { id: true, slug: true },
  });

  if (!campaign) {
    notFound();
  }

  // Obter grupo ativo via rotacionador
  const group = await getActiveGroupForCampaign(campaign.id);

  if (group) {
    // Redirecionar para o grupo de WhatsApp
    redirect(group.url);
  }

  // Fallback: sem grupos disponíveis
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <div className="mb-6 text-6xl">⏳</div>
        <h1 className="text-2xl font-bold text-foreground">
          Grupos temporariamente indisponíveis
        </h1>
        <p className="mt-3 text-muted-foreground">
          Todos os grupos desta campanha estão cheios no momento.
          Tente novamente em alguns instantes.
        </p>
        <a
          href={`/${slug}`}
          className="mt-6 inline-block rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-all duration-200 hover:bg-primary/90"
        >
          Voltar à página
        </a>
      </div>
    </div>
  );
}
