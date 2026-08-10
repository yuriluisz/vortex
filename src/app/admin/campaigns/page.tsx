import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus, Megaphone, CheckCircle2, XCircle, Users, MessageCircle, ExternalLink } from "lucide-react";
import { GlowCard } from "@/components/ui/glow-card";
import { DotGrid } from "@/components/ui/dot-grid";

export default async function CampaignsPage() {
  const session = await getSession();
  if (!session?.email || !session.tenantId) {
    redirect("/admin/login");
  }

  const campaigns = await prisma.campaign.findMany({
    where: { tenantId: session.tenantId },
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { leads: true, groups: true },
      },
    },
  });

  return (
    <div className="mx-auto max-w-7xl w-full px-1 sm:px-0">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-foreground tracking-tight">Campanhas</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Gerencie suas campanhas de lançamento.
          </p>
        </div>
        <Link
          href="/admin/campaigns/new"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-[0_0_15px_rgba(var(--primary),0.4)] transition-all hover:bg-primary/90 hover:scale-105 active:scale-[0.97]"
        >
          <Plus className="h-4 w-4" />
          Nova Campanha
        </Link>
      </div>

      {campaigns.length === 0 ? (
        <div className="glass-panel rounded-xl p-8 sm:p-16 text-center relative overflow-hidden">
          <DotGrid />
          <div className="relative z-10">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 shadow-[0_0_20px_rgba(var(--primary),0.2)] mb-4">
              <Megaphone className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Nenhuma campanha encontrada</h3>
            <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
              Você ainda não criou nenhuma campanha. Clique no botão acima para começar seu primeiro lançamento.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {campaigns.map((campaign) => (
            <Link key={campaign.id} href={`/admin/campaigns/${campaign.id}`} className="group block">
              <GlowCard className="flex flex-col rounded-xl border border-border/50 bg-card/40 backdrop-blur-sm overflow-hidden shadow-sm h-full transition-all duration-300">
                {/* Status bar */}
                <div className={`h-1 w-full ${campaign.active ? "bg-primary shadow-[0_0_8px_rgba(var(--primary),0.8)]" : "bg-muted-foreground/30"}`} />
                
                <div className="p-4 sm:p-6 flex flex-col flex-1 relative z-10">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                        {campaign.name}
                      </h3>
                      <div className="mt-1.5 inline-flex items-center gap-1.5 rounded-md bg-white/5 border border-white/10 px-2 py-0.5 text-xs font-medium text-muted-foreground font-mono">
                        <ExternalLink className="h-3 w-3" />
                        /{campaign.slug}
                      </div>
                    </div>
                    <div className="flex-shrink-0 ml-3">
                      {campaign.active ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-primary/20 border border-primary/30 px-2.5 py-1 text-[10px] font-bold text-primary uppercase tracking-wider shadow-[0_0_10px_rgba(var(--primary),0.2)]">
                          <CheckCircle2 className="h-3 w-3" />
                          Ativa
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-muted/50 border border-muted px-2.5 py-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                          <XCircle className="h-3 w-3" />
                          Inativa
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-auto grid grid-cols-2 gap-4 border-t border-border/50 pt-4">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-chart-2/10 text-chart-2">
                        <Users className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">Leads</p>
                        <p className="text-lg font-bold text-foreground">{campaign._count.leads}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-chart-3/10 text-chart-3">
                        <MessageCircle className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">Grupos</p>
                        <p className="text-lg font-bold text-foreground">{campaign._count.groups}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </GlowCard>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
