"use client";

import Link from "next/link";
import {
  Video,
  Flame,
  Smartphone,
  ShieldCheck,
  ArrowRight,
  Play,
  Sparkles,
  MousePointerClick,
  Menu,
} from "lucide-react";
import { Reveal } from "@/components/ui/reveal";
import { GlowCard } from "@/components/ui/glow-card";

export function HeatmapSection() {
  return (
    <section id="mapa-de-calor" className="py-24 sm:py-32 relative overflow-hidden bg-black border-y border-white/10">
      {/* Iluminação de fundo */}
      <div className="pointer-events-none absolute inset-0 z-0 select-none overflow-hidden flex items-center justify-center">
        <div className="absolute w-[600px] h-[600px] bg-primary/10 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_20%,#000000_90%)]" />
      </div>

      <div className="mx-auto max-w-[1400px] px-6 sm:px-8 lg:px-12 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-14 items-center">
          
          {/* Coluna Esquerda: Conteúdo */}
          <div className="lg:col-span-7 space-y-8 text-left">
            <Reveal>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white leading-[1.15]">
                Pare de adivinhar. Veja exatamente onde você está{" "}
                <span className="text-primary">perdendo vendas.</span>
              </h2>
            </Reveal>

            <Reveal delay={100}>
              <p className="text-base sm:text-lg text-neutral-300 leading-relaxed max-w-2xl">
                Mais de 90% do tráfego pago vem do mobile. Com o <strong>Mapa de Calor</strong> e o{" "}
                <strong>Replay de Tela</strong>, você assiste à navegação real de cada visitante e
                descobre onde as pessoas tocam, onde hesitam e por que não compram.
              </p>
            </Reveal>

            {/* Grid de 4 Benefícios */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <Reveal delay={200} className="flex">
                <GlowCard className="h-full flex flex-col justify-between p-6 rounded-2xl bg-black/70 backdrop-blur-xl border border-white/15 hover:border-primary/40 transition-colors group w-full">
                  <div>
                    <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-chart-1/10 text-chart-1 mb-3.5 group-hover:scale-105 transition-transform">
                      <Flame className="h-5 w-5" />
                    </div>
                    <h4 className="text-base font-bold text-white mb-1.5">Mapa Térmico de Toques</h4>
                    <p className="text-sm text-neutral-300 leading-relaxed">
                      Identifique em segundos quais botões e opções de quiz atraem os dedos — e o que passa despercebido.
                    </p>
                  </div>
                </GlowCard>
              </Reveal>

              <Reveal delay={250} className="flex">
                <GlowCard className="h-full flex flex-col justify-between p-6 rounded-2xl bg-black/70 backdrop-blur-xl border border-white/15 hover:border-primary/40 transition-colors group w-full">
                  <div>
                    <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary mb-3.5 group-hover:scale-105 transition-transform">
                      <Video className="h-5 w-5" />
                    </div>
                    <h4 className="text-base font-bold text-white mb-1.5">Replay de Tela em Vídeo</h4>
                    <p className="text-sm text-neutral-300 leading-relaxed">
                      Assista à navegação do visitante como se estivesse olhando por cima do ombro dele, com velocidade de até 4x.
                    </p>
                  </div>
                </GlowCard>
              </Reveal>

              <Reveal delay={300} className="flex">
                <GlowCard className="h-full flex flex-col justify-between p-6 rounded-2xl bg-black/70 backdrop-blur-xl border border-white/15 hover:border-primary/40 transition-colors group w-full">
                  <div>
                    <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-chart-2/10 text-chart-2 mb-3.5 group-hover:scale-105 transition-transform">
                      <Smartphone className="h-5 w-5" />
                    </div>
                    <h4 className="text-base font-bold text-white mb-1.5">Filtro por UTM do Anúncio</h4>
                    <p className="text-sm text-neutral-300 leading-relaxed">
                      Compare o comportamento de quem veio do Stories vs. Feed vs. Google e descubra qual criativo converte mais.
                    </p>
                  </div>
                </GlowCard>
              </Reveal>

              <Reveal delay={350} className="flex">
                <GlowCard className="h-full flex flex-col justify-between p-6 rounded-2xl bg-black/70 backdrop-blur-xl border border-white/15 hover:border-primary/40 transition-colors group w-full">
                  <div>
                    <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-chart-3/10 text-chart-3 mb-3.5 group-hover:scale-105 transition-transform">
                      <ShieldCheck className="h-5 w-5" />
                    </div>
                    <h4 className="text-base font-bold text-white mb-1.5">Privacidade & Zero Delay</h4>
                    <p className="text-sm text-neutral-300 leading-relaxed">
                      Mascaramento nativo de senhas e inputs. Gravação ultraleve sem diminuir a velocidade da página.
                    </p>
                  </div>
                </GlowCard>
              </Reveal>
            </div>

            {/* CTA */}
            <Reveal delay={400}>
              <div className="pt-2">
                <Link
                  href="/admin/login?mode=register&plan=ULTRA"
                  className="group relative inline-flex items-center justify-center gap-2 rounded-full bg-primary px-8 py-3.5 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 hover:scale-105 active:scale-95 shadow-xl shadow-primary/25 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                  <span className="relative flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    Testar Mapa de Calor & Replay
                  </span>
                  <ArrowRight className="relative h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </Reveal>
          </div>

          {/* Coluna Direita: Mockup Mobile Idêntico ao mobile-hero-mockup.tsx com Replay Afastado */}
          <div className="lg:col-span-5 relative flex items-center justify-center">
            
            {/* Glow de fundo */}
            <div className="absolute -inset-4 bg-primary/20 rounded-full blur-3xl opacity-60 pointer-events-none" />

            {/* Container Relativo do Mockup com espaço para o Replay flutuante */}
            <div className="relative w-full max-w-[360px] sm:max-w-[440px] flex justify-center pb-16 sm:pb-20">
              
              {/* Smartphone com chassis idêntico a mobile-hero-mockup.tsx e tamanho ampliado */}
              <div className="relative mx-auto w-[300px] sm:w-[330px] h-[590px] sm:h-[630px] rounded-[40px] border-[6px] border-zinc-800 bg-background shadow-2xl overflow-hidden ring-1 ring-white/10 select-none flex flex-col">
                
                {/* Notch da Apple / Dynamic Island idêntico ao hero */}
                <div className="absolute top-0 inset-x-0 h-6 flex justify-center z-50 pointer-events-none">
                  <div className="w-24 h-5 bg-zinc-800 rounded-b-3xl" />
                </div>

                {/* Header do app mobile idêntico ao mobile-hero-mockup.tsx */}
                <div className="pt-8 pb-3 px-4 flex items-center justify-between border-b border-border/50 bg-sidebar/50">
                  <Menu className="h-5 w-5 text-foreground" />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/Vortex Padrão.svg" alt="Vórtex+" className="h-4 w-auto invert" />
                  <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center">
                    <span className="text-[8px] font-bold text-primary">ADM</span>
                  </div>
                </div>

                {/* Conteúdo interno da tela do celular com Quiz e Mapa de Calor Térmico */}
                <div className="p-5 flex-1 flex flex-col justify-between bg-background/50 overflow-hidden">
                  
                  <div className="space-y-1.5 text-center pt-2">
                    <p className="text-[10px] text-primary uppercase font-bold tracking-wider">
                      Diagnóstico de Conversão
                    </p>
                    <h3 className="text-sm sm:text-base font-bold text-foreground leading-snug">
                      Qual é o seu maior gargalo hoje?
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Responda para liberar sua análise
                    </p>
                  </div>

                  {/* Opções com Mancha Térmica Realista */}
                  <div className="my-auto space-y-2.5 relative py-2">
                    <div className="p-3 rounded-xl bg-card border border-border text-xs text-muted-foreground flex justify-between items-center">
                      <span>1. Pouco tráfego na página</span>
                      <div className="w-3.5 h-3.5 rounded-full border border-muted-foreground/40" />
                    </div>

                    {/* Opção mais clicada com Mancha Térmica Quente */}
                    <div className="relative p-3 rounded-xl bg-card/80 border border-chart-1/50 text-xs text-foreground font-medium flex justify-between items-center shadow-inner">
                      <span>2. Visitantes travam no checkout</span>
                      <div className="w-3.5 h-3.5 rounded-full bg-chart-1" />

                      {/* Hotspot Térmico */}
                      <div className="absolute right-10 top-1/2 -translate-y-1/2 pointer-events-none">
                        <div className="w-16 h-16 rounded-full bg-[radial-gradient(circle,rgba(239,68,68,0.85)_0%,rgba(249,115,22,0.6)_35%,rgba(234,179,8,0.3)_60%,transparent_100%)] blur-[2px]" />
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-card border border-border text-xs text-muted-foreground flex justify-between items-center">
                      <span>3. Falta de criativos validados</span>
                      <div className="w-3.5 h-3.5 rounded-full border border-muted-foreground/40" />
                    </div>
                  </div>

                  {/* Botão com Mancha de Calor Concentrada */}
                  <div className="relative pt-2">
                    <div className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs text-center shadow-lg shadow-primary/25 flex items-center justify-center gap-1.5">
                      <span>Continuar Diagnóstico</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>

                    {/* Ponto de Calor no Botão */}
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                      <div className="w-24 h-24 rounded-full bg-[radial-gradient(circle,rgba(239,68,68,0.95)_0%,rgba(249,115,22,0.75)_30%,rgba(234,179,8,0.45)_60%,rgba(56,189,248,0.15)_80%,transparent_100%)] blur-[3px]" />
                    </div>
                  </div>

                </div>

              </div>

              {/* Player do Replay Afastado (Flutuando no canto inferior direito, sem sobrepor o botão) */}
              <div className="absolute -bottom-6 -right-4 sm:-bottom-8 sm:-right-10 lg:-right-14 z-30 w-[240px] sm:w-[270px] rounded-2xl bg-card/95 backdrop-blur-xl border border-border shadow-2xl shadow-black p-4 space-y-3 transition-transform hover:scale-105">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-primary/15 text-primary border border-primary/25 flex items-center justify-center shrink-0">
                    <Play className="w-4 h-4 fill-current ml-0.5" />
                  </div>
                  <div className="truncate">
                    <p className="text-xs font-bold text-card-foreground truncate">Replay de Sessão</p>
                    <p className="text-[10px] text-muted-foreground truncate">Instagram Ads · há 2 min</p>
                  </div>
                </div>

                {/* Linha do Tempo */}
                <div className="space-y-1">
                  <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary w-3/4 rounded-full" />
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground">
                    <span>00:24</span>
                    <span>00:38</span>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-1.5 border-t border-border/40 text-[10px] text-muted-foreground">
                  <span className="flex items-center gap-1 text-card-foreground font-medium">
                    <MousePointerClick className="w-3 h-3 text-chart-1" />
                    4 toques gravados
                  </span>
                  <span>iPhone 15 Pro</span>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
