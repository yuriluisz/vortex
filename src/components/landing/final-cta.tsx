"use client";

import Link from "next/link";
import { ArrowRight, ShieldCheck, Zap, CreditCard } from "lucide-react";
import { Reveal } from "@/components/ui/reveal";

export function FinalCta() {
  return (
    <section className="py-24 sm:py-36 relative overflow-hidden bg-black border-t border-white/10">
      {/* Background: background-finalcta.png */}
      <div className="pointer-events-none absolute inset-0 z-0 select-none overflow-hidden flex items-center justify-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/background-finalcta.png"
          alt=""
          className="w-full h-full object-cover object-center opacity-75 mix-blend-screen"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,#000000_90%)]" />
      </div>

      <div className="mx-auto max-w-[1400px] px-6 sm:px-8 lg:px-12 relative z-10">
        <Reveal>
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-[1.1] mb-6">
              Sua próxima oferta pode estar{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
                no ar em 30 segundos.
              </span>
            </h2>
            <p className="text-lg text-neutral-300 mb-10 max-w-xl mx-auto leading-relaxed">
              Cada dia sem validar é dinheiro queimado em tráfego. Comece agora,
              é grátis — e descubra se a sua ideia coloca dinheiro no bolso.
            </p>

            <div className="flex flex-col items-center gap-4">
              <Link
                href="/admin/login"
                className="group relative inline-flex items-center justify-center gap-2 rounded-full bg-primary px-10 py-4 text-base font-semibold text-primary-foreground shadow-2xl shadow-primary/30 transition-all duration-200 hover:bg-primary/90 hover:scale-105 active:scale-95 overflow-hidden"
              >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                <span className="relative">Validar Minha Primeira Oferta</span>
                <ArrowRight className="relative h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>

              <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-neutral-400">
                <span className="flex items-center gap-1.5">
                  <Zap className="h-3.5 w-3.5 text-primary" />
                  Grátis para começar
                </span>
                <span className="flex items-center gap-1.5">
                  <CreditCard className="h-3.5 w-3.5 text-primary" />
                  Sem cartão de crédito
                </span>
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                  Cancele quando quiser
                </span>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}