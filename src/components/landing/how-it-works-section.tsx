"use client";

import Link from "next/link";
import { ArrowRight, Code2, Zap, BarChart3, Sparkles } from "lucide-react";
import { Reveal } from "@/components/ui/reveal";
import { GlowCard } from "@/components/ui/glow-card";

const STEPS = [
  {
    step: "01",
    badge: "Injeção Inteligente",
    title: "Cole seu HTML",
    description:
      "Exporte do Figma, Webflow, Lovable, v0 ou peça para a IA. Cole seu código e use a tag {{FORM_SLOT}} onde quiser o formulário.",
    icon: Code2,
    gradient: "from-blue-500/20 to-indigo-500/20",
    iconColor: "text-blue-400",
    borderColor: "group-hover:border-blue-500/50",
    tags: ["Figma", "Webflow", "Lovable", "v0"],
  },
  {
    step: "02",
    badge: "Zero Infraestrutura",
    title: "Publique em 1 clique",
    description:
      "Sua página vai ao ar em segundos. Código estático ultrarrápido, SSL automático e blindagem contra ferramentas de espionagem.",
    icon: Zap,
    gradient: "from-primary/20 to-purple-500/20",
    iconColor: "text-primary",
    borderColor: "group-hover:border-primary/50",
    tags: ["Deploy 1s", "SSL Grátis", "Anti-Spy"],
  },
  {
    step: "03",
    badge: "Escala & Automação",
    title: "Veja leads em tempo real",
    description:
      "Acompanhe pageviews e conversões no milissegundo em que acontecem. Validou? Ligue a automação de grupos de WhatsApp e escale.",
    icon: BarChart3,
    gradient: "from-emerald-500/20 to-cyan-500/20",
    iconColor: "text-emerald-400",
    borderColor: "group-hover:border-emerald-500/50",
    tags: ["Métricas ao Vivo", "WhatsApp Sync", "Zero Delay"],
  },
];

export function HowItWorksSection() {
  return (
    <section id="como-funciona" className="py-24 sm:py-36 relative overflow-hidden bg-black">
      {/* Background Image: background-flux com iluminação azul fluida */}
      <div className="pointer-events-none absolute inset-0 z-0 select-none overflow-hidden flex items-center justify-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/background-flux.png"
          alt=""
          className="w-full h-full object-cover object-center opacity-75 mix-blend-screen"
        />
        {/* Vinhetas para integrar perfeitamente com o preto absoluto no topo e na base */}
        <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_20%,#000000_90%)]" />
      </div>

      <div className="mx-auto max-w-[1400px] px-6 sm:px-8 lg:px-12 relative z-10">
        {/* Section Header */}
        <Reveal>
          <div className="text-center max-w-2xl mx-auto mb-20">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold tracking-widest uppercase mb-4 shadow-[0_0_20px_rgba(99,102,241,0.2)]">
              <Sparkles className="w-3.5 h-3.5" />
              Como Funciona
            </div>
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground mb-4">
              O fluxo perfeito de validação.
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground">
              Do código simples ao lead capturado no WhatsApp em 3 passos transparentes.
            </p>
          </div>
        </Reveal>

        {/* 3 Steps Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative items-stretch">
          {/* Linha conectora desktop com brilho animado */}
          <div className="hidden md:block absolute top-1/2 left-[12%] right-[12%] -translate-y-12 h-px z-0 pointer-events-none">
            <div className="h-full w-full bg-gradient-to-r from-blue-500/20 via-primary/60 to-emerald-500/20" />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-flow-line" />
          </div>

          {STEPS.map((step, i) => {
            const Icon = step.icon;

            return (
              <Reveal key={step.title} delay={i * 120} className="flex">
                <GlowCard className="group relative flex flex-col justify-between p-5 sm:p-8 rounded-2xl border border-white/15 bg-black/70 backdrop-blur-xl transition-all duration-300 hover:-translate-y-2 hover:border-white/30 hover:shadow-2xl hover:shadow-primary/20 w-full">
                  <div>
                    {/* Step Number & Badge */}
                    <div className="flex items-center justify-between mb-6 sm:mb-8 gap-2">
                      <div className="flex items-center gap-2.5 sm:gap-3">
                        <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-white/[0.05] border border-white/10 group-hover:scale-110 transition-transform duration-300 shadow-inner flex-shrink-0">
                          <Icon className={`h-5 w-5 sm:h-6 sm:w-6 ${step.iconColor}`} />
                        </div>
                        <span className="font-mono text-[11px] sm:text-xs font-extrabold uppercase tracking-wider text-neutral-300 px-2.5 py-1 rounded-full bg-white/[0.05] border border-white/10 whitespace-nowrap">
                          PASSO {step.step}
                        </span>
                      </div>

                      <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider px-2 sm:px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 whitespace-nowrap">
                        {step.badge}
                      </span>
                    </div>

                    {/* Title & Description */}
                    <h3 className="text-xl sm:text-2xl font-bold text-white mb-2.5 sm:mb-3 group-hover:text-primary transition-colors duration-200">
                      {step.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed">
                      {step.description}
                    </p>
                  </div>

                  {/* Feature Tags Footer */}
                  <div className="mt-6 sm:mt-8 pt-5 sm:pt-6 border-t border-white/10 flex flex-wrap gap-1.5 sm:gap-2">
                    {step.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-[10px] sm:text-[11px] font-semibold text-neutral-300 bg-white/[0.05] border border-white/10 rounded-lg px-2 sm:px-2.5 py-1"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </GlowCard>
              </Reveal>
            );
          })}
        </div>

        {/* CTA Button */}
        <Reveal delay={300}>
          <div className="mt-16 text-center">
            <Link
              href="/admin/login"
              className="group inline-flex items-center gap-2 rounded-full bg-primary px-8 py-4 text-sm font-bold text-primary-foreground shadow-2xl shadow-primary/30 transition-all duration-200 hover:bg-primary/90 hover:scale-105 active:scale-95"
            >
              Começar agora
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <p className="text-xs text-muted-foreground mt-3 font-medium">
              Leva menos de 30 segundos · 100% Grátis
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
