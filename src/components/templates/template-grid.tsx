"use client";

import { useRouter } from "next/navigation";
import { Heart, Eye, Copy, ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { GlowCard } from "@/components/ui/glow-card";

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


export function TemplateGrid({ templates, total, page, totalPages }: TemplateGridProps) {
  const router = useRouter();

  if (templates.length === 0) {
    return (
      <div className="text-center py-20 p-8 max-w-lg mx-auto border border-white/10 bg-black/60 backdrop-blur-xl">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4 shadow-[0_0_20px_rgba(99,102,241,0.2)]">
          <Copy className="w-8 h-8 text-primary" />
        </div>
        <h3 className="text-lg font-bold text-white">Nenhum template encontrado</h3>
        <p className="text-neutral-400 mt-2 text-sm leading-relaxed">
          Tente ajustar os filtros ou buscar por outros termos para encontrar modelos criados pela comunidade.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Count */}
      <div className="flex items-center justify-between mb-8">
        <p className="text-sm font-medium text-neutral-400">
          Mostrando <span className="font-bold text-white">{total}</span> {total === 1 ? "template" : "templates"}
        </p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {templates.map((template) => {
          return (
            <div
              key={template.id}
              onClick={() => router.push(`/templates/${template.slug}`)}
              className="group cursor-pointer block"
            >
              <GlowCard className="overflow-hidden border border-white/15 bg-black/70 backdrop-blur-xl shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-primary/40 hover:shadow-2xl hover:shadow-primary/10 flex flex-col h-full">
                {/* Preview Thumbnail */}
                <div className="relative aspect-[16/10] overflow-hidden bg-black flex items-center justify-center border-b border-white/10">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={template.thumbnailUrl || "/community-template-icon.png"}
                    alt={template.name}
                    className="w-full h-full object-cover object-top transform transition-transform duration-500 group-hover:scale-105"
                  />

                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-[2px]">
                    <span className="inline-flex items-center gap-2 rounded-full bg-white text-black px-4 py-2 text-xs font-bold transition-transform duration-200 hover:scale-105 shadow-xl">
                      Visualizar
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>

                  {/* Category & Theme Badges */}
                  <div className="absolute top-3 left-3 flex gap-1.5 z-10">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-black/70 text-white border border-white/10 backdrop-blur-md">
                      {labels[template.category] ?? template.category}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-primary/20 text-primary border border-primary/30 backdrop-blur-md">
                      {template.theme}
                    </span>
                  </div>
                </div>

                {/* Info */}
                <div className="p-5 flex-1 flex flex-col">
                  <h3 className="font-bold text-base text-white truncate group-hover:text-primary transition-colors duration-200">
                    {template.name}
                  </h3>
                  <p className="text-xs text-neutral-300 line-clamp-2 mt-1.5 leading-relaxed">
                    {template.description || "Template otimizado para lançamentos e captação de leads."}
                  </p>

                  {/* Author & Stats Footer */}
                  <div className="mt-auto pt-4 border-t border-white/10 flex items-center justify-between text-xs text-neutral-300">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-[10px] font-bold text-primary">
                        {template.author?.displayName?.[0] || template.author?.name?.[0] || "V"}
                      </div>
                      <span className="truncate max-w-[85px] font-medium text-neutral-100">
                        {template.author?.displayName || template.author?.name || "Comunidade"}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 font-mono tabular-nums">
                      <span className="flex items-center gap-1 hover:text-white transition-colors" title="Visualizações">
                        <Eye className="w-3.5 h-3.5 text-neutral-400" />
                        {template.viewCount}
                      </span>
                      <span className="flex items-center gap-1 hover:text-white transition-colors" title="Usos">
                        <Copy className="w-3.5 h-3.5 text-emerald-400" />
                        {template._count.usages}
                      </span>
                      <span className="flex items-center gap-1 hover:text-white transition-colors" title="Curtidas">
                        <Heart className="w-3.5 h-3.5 text-rose-400" />
                        {template._count.likes}
                      </span>
                    </div>
                  </div>
                </div>
              </GlowCard>
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
            className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm rounded-lg border border-white/10 bg-white/[0.04] text-neutral-200 hover:bg-white/10 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
          >
            <ChevronLeft className="w-4 h-4" />
            Anterior
          </button>

          <span className="text-sm text-neutral-400 px-4">
            Página {page} de {totalPages}
          </span>

          <button
            disabled={page >= totalPages}
            onClick={() => {
              const sp = new URLSearchParams(window.location.search);
              sp.set("page", String(page + 1));
              router.push(`/templates?${sp.toString()}`);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm rounded-lg border border-white/10 bg-white/[0.04] text-neutral-200 hover:bg-white/10 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
          >
            Próximo
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}