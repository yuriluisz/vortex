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
];

function CellValue({ value }: { value: string | boolean }) {
  if (value === true) {
    return (
      <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-chart-2/15 text-chart-2">
        <Check className="h-3.5 w-3.5" />
      </span>
    );
  }
  if (value === false) {
    return (
      <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-destructive/10 text-destructive">
        <X className="h-3.5 w-3.5" />
      </span>
    );
  }
  if (value === "Parcial" || value === "Limitado" || value === "Com delay") {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
        <Minus className="h-3.5 w-3.5" />
        {value}
      </span>
    );
  }
  return <span className="text-sm text-foreground/80">{value}</span>;
}

export function ComparisonSection() {
  return (
    <section className="py-24 sm:py-32 relative overflow-hidden">
      <div className="mx-auto max-w-[1400px] px-6 sm:px-8 lg:px-12">
        <Reveal>
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="inline-block text-xs font-bold uppercase tracking-widest text-primary mb-4">
              Comparação
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mb-4">
              Por que Vórtex+ e não o jeito antigo?
            </h2>
            <p className="text-lg text-muted-foreground">
              A diferença entre perder horas e publicar em segundos.
            </p>
          </div>
        </Reveal>

        <Reveal delay={100}>
          <div className="overflow-x-auto rounded-2xl border border-border/60 bg-card/50">
            <table className="w-full min-w-[640px] text-left">
              <thead>
                <tr className="border-b border-border/60">
                  <th className="p-5 text-sm font-semibold text-muted-foreground w-1/4">
                    Recurso
                  </th>
                  <th className="p-5 text-sm font-bold text-primary bg-primary/5">
                    Vórtex+
                  </th>
                  <th className="p-5 text-sm font-semibold text-muted-foreground">
                    Manual (VPS)
                  </th>
                  <th className="p-5 text-sm font-semibold text-muted-foreground">
                    Outras plataformas
                  </th>
                </tr>
              </thead>
              <tbody>
                {ROWS.map((row, i) => (
                  <tr
                    key={row.feature}
                    className={`border-b border-border/40 last:border-0 ${
                      i % 2 === 0 ? "bg-background/40" : ""
                    }`}
                  >
                    <td className="p-5 text-sm font-medium text-foreground">
                      {row.feature}
                    </td>
                    <td className="p-5 bg-primary/5">
                      <CellValue value={row.vortex} />
                    </td>
                    <td className="p-5">
                      <CellValue value={row.manual} />
                    </td>
                    <td className="p-5">
                      <CellValue value={row.others} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
            <p className="text-xs text-muted-foreground mt-3">
              Comece grátis · Sem cartão de crédito
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}