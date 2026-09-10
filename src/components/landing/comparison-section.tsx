"use client";

import Link from "next/link";
import { Check, X, Minus, ArrowRight } from "lucide-react";
import { Reveal } from "@/components/ui/reveal";

const ROWS = [
  {
    feature: "Tempo de deploy",
    vortex: "30 segundos",
    manual: "2–4 horas",
    others: "15–30 minutos",
  },
  {
    feature: "Custo mensal",
    vortex: "Grátis–R$97",
    manual: "R$50–200",
    others: "R$150+",
  },
  {
    feature: "Formulário dinâmico",
    vortex: true,
    manual: false,
    others: "Limitado",
  },
  {
    feature: "Anti-scraping",
    vortex: true,
    manual: false,
    others: false,
  },
  {
    feature: "WhatsApp integrado",
    vortex: true,
    manual: false,
    others: "Parcial",
  },
  {
    feature: "Métricas real-time",
    vortex: true,
    manual: false,
    others: "Com delay",
  },
  {
    feature: "Mapa de calor & Replay",
    vortex: true,
    manual: false,
    others: false,
  },
];

function CellValue({ value }: { value: string | boolean }) {
  if (value === true) {
    return (
      <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-chart-2/20 text-chart-2">
        <Check className="h-3.5 w-3.5" />
      </span>
    );
  }
  if (value === false) {
    return (
      <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-destructive/20 text-destructive">
        <X className="h-3.5 w-3.5" />
      </span>
    );
  }
  if (value === "Parcial" || value === "Limitado" || value === "Com delay") {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-neutral-400">
        <Minus className="h-3.5 w-3.5" />
        {value}
      </span>
    );
  }
  return <span className="text-sm text-neutral-200">{value}</span>;
}

export function ComparisonSection() {
  return (
    <section className="py-24 sm:py-32 relative overflow-hidden bg-black border-y border-white/10">
      {/* Background: background-beneficios.png */}
      <div className="pointer-events-none absolute inset-0 z-0 select-none overflow-hidden flex items-center justify-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/background-beneficios.png"
          alt=""
          className="w-full h-full object-cover object-center opacity-75 mix-blend-screen"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,#000000_90%)]" />
      </div>

      <div className="mx-auto max-w-[1400px] px-6 sm:px-8 lg:px-12 relative z-10">
        <Reveal>
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="inline-block text-xs font-bold uppercase tracking-widest text-primary mb-4">
              Comparação
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mb-4">
              Por que Vórtex+ e não o jeito antigo?
            </h2>
            <p className="text-lg text-neutral-300">
              A diferença entre perder horas e publicar em segundos.
            </p>
          </div>
        </Reveal>

        <Reveal delay={100}>
          <div className="relative">
            <div className="sm:hidden text-right mb-2">
              <span className="text-[11px] font-medium text-neutral-400">
                Arraste para o lado →
              </span>
            </div>
            <div className="overflow-x-auto border border-white/15 bg-black/70 backdrop-blur-xl shadow-xl rounded-xl sm:rounded-2xl no-scrollbar">
              <table className="w-full min-w-[560px] sm:min-w-[640px] text-left">
                <thead>
                  <tr className="border-b border-white/15">
                    <th className="p-3.5 sm:p-5 text-xs sm:text-sm font-semibold text-neutral-300 w-1/4">
                      Recurso
                    </th>
                    <th className="p-3.5 sm:p-5 text-xs sm:text-sm font-bold text-primary bg-primary/10">
                      Vórtex+
                    </th>
                    <th className="p-3.5 sm:p-5 text-xs sm:text-sm font-semibold text-neutral-300">
                      Manual (VPS)
                    </th>
                    <th className="p-3.5 sm:p-5 text-xs sm:text-sm font-semibold text-neutral-300">
                      Outras plataformas
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {ROWS.map((row, i) => (
                    <tr
                      key={row.feature}
                      className={`border-b border-white/10 last:border-0 ${
                        i % 2 === 0 ? "bg-white/[0.02]" : ""
                      }`}
                    >
                      <td className="p-3.5 sm:p-5 text-xs sm:text-sm font-medium text-white">
                        {row.feature}
                      </td>
                      <td className="p-3.5 sm:p-5 bg-primary/5">
                        <CellValue value={row.vortex} />
                      </td>
                      <td className="p-3.5 sm:p-5">
                        <CellValue value={row.manual} />
                      </td>
                      <td className="p-3.5 sm:p-5">
                        <CellValue value={row.others} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Reveal>

        <Reveal delay={200}>
          <div className="mt-12 text-center">
            <Link
              href="/admin/login"
              className="group inline-flex items-center gap-2 rounded-full bg-primary px-8 py-3.5 text-sm font-semibold text-primary-foreground shadow-xl shadow-primary/25 transition-all duration-200 hover:bg-primary/90 hover:scale-105 active:scale-95"
            >
              Parar de perder tempo
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <p className="text-xs text-neutral-400 mt-3">
              Comece grátis · Sem cartão de crédito
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}