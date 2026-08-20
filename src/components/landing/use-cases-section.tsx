"use client";

import { TrendingUp, Target, Rocket } from "lucide-react";
import { Reveal } from "@/components/ui/reveal";
import { GlowCard } from "@/components/ui/glow-card";

const USE_CASES = [
  {
    icon: Target,
    name: "Mariana S.",
    niche: "Lançamentos de Infoprodutos",
    quote:
      "Validei 3 ofertas em uma semana. A que converteu pagou o mês inteiro de tráfego.",
    metric: "3 ofertas · 1 semana · R$0 em infra",
    avatar:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=96&h=96&fit=crop&crop=faces&q=80",
  },
  {
    icon: TrendingUp,
    name: "Rafael M.",
    niche: "Tráfego Pago para E-commerce",
    quote:
      "Parei de perder 2 horas por página configurando servidor. Agora publico em 30 segundos e vejo os leads chegando em tempo real.",
    metric: "12 campanhas · 2h economizadas por página",
    avatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=96&h=96&fit=crop&crop=faces&q=80",
  },
  {
    icon: Rocket,
    name: "Camila R.",
    niche: "Mentoria e Cursos Online",
    quote:
      "O anti-scraping salvou minha oferta. Um concorrente tentou copiar minha página e não conseguiu. Isso não tem preço.",
    metric: "Oferta protegida · 0 cópias detectadas",
    avatar:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=96&h=96&fit=crop&crop=faces&q=80",
  },
];

export function UseCasesSection() {
  return (
    <section className="py-24 sm:py-32 bg-black border-y border-white/10 relative overflow-hidden">
      <div className="mx-auto max-w-[1400px] px-6 sm:px-8 lg:px-12 relative z-10">
        <Reveal>
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="inline-block text-xs font-bold uppercase tracking-widest text-primary mb-4">
              Resultados
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mb-4">
              Quem valida com a Vórtex+ não volta atrás
            </h2>
            <p className="text-lg text-neutral-400">
              Marketers e infoprodutores que trocaram a dor pela velocidade.
            </p>
          </div>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {USE_CASES.map((useCase, i) => (
            <Reveal key={useCase.name} delay={i * 100}>
              <GlowCard className="h-full flex flex-col p-8 border border-white/10 bg-black/60 backdrop-blur-xl hover:border-primary/40 transition-colors duration-300">
                <div className="flex items-center gap-4 mb-6">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={useCase.avatar}
                    alt={useCase.name}
                    className="h-12 w-12 rounded-full object-cover border-2 border-white/10"
                    loading="lazy"
                  />
                  <div>
                    <p className="font-semibold text-white">{useCase.name}</p>
                    <p className="text-xs text-neutral-400">{useCase.niche}</p>
                  </div>
                </div>

                <blockquote className="text-neutral-300 leading-relaxed flex-1">
                  &ldquo;{useCase.quote}&rdquo;
                </blockquote>

                <div className="mt-6 pt-6 border-t border-white/10 flex items-center gap-2">
                  <useCase.icon className="h-4 w-4 text-primary shrink-0" />
                  <span className="text-xs font-semibold text-neutral-200">
                    {useCase.metric}
                  </span>
                </div>
              </GlowCard>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}