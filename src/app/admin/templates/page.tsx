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
} from "lucide-react";
import { ResubmitButton } from "./resubmit-button";
import { TemplateActionsMenu } from "./template-actions-menu";
import { PublishButton } from "./publish-button";

export const metadata = {
  title: "Meus Templates — Vórtex+",
  robots: "noindex, nofollow",
};

const STATUS_CONFIG: Record<string, { label: string; icon: React.ReactNode; badge: string; dot: string }> = {
  PUBLISHED: {
    label: "Publicado",
    icon: <CheckCircle2 className="w-3.5 h-3.5" />,
    badge: "bg-green-500/10 text-green-500 border-green-500/20",
    dot: "bg-green-500",
  },
  PENDING_REVIEW: {
    label: "Em análise",
    icon: <Clock className="w-3.5 h-3.5" />,
    badge: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
    dot: "bg-yellow-500",
  },
  REJECTED: {
    label: "Rejeitado",
    icon: <XCircle className="w-3.5 h-3.5" />,
    badge: "bg-red-500/10 text-red-500 border-red-500/20",
    dot: "bg-red-500",
  },
  TAKEN_DOWN: {
    label: "Removido",
    icon: <Ban className="w-3.5 h-3.5" />,
    badge: "bg-gray-500/10 text-gray-400 border-gray-500/20",
    dot: "bg-gray-500",
  },
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
    <div className="flex flex-col gap-6 pb-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-card-foreground">Meus Templates</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Acompanhe o status de publicação dos seus templates
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/templates"
            className="inline-flex items-center justify-center gap-2 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            <Store className="w-4 h-4" />
            Explorar Templates
          </Link>
          <PublishButton campaigns={campaigns} />
        </div>
      </div>

      {/* Stats — stagger fade-in */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-panel rounded-xl p-4 animate-fade-in-up" style={{ animationDelay: "0ms" }}>
          <p className="text-sm text-muted-foreground">Publicados</p>
          <p className="text-2xl font-bold text-green-500 mt-1 tabular-nums">{counts.published}</p>
        </div>
        <div className="glass-panel rounded-xl p-4 animate-fade-in-up" style={{ animationDelay: "60ms" }}>
          <p className="text-sm text-muted-foreground">Em análise</p>
          <p className="text-2xl font-bold text-yellow-500 mt-1 tabular-nums">{counts.pending}</p>
        </div>
        <div className="glass-panel rounded-xl p-4 animate-fade-in-up" style={{ animationDelay: "120ms" }}>
          <p className="text-sm text-muted-foreground">Rejeitados</p>
          <p className="text-2xl font-bold text-red-500 mt-1 tabular-nums">{counts.rejected}</p>
        </div>
      </div>

      {/* Lista de templates */}
      {templates.length === 0 ? (
        <div className="glass-panel rounded-xl p-12 text-center animate-fade-in-up">
          <LayoutTemplate className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground">Você ainda não publicou nenhum template.</p>
          <p className="text-sm text-muted-foreground/70 mt-1">
            Clique em "Publicar novo template" para começar.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {templates.map((template, i) => {
            const status = STATUS_CONFIG[template.status] ?? STATUS_CONFIG.TAKEN_DOWN;
            return (
              <div
                key={template.id}
                className="glass-panel rounded-xl p-5 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-md hover:border-primary/20 animate-fade-in-up"
                style={{ animationDelay: `${Math.min(i * 40, 400)}ms` }}
              >
                {/* Header do card */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="h-9 w-9 shrink-0 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                      <LayoutTemplate className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-card-foreground truncate">{template.name}</h3>
                      <p className="text-xs text-muted-foreground">
                        {new Date(template.createdAt).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${status.badge}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${status.dot} ${template.status === "PENDING_REVIEW" ? "animate-pulse" : ""}`} />
                      {status.icon}
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

                {/* Métricas */}
                <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                  <span className="inline-flex items-center gap-1"><Eye className="w-3.5 h-3.5" /> {template.viewCount}</span>
                  <span className="inline-flex items-center gap-1"><Repeat className="w-3.5 h-3.5" /> {template._count.usages}</span>
                  <span className="inline-flex items-center gap-1"><Heart className="w-3.5 h-3.5" /> {template._count.likes}</span>
                </div>

                {/* Motivo de rejeição */}
                {template.rejectionReason && (
                  <div className="mt-3 rounded-lg border border-red-500/20 bg-red-500/5 p-2.5 text-xs text-red-500">
                    <span className="font-semibold">Motivo: </span>
                    {template.rejectionReason}
                  </div>
                )}

                {/* Ações */}
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/40">
                  <a
                    href={`/templates/${template.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Ver público
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