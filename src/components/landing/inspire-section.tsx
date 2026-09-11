"use client";

import Link from "next/link";
import { ArrowRight, Copy, Heart } from "lucide-react";
import { GlowCard } from "@/components/ui/glow-card";
import { Reveal } from "@/components/ui/reveal";

export interface TemplateDisplayItem {
  id?: string;
  slug?: string;
  name: string;
  category?: string;
  theme?: string;
  description?: string | null;
  thumbnailUrl?: string | null;
  primaryColor?: string | null;
}

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

const THEME_LABELS: Record<string, string> = {
  LIGHT: "Claro",
  DARK: "Escuro",
  COLORFUL: "Colorido",
};

const DEFAULT_TEMPLATES: TemplateDisplayItem[] = [
  {
    name: "Dark Evento Exclusivo",
    category: "Evento",
    theme: "Escuro",
    description: "Tema imersivo de alta conversão para masterclasses e lançamentos.",
  },
  {
    name: "Light Clean Mentoria",
    category: "Mentoria",
    theme: "Claro",
    description: "Layout espaçoso e moderno focado em autoridade e clareza.",
  },
  {
    name: "E-commerce Launch",
    category: "E-commerce",
    theme: "Colorido",
    description: "Página de lançamento com contagem regressiva e urgência visual.",
  },
];

interface InspireSectionProps {
  templates?: TemplateDisplayItem[];
}

export function InspireSection({ templates }: InspireSectionProps) {
  const displayTemplates =
    templates && templates.length > 0 ? templates : DEFAULT_TEMPLATES;

  return (
    <section className="py-24 sm:py-32 relative overflow-hidden bg-black border-y border-white/10">
      {/* Background: background-templates.png com horizonte luminoso */}
      <div className="pointer-events-none absolute inset-0 z-0 select-none overflow-hidden flex items-center justify-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/background-templates.png"
          alt=""
          className="w-full h-full object-cover object-center opacity-75 mix-blend-screen"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,#000000_90%)]" />
      </div>

      <div className="mx-auto max-w-[1400px] px-6 sm:px-8 lg:px-12 relative z-10">
        {/* Header */}
        <Reveal>
          <div className="flex flex-col items-start sm:flex-row sm:items-end sm:justify-between gap-6 mb-16">
            <div className="max-w-2xl">
              <span className="inline-block text-xs font-bold uppercase tracking-widest text-primary mb-4">
                Galeria
              </span>
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-[1.05]">
                Inspire-se.
              </h2>
              <p className="mt-4 text-lg text-muted-foreground leading-relaxed max-w-xl">
                Landing pages reais criadas pela comunidade. Escolha uma base e lance sua campanha em minutos.
              </p>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground shrink-0">
              <span className="flex items-center gap-1.5">
                <Copy className="w-4 h-4 text-primary" />
                <span className="font-semibold text-foreground">+120</span> templates
              </span>
              <span className="flex items-center gap-1.5">
                <Heart className="w-4 h-4 text-pink-500" />
                <span className="font-semibold text-foreground">+800</span> curtidas
              </span>
            </div>
          </div>
        </Reveal>

        {/* Template Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {displayTemplates.map((template, i) => {
            const categoryLabel =
              CATEGORY_LABELS[template.category || ""] || template.category || "Geral";
            const themeLabel =
              THEME_LABELS[template.theme || ""] || template.theme || "Padrão";
            const targetHref = template.slug
              ? `/templates/${template.slug}`
              : "/templates";

            return (
              <Reveal key={template.id || template.slug || template.name} delay={i * 80}>
                <Link href={targetHref} className="block group h-full">
                  <GlowCard className="overflow-hidden transition-all duration-300 hover:-translate-y-1 border border-white/10 bg-black/60 backdrop-blur-xl hover:border-primary/40 hover:shadow-xl hover:shadow-primary/10 flex flex-col h-full">
                    {/* Preview Area */}
                    <div className="relative aspect-[4/3] overflow-hidden bg-black">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={template.thumbnailUrl || "/community-template-icon.png"}
                        alt={template.name}
                        className="w-full h-full object-cover object-top transform transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                      {/* Hover overlay */}
                      <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-xs">
                        <span className="inline-flex items-center gap-2 rounded-full bg-white text-black px-5 py-2.5 text-sm font-semibold transition-transform duration-200 group-hover:scale-105 active:scale-95 shadow-lg">
                          Ver template
                          <ArrowRight className="w-4 h-4" />
                        </span>
                      </div>

                      {/* Badges */}
                      <div className="absolute top-3 left-3 flex gap-1.5 z-10">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-black/70 text-white backdrop-blur-md border border-white/10">
                          {categoryLabel}
                        </span>
                      </div>
                    </div>

                    {/* Info */}
                    <div className="p-6 flex-1 flex flex-col justify-between">
                      <div>
                        <h3 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors duration-200">
                          {template.name}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-2 leading-relaxed line-clamp-2">
                          {template.description ||
                            "Template otimizado para lançamentos e captação de leads."}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 mt-4 text-xs text-muted-foreground">
                        <span className="px-2.5 py-1 rounded-full bg-white/[0.05] border border-white/10 text-zinc-300 font-medium">
                          {themeLabel}
                        </span>
                      </div>
                    </div>
                  </GlowCard>
                </Link>
              </Reveal>
            );
          })}
        </div>

        {/* CTA Final */}
        <Reveal>
          <div className="text-center">
            <Link
              href="/templates"
              className="group inline-flex items-center gap-2 rounded-full bg-primary px-8 py-3.5 text-sm font-semibold text-primary-foreground shadow-xl shadow-primary/25 transition-all duration-200 hover:bg-primary/90 hover:scale-105 active:scale-95"
            >
              Explorar todos os templates
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <p className="text-xs text-muted-foreground mt-3 font-medium">
              Grátis para usar · Modelos da comunidade disponíveis
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}