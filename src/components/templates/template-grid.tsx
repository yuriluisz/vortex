"use client";

import { useRouter } from "next/navigation";
import { Heart, Eye, Copy, ChevronLeft, ChevronRight } from "lucide-react";

interface TemplateGridProps {
  templates: Array<{
    id: string;
    slug: string;
    name: string;
    description: string | null;
    thumbnailUrl: string | null;
    category: string;
    theme: string;
    primaryColor: string | null;
    viewCount: number;
    useCount: number;
    likeCount: number;
    createdAt: Date;
    author: {
      id: string;
      handle: string | null;
      displayName: string | null;
      name: string | null;
      avatarUrl: string | null;
    } | null;
    _count: {
      likes: number;
      usages: number;
    };
  }>;
  total: number;
  page: number;
  totalPages: number;
}

const labels: Record<string, string> = {
  LANDING_PAGE: "Landing Page",
  SQUEEZE_PAGE: "Squeeze Page",
  WEBINAR: "Webinar",
  ECOMMERCE: "E-commerce",
  INFOPRODUCT: "Infoproduto",
  PORTFOLIO: "Portfólio",
  EVENT: "Evento",
  OTHER: "Outro",
};

const gradients: Record<string, string> = {
  DARK: "from-gray-900 to-gray-700",
  LIGHT: "from-slate-100 to-slate-300",
  COLORFUL: "from-violet-600 to-pink-500",
};

export function TemplateGrid({ templates, total, page, totalPages }: TemplateGridProps) {
  const router = useRouter();

  if (templates.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
          <Copy className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium">Nenhum template encontrado</h3>
        <p className="text-muted-foreground mt-1">
          Tente ajustar os filtros ou buscar por outros termos.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Count */}
      <div className="flex items-center justify-between mb-8">
        <p className="text-sm text-muted-foreground">
          {total} {total === 1 ? "template encontrado" : "templates encontrados"}
        </p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {templates.map((template) => {
          const gradient = gradients[template.theme] || "from-muted to-muted/80";
          const emojiMap: Record<string, string> = {
            EVENT: "🎉",
            ECOMMERCE: "🛒",
            LANDING_PAGE: "📄",
            SQUEEZE_PAGE: "📧",
            WEBINAR: "🎥",
            INFOPRODUCT: "📚",
            PORTFOLIO: "💼",
            OTHER: "✨",
          };

          return (
            <div
              key={template.id}
              onClick={() => router.push(`/templates/${template.slug}`)}
              className="group cursor-pointer overflow-hidden rounded-xl border border-border/40 bg-card hover:shadow-xl hover:shadow-primary/5 hover:border-primary/20 transition-all duration-300 hover:-translate-y-1"
            >
              {/* Preview Placeholder */}
              <div className={`relative aspect-[4/3] overflow-hidden bg-gradient-to-br ${gradient}`}>
                {/* Centered emoji */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-6xl opacity-40">{emojiMap[template.category] ?? "✨"}</span>
                </div>

                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <a
                    href={`/templates/${template.slug}`}
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-2 rounded-lg bg-white text-black px-4 py-2 text-sm font-medium transition-transform duration-200 hover:scale-105 active:scale-95"
                  >
                    Visualizar
                  </a>
                </div>

                {/* Badges */}
                <div className="absolute top-2 left-2 flex gap-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full bg-black/60 text-white backdrop-blur-sm">
                    {labels[template.category] ?? template.category}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full bg-black/40 text-white/80 backdrop-blur-sm">
                    {template.theme}
                  </span>
                </div>
              </div>

              {/* Info */}
              <div className="p-4">
                <h3 className="font-semibold truncate group-hover:text-primary transition-colors duration-200">
                  {template.name}
                </h3>
                {template.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2 mt-1 leading-relaxed">
                    {template.description}
                  </p>
                )}
              </div>

              {/* Footer */}
              <div className="px-4 pb-4 pt-0 flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded-full bg-muted-foreground/20 flex items-center justify-center text-[10px] font-medium text-muted-foreground">
                    {template.author?.displayName?.[0] ?? "?"}
                  </div>
                  <span className="truncate max-w-[80px]">
                    {template.author?.displayName ?? template.author?.name ?? "Anônimo"}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    {template.viewCount}
                  </span>
                  <span className="flex items-center gap-1">
                    <Copy className="w-3 h-3" />
                    {template._count.usages}
                  </span>
                  <span className="flex items-center gap-1">
                    <Heart className="w-3 h-3" />
                    {template._count.likes}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-12">
          <button
            disabled={page <= 1}
            onClick={() => {
              const sp = new URLSearchParams(window.location.search);
              sp.set("page", String(page - 1));
              router.push(`/templates?${sp.toString()}`);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm rounded-lg border border-border hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            <ChevronLeft className="w-4 h-4" />
            Anterior
          </button>

          <span className="text-sm text-muted-foreground px-4">
            Página {page} de {totalPages}
          </span>

          <button
            disabled={page >= totalPages}
            onClick={() => {
              const sp = new URLSearchParams(window.location.search);
              sp.set("page", String(page + 1));
              router.push(`/templates?${sp.toString()}`);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm rounded-lg border border-border hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            Próximo
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}