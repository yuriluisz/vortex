import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { notFound, redirect } from "next/navigation";
import { checkCampaignAccess } from "@/lib/permissions";
import Link from "next/link";
import { Crown, ArrowRight, Video, Flame, ShieldAlert } from "lucide-react";
import RecordingsClient from "./RecordingsClient";

export default async function CampaignRecordingsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session?.email || !session.tenantId) {
    redirect("/admin/login");
  }

  const { id } = await params;
  const access = await checkCampaignAccess(id, session.userId, session.tenantId);
  if (!access.allowed) {
    notFound();
  }

  const campaign = await prisma.campaign.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      slug: true,
      rawHtml: true,
      tenantId: true,
      sessionRecordingEnabled: true,
    },
  });

  if (!campaign) {
    notFound();
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: campaign.tenantId },
    select: { plan: true },
  });

  // Guard de Plano: Exclusivo ULTRA
  const isUltra = tenant?.plan === "ULTRA";

  if (!isUltra) {
    return (
      <div className="mx-auto max-w-3xl py-10 px-4">
        <div className="relative overflow-hidden rounded-3xl border border-primary/30 bg-gradient-to-b from-primary/10 via-card to-card p-8 sm:p-12 text-center shadow-2xl">
          <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 bg-primary/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="inline-flex p-4 rounded-3xl bg-primary/15 text-primary border border-primary/20 mb-6 shadow-inner">
            <Crown className="h-10 w-10 text-primary" />
          </div>

          <h3 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
            Gravação de Sessões & Mapa de Calor
          </h3>

          <p className="mt-3 text-sm sm:text-base text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Descubra por que seus anúncios do Meta Ads não estão convertendo. Assista aos replays de
            tela de cada visitante e visualize onde as pessoas tocam no celular com o Mapa de Calor.
          </p>

          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-md mx-auto text-left">
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-background/60 border border-border/50 text-xs font-medium text-foreground">
              <Video className="h-4 w-4 text-primary shrink-0" />
              <span>Replay de tela em tempo real</span>
            </div>
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-background/60 border border-border/50 text-xs font-medium text-foreground">
              <Flame className="h-4 w-4 text-orange-400 shrink-0" />
              <span>Mapa térmico de toques e cliques</span>
            </div>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/admin/settings/checkout"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-all shadow-lg shadow-primary/25"
            >
              Fazer Upgrade para o Plano ULTRA
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <p className="mt-4 text-xs text-muted-foreground flex items-center justify-center gap-1.5">
            <ShieldAlert className="h-3.5 w-3.5" />
            Disponível exclusivamente para membros ULTRA com armazenamento Cloudflare R2
          </p>
        </div>
      </div>
    );
  }

  // Buscar sessões e pontos dos últimos 7 dias
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const [sessions, totalHeatmapClicks] = await Promise.all([
    prisma.sessionRecording.findMany({
      where: {
        campaignId: id,
        tenantId: campaign.tenantId,
        createdAt: { gte: sevenDaysAgo },
      },
      orderBy: { createdAt: "desc" },
      take: 80,
    }),
    prisma.heatmapClick.count({
      where: {
        campaignId: id,
        createdAt: { gte: sevenDaysAgo },
      },
    }),
  ]);

  const serializedSessions = sessions.map((s) => ({
    id: s.id,
    sessionId: s.sessionId,
    duration: s.duration,
    clicksCount: s.clicksCount,
    device: s.device,
    browser: s.browser,
    os: s.os,
    pageUrl: s.pageUrl,
    utmSource: s.utmSource,
    utmMedium: s.utmMedium,
    utmCampaign: s.utmCampaign,
    createdAt: s.createdAt.toISOString(),
  }));

  return (
    <RecordingsClient
      campaign={{
        id: campaign.id,
        name: campaign.name,
        slug: campaign.slug,
        rawHtml: campaign.rawHtml,
        sessionRecordingEnabled: campaign.sessionRecordingEnabled,
      }}
      initialSessions={serializedSessions}
      totalHeatmapClicks={totalHeatmapClicks}
    />
  );
}
