import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import {
  LayoutTemplate,
  Eye,
  Repeat,
  Heart,
  Clock,
  CheckCircle2,
  XCircle,
  Ban,
  ExternalLink,
  Store,
  Calendar,
} from "lucide-react";
import { ResubmitButton } from "./resubmit-button";
import { TemplateActionsMenu } from "./template-actions-menu";
import { PublishButton } from "./publish-button";
import { DotGrid } from "@/components/ui/dot-grid";

export const metadata = {
  title: "Meus Templates — Vórtex+",
  robots: "noindex, nofollow",
};

const STATUS_CONFIG: Record<
  string,
  { label: string; icon: React.ReactNode; badge: string; dot: string }
> = {
  PUBLISHED: {
    label: "Publicado",
    icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />,
    badge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    dot: "bg-emerald-400",
  },
  PENDING_REVIEW: {
    label: "Em análise",
    icon: <Clock className="w-3.5 h-3.5 text-amber-400" />,
    badge: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    dot: "bg-amber-400",
  },
  REJECTED: {
    label: "Rejeitado",
    icon: <XCircle className="w-3.5 h-3.5 text-destructive" />,
    badge: "bg-destructive/10 text-destructive border-destructive/20",
    dot: "bg-destructive",
  },
  TAKEN_DOWN: {
    label: "Removido",
    icon: <Ban className="w-3.5 h-3.5 text-muted-foreground" />,
    badge: "bg-muted text-muted-foreground border-border/40",
    dot: "bg-muted-foreground",
  },
};

const CATEGORY_LABELS: Record<string, string> = {
  LANDING_PAGE: "Landing Page",
  SQUEEZE_PAGE: "Squeeze Page",
  WEBINAR: "Webinar",
  ECOMMERCE: "E-commerce",
  INFOPRODUCT: "Infoproduto",
  PORTFOLIO: "Portfólio",
  EVENT: "Evento",
  OTHER: "Outro",
};

export default async function MyTemplatesPage() {
  const session = await getSession();
  if (!session?.email || !session.userId || !session.tenantId) {
    redirect("/admin/login");
  }

  const [templates, campaigns] = await Promise.all([
    prisma.template.findMany({
      where: { authorId: session.userId },
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { likes: true, usages: true } },
        versions: {
          orderBy: { version: "desc" },
          take: 1,
          select: { rawHtml: true },
        },
      },
    }),
    prisma.campaign.findMany({
      where: { tenantId: session.tenantId },
      select: { id: true, name: true },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ]);

  const counts = {
    published: templates.filter((t) => t.status === "PUBLISHED").length,
    pending: templates.filter((t) => t.status === "PENDING_REVIEW").length,
    rejected: templates.filter((t) => t.status === "REJECTED").length,
  };

  return (
    <div className="mx-auto max-w-7xl w-full px-1 sm:px-0 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
            Meus Templates
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
            Gerencie, edite e acompanhe o status de publicação dos seus templates na comunidade.
          </p>
        </div>
        <div className="flex items-center gap-2.5 w-full sm:w-auto flex-wrap sm:flex-nowrap">
          <Link
            href="/templates"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-border/60 bg-card/60 backdrop-blur-md px-4 py-2.5 text-xs sm:text-sm font-semibold text-foreground hover:bg-muted/80 transition-all flex-1 sm:flex-initial shadow-sm"
          >
            <Store className="w-4 h-4 text-muted-foreground" />
            Explorar Galeria
          </Link>
          <PublishButton campaigns={campaigns} />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Publicados */}
        <div className="glass-panel rounded-2xl p-5 border border-emerald-500/20 bg-emerald-500/[0.02] flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-emerald-400 block mb-1 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Publicados
            </span>
            <p className="text-2xl font-extrabold text-foreground tabular-nums">
              {counts.published}
            </p>
          </div>
          <span className="text-[11px] text-muted-foreground">
            Disponíveis para a comunidade
          </span>
        </div>

        {/* Em Análise */}
        <div className="glass-panel rounded-2xl p-5 border border-amber-500/20 bg-amber-500/[0.02] flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-amber-400 block mb-1 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              Em Análise
            </span>
            <p className="text-2xl font-extrabold text-foreground tabular-nums">
              {counts.pending}
            </p>
          </div>
          <span className="text-[11px] text-muted-foreground">
            Aguardando aprovação
          </span>
        </div>

        {/* Rejeitados */}
        <div className="glass-panel rounded-2xl p-5 border border-destructive/20 bg-destructive/[0.02] flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-destructive block mb-1 flex items-center gap-1.5">
              <XCircle className="w-3.5 h-3.5" />
              Rejeitados
            </span>
            <p className="text-2xl font-extrabold text-foreground tabular-nums">
              {counts.rejected}
            </p>
          </div>
          <span className="text-[11px] text-muted-foreground">
            Requerem ajustes
          </span>
        </div>
      </div>

      {/* Lista de templates */}
      {templates.length === 0 ? (
        <div className="glass-panel rounded-2xl p-8 sm:p-16 text-center relative overflow-hidden">
          <DotGrid />
          <div className="relative z-10">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20 shadow-[0_0_25px_rgba(var(--primary),0.2)] mb-4 text-primary">
              <LayoutTemplate className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">Nenhum template publicado</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto text-xs sm:text-sm">
              Você ainda não enviou nenhum modelo. Transforme uma das suas páginas de campanha em um template reutilizável para a comunidade.
            </p>
            <PublishButton campaigns={campaigns} />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {templates.map((template) => {
            const status = STATUS_CONFIG[template.status] ?? STATUS_CONFIG.TAKEN_DOWN;
            const categoryLabel = CATEGORY_LABELS[template.category] ?? template.category;

            return (
              <div
                key={template.id}
                className="glass-panel rounded-2xl p-5 sm:p-6 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:border-primary/40 flex flex-col justify-between"
              >
                <div>
                  {/* Header do Card: Ícone, Nome e Ações */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-10 w-10 shrink-0 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center">
                        <LayoutTemplate className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-foreground truncate text-base" title={template.name}>
                          {template.name}
                        </h3>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(template.createdAt).toLocaleDateString("pt-BR")}
                          </span>
                          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-muted-foreground">
                            {categoryLabel}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider ${status.badge}`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${status.dot} ${
                            template.status === "PENDING_REVIEW" ? "animate-pulse" : ""
                          }`}
                        />
                        {status.label}
                      </span>

                      <TemplateActionsMenu
                        templateId={template.id}
                        status={template.status}
                        template={{
                          id: template.id,
                          name: template.name,
                          description: template.description,
                          category: template.category,
                          theme: template.theme,
                          tags: template.tags,
                          rawHtml: template.versions[0]?.rawHtml ?? "",
                        }}
                      />
                    </div>
                  </div>

                  {/* Descrição se houver */}
                  {template.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-4 leading-relaxed">
                      {template.description}
                    </p>
                  )}

                  {/* Métricas de Engajamento */}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground my-3">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-muted/60 border border-border/40 text-foreground font-semibold tabular-nums text-xs">
                      <Eye className="w-3.5 h-3.5 text-muted-foreground" />
                      {template.viewCount.toLocaleString("pt-BR")} views
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary/10 border border-primary/20 text-primary font-semibold tabular-nums text-xs">
                      <Repeat className="w-3.5 h-3.5" />
                      {template._count.usages.toLocaleString("pt-BR")} usos
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 font-semibold tabular-nums text-xs">
                      <Heart className="w-3.5 h-3.5" />
                      {template._count.likes.toLocaleString("pt-BR")} likes
                    </span>
                  </div>

                  {/* Motivo de Rejeição */}
                  {template.rejectionReason && (
                    <div className="mt-3 rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-xs text-destructive leading-relaxed">
                      <span className="font-bold">Motivo da recusa: </span>
                      {template.rejectionReason}
                    </div>
                  )}
                </div>

                {/* Footer do Card */}
                <div className="flex items-center justify-between mt-4 pt-3.5 border-t border-border/40">
                  <a
                    href={`/templates/${template.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
                    Ver Página Pública
                  </a>

                  {template.status === "REJECTED" && (
                    <ResubmitButton templateId={template.id} />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}