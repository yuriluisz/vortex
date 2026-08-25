import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { decrypt } from "@/lib/session";
import { redirect } from "next/navigation";
import type { TemplateStatus } from "@prisma/client";
import { LayoutTemplate, ExternalLink, Eye, Repeat, Heart } from "lucide-react";
import Link from "next/link";
import { ReviewButton } from "./review-button";
import { TemplateActions } from "./template-actions";

export const metadata = {
  title: "Moderação de Templates — Vórtex+",
  robots: "noindex, nofollow",
};

const COOKIE_NAME = "vortex_admin_session";

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

const STATUS_LABELS: Record<string, string> = {
  PENDING_REVIEW: "Pendente",
  PUBLISHED: "Publicado",
  REJECTED: "Rejeitado",
  TAKEN_DOWN: "Removido",
  DRAFT: "Rascunho",
};

const STATUS_COLORS: Record<string, string> = {
  PENDING_REVIEW: "bg-chart-4/10 text-chart-4",
  PUBLISHED: "bg-chart-1/10 text-chart-1",
  REJECTED: "bg-destructive/10 text-destructive",
  TAKEN_DOWN: "bg-muted text-muted-foreground",
  DRAFT: "bg-muted text-muted-foreground",
};

interface PageProps {
  searchParams: Promise<{ status?: string }>;
}

export default async function SuperAdminTemplatesPage({ searchParams }: PageProps) {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(COOKIE_NAME)?.value;
  const session = await decrypt(cookie);

  if (!session?.email || session.role !== "SUPER_ADMIN") {
    redirect("/admin");
  }

  const params = await searchParams;
  const statusFilter = params.status || "PENDING_REVIEW";

  const validStatuses: TemplateStatus[] = ["PENDING_REVIEW", "PUBLISHED", "REJECTED", "TAKEN_DOWN"];
  const status: TemplateStatus = (validStatuses as string[]).includes(statusFilter)
    ? (statusFilter as TemplateStatus)
    : "PENDING_REVIEW";

  const [templates, counts] = await Promise.all([
    prisma.template.findMany({
      where: { status },
      orderBy: { createdAt: "desc" },
      include: {
        author: {
          select: { id: true, email: true, displayName: true, handle: true, templateBlocked: true },
        },
        versions: {
          orderBy: { version: "desc" },
          take: 1,
        },
        _count: { select: { likes: true, usages: true } },
      },
    }),
    prisma.template.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
  ]);

  const countMap: Record<string, number> = {};
  counts.forEach((c) => (countMap[c.status] = c._count._all));

  const tabs = [
    { key: "PENDING_REVIEW", label: "Pendentes", count: countMap.PENDING_REVIEW ?? 0 },
    { key: "PUBLISHED", label: "Publicados", count: countMap.PUBLISHED ?? 0 },
    { key: "REJECTED", label: "Rejeitados", count: countMap.REJECTED ?? 0 },
    { key: "TAKEN_DOWN", label: "Removidos", count: countMap.TAKEN_DOWN ?? 0 },
  ];

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <LayoutTemplate className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Moderação de Templates</h1>
            <p className="text-sm text-muted-foreground">
              Acompanhe, aprove e monitore todos os templates da comunidade
            </p>
          </div>
        </div>
        <div className="mt-4">
          <Link href="/admin/super" className="text-sm text-primary hover:text-primary/80 transition-colors">
            ← Voltar ao painel
          </Link>
        </div>
      </div>

      {/* Tabs por status */}
      <div className="mb-6 flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <Link
            key={tab.key}
            href={`/admin/super/templates?status=${tab.key}`}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
              status === tab.key
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {tab.label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${
              status === tab.key ? "bg-white/20" : "bg-background"
            }`}>
              {tab.count}
            </span>
          </Link>
        ))}
      </div>

      {/* Lista de templates */}
      {templates.length === 0 ? (
        <div className="glass-panel rounded-2xl p-12 text-center">
          <p className="text-muted-foreground">
            Nenhum template com status {"\u201C"}{STATUS_LABELS[status]}{"\u201D"}.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {templates.map((template) => (
            <div key={template.id} className="glass-panel rounded-2xl p-5">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h2 className="text-lg font-semibold">{template.name}</h2>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[template.status]}`}>
                      {STATUS_LABELS[template.status]}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                      {CATEGORY_LABELS[template.category] ?? template.category}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                      {template.theme}
                    </span>
                  </div>

                  <p className="text-sm text-muted-foreground">
                    Autor:{" "}
                    <span className="font-medium text-foreground">
                      {template.author.displayName || template.author.email}
                    </span>
                    {template.author.handle && (
                      <span className="text-muted-foreground"> @{template.author.handle}</span>
                    )}
                  </p>

                  {template.description && (
                    <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{template.description}</p>
                  )}

                  {/* Métricas */}
                  <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5" /> {template.viewCount} views
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Repeat className="w-3.5 h-3.5" /> {template._count.usages} usos
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Heart className="w-3.5 h-3.5" /> {template._count.likes} curtidas
                    </span>
                    <span>
                      Enviado: {new Date(template.createdAt).toLocaleDateString("pt-BR")}
                    </span>
                  </div>

                  {template.rejectionReason && (
                    <p className="mt-2 text-xs text-destructive bg-destructive/5 border border-destructive/20 rounded-lg p-2">
                      Motivo: {template.rejectionReason}
                    </p>
                  )}
                </div>

                {/* Ações */}
                <div className="flex flex-col gap-2 sm:items-end shrink-0">
                  {template.status === "PENDING_REVIEW" ? (
                    <ReviewButton slug={template.slug} templateId={template.id} />
                  ) : (
                    <a
                      href={`/templates/${template.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Preview
                    </a>
                  )}
                  <TemplateActions
                    templateId={template.id}
                    authorId={template.author.id}
                    authorEmail={template.author.email}
                    authorName={template.author.displayName || template.author.email}
                    status={template.status}
                    isAuthorBlocked={template.author.templateBlocked}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}