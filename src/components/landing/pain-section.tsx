"use client";

import Link from "next/link";
import { Flame, Settings2, EyeOff, ArrowRight } from "lucide-react";
import { Reveal } from "@/components/ui/reveal";
import { GlowCard } from "@/components/ui/glow-card";

const PAINS = [
  {
    icon: Flame,
    title: "Queimando tráfego",
    description:
      "Gasta R$500 em ads pra descobrir que a oferta não converte? Cada dia sem validar é dinheiro no lixo.",
    color: "text-chart-1 bg-chart-1/10",
  },
  {
    icon: Settings2,
    title: "Perdendo horas em infra",
    description:
      "Servidor, domínio, SSL, hospedagem... pra uma página que talvez nem venda. Seu tempo vale mais.",
    color: "text-chart-3 bg-chart-3/10",
  },
  {
    icon: EyeOff,
    title: "Sendo copiado",
    description:
      "Concorrentes clonam sua LP vencedora em minutos. Sem proteção, sua copy e layout são públicos.",
    color: "text-accent bg-accent/10",
  },
];

export function PainSection() {
  return (
    <section className="py-24 sm:py-32 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="mx-auto max-w-[1400px] px-6 sm:px-8 lg:px-12 relative z-10">
        <Reveal>
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="inline-block text-xs font-bold uppercase tracking-widest text-primary mb-4">
              O problema
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mb-4">
              Você ainda está fazendo isso manualmente?
            </h2>
            <p className="text-lg text-muted-foreground">
              Se você roda tráfego, conhece esses três pesadelos.
            </p>
          </div>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PAINS.map((pain, i) => (
            <Reveal key={pain.title} delay={i * 100}>
              <GlowCard className="h-full p-8 border border-border/60 bg-card/50 hover:border-border/80 transition-colors duration-300">
                <div className={`inline-flex h-12 w-12 items-center justify-center rounded-xl ${pain.color} mb-6`}>
                  <pain.icon className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-3">
                  {pain.title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {pain.description}
                </p>
              </GlowCard>
            </Reveal>
          ))}
        </div>

        <Reveal delay={300}>
          <div className="mt-12 text-center">
            <Link
              href="/admin/login"
              className="group inline-flex items-center gap-2 rounded-full bg-primary px-8 py-3.5 text-sm font-semibold text-primary-foreground shadow-xl shadow-primary/25 transition-all duration-200 hover:bg-primary/90 hover:scale-105 active:scale-95"
            >
              Resolver isso agora
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <p className="text-xs text-muted-foreground mt-3">
              É grátis · Leva 30 segundos
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}