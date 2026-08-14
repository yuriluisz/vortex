"use client";

import { Reveal } from "@/components/ui/reveal";

const METRICS = [
  { value: "1.247+", label: "Campanhas publicadas" },
  { value: "89.400+", label: "Leads capturados" },
  { value: "28s", label: "Tempo médio de deploy" },
  { value: "99.9%", label: "Uptime garantido" },
];

const TOOLS = ["Figma", "Webflow", "WhatsApp", "Cloudflare", "Vercel", "Hotmart"];

export function SocialProofBar() {
  return (
    <section className="relative border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto max-w-[1400px] px-6 sm:px-8 lg:px-12 py-10">
        <Reveal>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            {METRICS.map((metric) => (
              <div key={metric.label} className="text-center md:text-left">
                <p className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight tabular-nums">
                  {metric.value}
                </p>
                <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
                  {metric.label}
                </p>
              </div>
            ))}
          </div>
        </Reveal>

        <Reveal delay={100}>
          <div className="mt-8 pt-8 border-t border-border/40">
            <p className="text-center text-[11px] uppercase tracking-widest text-muted-foreground/70 mb-4">
              Funciona com as ferramentas que você já usa
            </p>
            <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 opacity-60">
              {TOOLS.map((tool) => (
                <span
                  key={tool}
                  className="text-sm font-semibold text-muted-foreground/80 tracking-wide"
                >
                  {tool}
                </span>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}