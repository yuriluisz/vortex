"use client";

import { useRouter } from "next/navigation";
import { Heart, Eye, Copy, ChevronLeft, ChevronRight } from "lucide-react";
import { TemplatePreview } from "./template-preview";

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
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-muted-foreground">
          {total} {total === 1 ? "template encontrado" : "templates encontrados"}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {templates.map((template) => (
          <div
            key={template.id}
            className="group cursor-pointer overflow-hidden rounded-xl border border-border/40 bg-card hover:shadow-lg transition-all duration-300"
            onClick={() => router.push(`/templates/${template.slug}`)}
          >
            {/* Preview */}
            <div className="aspect-[4/3] relative overflow-hidden bg-muted">
              <TemplatePreview
                templateId={template.id}
                slug={template.slug}
                name={template.name}
              />
              {/* Overlay com ações */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-3">
                <a
                  href={`/templates/${template.slug}`}
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center justify-center px-4 py-1.5 text-sm bg-white text-black rounded-md hover:bg-gray-100 transition-colors"
                >
                  Visualizar
                </a>
              </div>
              {/* Badges */}
              <div className="absolute top-2 left-2 flex gap-1">
                <span className="text-xs px-1.5 py-0.5 rounded bg-black/60 text-white">
                  {template.category === "LANDING_PAGE" ? "Landing Page" : template.category}
                </span>
                <span className="text-xs px-1.5 py-0.5 rounded bg-black/40 text-white">
                  {template.theme}
                </span>
              </div>
            </div>

            {/* Info */}
            <div className="p-4">
              <h3 className="font-semibold truncate">{template.name}</h3>
              {template.description && (
                <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                  {template.description}
                </p>
              )}
            </div>

            <div className="px-4 pb-4 pt-0 flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <div className="w-5 h-5 rounded-full bg-muted-foreground/20 flex items-center justify-center text-[10px] font-medium">
                  {template.author?.displayName?.[0] ?? "?"}
                </div>
                <span>{template.author?.displayName ?? "Anônimo"}</span>
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
        ))}
      </div>

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <button
            disabled={page <= 1}
            onClick={() => {
              const sp = new URLSearchParams(window.location.search);
              sp.set("page", String(page - 1));
              router.push(`/templates?${sp.toString()}`);
            }}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm rounded-md border border-border hover:bg-muted disabled:opacity-50 transition-colors"
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
            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm rounded-md border border-border hover:bg-muted disabled:opacity-50 transition-colors"
          >
            Próximo
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}