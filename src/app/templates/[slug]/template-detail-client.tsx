"use client";

import { useState } from "react";
import { Heart, Eye, Copy, ArrowLeft, Maximize2, X } from "lucide-react";
import Link from "next/link";
import { TemplatePreview } from "@/components/templates/template-preview";
import { TemplateUseButton } from "@/components/templates/template-use-button";
import VortexFooter from "@/components/VortexFooter";

interface TemplateDetailClientProps {
  template: {
    id: string;
    slug: string;
    name: string;
    description: string | null;
    category: string;
    theme: string;
    tags: string[];
    viewCount: number;
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
  };
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

export default function TemplateDetailClient({ template }: TemplateDetailClientProps) {
  const [showFullscreen, setShowFullscreen] = useState(false);

  // Detectar tema para adaptar o botão de fechar
  const isDarkTheme = template.theme === "DARK";
  const closeBtnClass = isDarkTheme
    ? "bg-white/10 text-white hover:bg-white/20"
    : "bg-black/10 text-black hover:bg-black/20";

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header minimalista */}
      <div className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 py-3 bg-black/80 backdrop-blur-md border-b border-white/10">
        <Link
          href="/templates"
          className="inline-flex items-center gap-2 text-sm text-neutral-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Link>
        <button
          onClick={() => setShowFullscreen(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 active:scale-[0.97]"
        >
          <Maximize2 className="w-4 h-4" />
          Tela cheia
        </button>
      </div>

      {/* Preview grande — modo teatro (ocupa todo o espaço) */}
      <div className="pt-16" style={{ height: "calc(100vh - 56px)" }}>
        <div className="relative w-full h-full">
          {/* Container do preview com hover overlay */}
          <div className="group relative w-full h-full overflow-hidden bg-black">
            <TemplatePreview
              templateId={template.id}
              slug={template.slug}
              name={template.name}
            />
            
            {/* Hover overlay com botão tela cheia */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-300 pointer-events-none">
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-auto">
                <button
                  onClick={() => setShowFullscreen(true)}
                  className="inline-flex items-center gap-2 rounded-full bg-white text-black px-6 py-3 text-sm font-semibold shadow-xl transition-transform hover:scale-105 active:scale-95"
                >
                  <Maximize2 className="w-5 h-5" />
                  Ver em tela cheia
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Informações compactas abaixo */}
      <div className="border-t border-white/10 bg-black/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 py-6">
          {/* Linha principal */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white border border-white/10">
                  {labels[template.category] ?? template.category}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white border border-white/10">
                  {template.theme}
                </span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-white">{template.name}</h1>
            </div>
            <TemplateUseButton templateSlug={template.slug} templateName={template.name} />
          </div>

          {/* Descrição */}
          {template.description && (
            <p className="text-sm text-neutral-300 leading-relaxed mb-4">
              {template.description}
            </p>
          )}

          {/* Autor + Stats */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-white/10">
            {/* Autor */}
            {template.author && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-sm font-bold text-primary">
                  {template.author.displayName?.[0] ?? "?"}
                </div>
                <div>
                  <div className="text-sm font-medium text-white">{template.author.displayName ?? template.author.name ?? "Autor anônimo"}</div>
                  {template.author.handle && (
                    <Link
                      href={`/community/${template.author.handle}`}
                      className="text-xs text-neutral-300 hover:text-white transition-colors"
                    >
                      @{template.author.handle}
                    </Link>
                  )}
                </div>
              </div>
            )}

            {/* Stats */}
            <div className="flex items-center gap-6 text-xs text-neutral-300 font-mono">
              <span className="flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-neutral-400" />
                {template.viewCount}
              </span>
              <span className="flex items-center gap-1.5">
                <Copy className="w-3.5 h-3.5 text-emerald-400" />
                {template._count.usages}
              </span>
              <span className="flex items-center gap-1.5">
                <Heart className="w-3.5 h-3.5 text-rose-400" />
                {template._count.likes}
              </span>
            </div>
          </div>

          {/* Tags */}
          {template.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {template.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs px-2.5 py-1 rounded-full bg-white/[0.05] border border-white/10 text-neutral-300"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Rodapé Vórtex padrão — denúncia como template */}
      <VortexFooter
        campaignSlug={template.slug}
        campaignName={template.name}
        tenantSlug={template.author?.handle ?? "template"}
        contentType="template"
      />

      {/* Modal Fullscreen */}
      {showFullscreen && (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
          {/* Close button — adaptativo ao tema */}
          <button
            onClick={() => setShowFullscreen(false)}
            className={`absolute top-4 right-4 z-10 rounded-full p-2.5 shadow-lg transition-colors ${closeBtnClass}`}
          >
            <X className="w-6 h-6" />
          </button>
          
          {/* Fullscreen iframe */}
          <div className="w-full h-full bg-white rounded-xl overflow-hidden">
            <iframe
              src={`/api/templates/${template.slug}/preview`}
              title={template.name}
              className="w-full h-full border-0"
              sandbox="allow-scripts"
            />
          </div>
        </div>
      )}
    </div>
  );
}