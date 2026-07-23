import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus, Megaphone, CheckCircle2, XCircle, Users, MessageCircle, ExternalLink } from "lucide-react";

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
    <div className="mx-auto max-w-7xl">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-foreground tracking-tight">Campanhas</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Gerencie suas campanhas de lançamento.
          </p>
        </div>
        <Link
          href="/admin/campaigns/new"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-md transition-all hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Nova Campanha
        </Link>
      </div>

      {campaigns.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-16 text-center bg-card/50">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
            <Megaphone className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium text-foreground mb-2">Nenhuma campanha encontrada</h3>
          <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
            Você ainda não criou nenhuma campanha. Clique no botão acima para começar seu primeiro lançamento.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {campaigns.map((campaign) => (
            <Link
              key={campaign.id}
              href={`/admin/campaigns/${campaign.id}`}
              className="group relative flex flex-col rounded-xl border border-border bg-card overflow-hidden shadow-sm transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:-translate-y-0.5"
            >
              {/* Status bar */}
              <div className={`h-1 w-full ${campaign.active ? "bg-primary" : "bg-muted-foreground/30"}`} />
              
              <div className="p-6 flex flex-col flex-1">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-card-foreground group-hover:text-primary transition-colors line-clamp-1">
                      {campaign.name}
                    </h3>
                    <div className="mt-1.5 inline-flex items-center gap-1.5 rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground font-mono">
                      <ExternalLink className="h-3 w-3" />
                      /{campaign.slug}
                    </div>
                  </div>
                  <div className="flex-shrink-0 ml-3">
                    {campaign.active ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Ativa
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                        <XCircle className="h-3.5 w-3.5" />
                        Inativa
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-auto grid grid-cols-2 gap-4 border-t border-border pt-4">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Leads</p>
                      <p className="text-lg font-bold text-card-foreground">{campaign._count.leads}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <MessageCircle className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Grupos</p>
                      <p className="text-lg font-bold text-card-foreground">{campaign._count.groups}</p>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
