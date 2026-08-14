"use client";

import Link from "next/link";
import { ArrowRight, Copy, Heart } from "lucide-react";
import { GlowCard } from "@/components/ui/glow-card";
import { Reveal } from "@/components/ui/reveal";

const FEATURED_TEMPLATES = [
  {
    name: "Dark Evento Exclusivo",
    category: "Evento",
    theme: "Escuro",
    color: "#050505",
    description: "Tema imersivo de alta conversão para masterclasses e lançamentos.",
    gradient: "from-amber-500 to-purple-600",
    icon: "🎭",
  },
  {
    name: "Light Clean Mentoria",
    category: "Mentoria",
    theme: "Claro",
    color: "#F8FAFC",
    description: "Layout espaçoso e moderno focado em autoridade e clareza.",
    gradient: "from-emerald-500 to-blue-500",
    icon: "✨",
  },
  {
    name: "E-commerce Launch",
    category: "E-commerce",
    theme: "Colorido",
    color: "#1a1a2e",
    description: "Página de lançamento com contagem regressiva e urgência visual.",
    gradient: "from-pink-500 to-orange-400",
    icon: "🚀",
  },
];

export function InspireSection() {
  return (
    <section className="py-24 sm:py-32 relative overflow-hidden bg-secondary/30 border-y border-border/50">
      {/* Animated gradient blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full bg-primary/10 blur-[120px] animate-blob-float-1" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] rounded-full bg-accent/10 blur-[120px] animate-blob-float-2" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-primary/5 blur-[100px] animate-blob-float-3" />
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
                <Copy className="w-4 h-4" />
                <span className="font-semibold text-foreground">+120</span> templates
              </span>
              <span className="flex items-center gap-1.5">
                <Heart className="w-4 h-4" />
                <span className="font-semibold text-foreground">+800</span> curtidas
              </span>
            </div>
          </div>
        </Reveal>

        {/* Template Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {FEATURED_TEMPLATES.map((template, i) => (
            <Reveal key={template.name} delay={i * 80}>
              <GlowCard className="group cursor-pointer overflow-hidden transition-all duration-300 hover:-translate-y-1">
                {/* Preview Area */}
                <div
                  className="relative aspect-[4/3] overflow-hidden"
                  style={{ backgroundColor: template.color }}
                >
                  {/* Gradient overlay */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${template.gradient} opacity-20`} />

                  {/* Icon / Mockup */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-6xl">{template.icon}</span>
                  </div>

                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <Link
                      href="/templates"
                      className="inline-flex items-center gap-2 rounded-lg bg-white text-black px-4 py-2 text-sm font-medium transition-transform duration-200 hover:scale-105 active:scale-95"
                    >
                      Ver template
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>

                  {/* Badges */}
                  <div className="absolute top-3 left-3 flex gap-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full bg-black/60 text-white backdrop-blur-sm">
                      {template.category}
                    </span>
                  </div>
                </div>

                {/* Info */}
                <div className="p-5">
                  <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors duration-200">
                    {template.name}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed line-clamp-2">
                    {template.description}
                  </p>
                  <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
                    <span className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                      {template.theme}
                    </span>
                  </div>
                </div>
              </GlowCard>
            </Reveal>
          ))}
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
            <p className="text-xs text-muted-foreground mt-3">
              Grátis para usar · +{FEATURED_TEMPLATES.length} categorias disponíveis
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}