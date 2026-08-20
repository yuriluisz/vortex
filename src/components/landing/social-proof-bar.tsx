"use client";

import { useEffect, useState, useCallback } from "react";
import { Reveal } from "@/components/ui/reveal";

const METRICS = [
  { value: "1.247+", label: "Campanhas publicadas" },
  { value: "89.400+", label: "Leads capturados" },
  { value: "28s", label: "Tempo médio de deploy" },
  { value: "99.9%", label: "Uptime garantido" },
];

/**
 * Componente que renderiza um efeito de números embaralhados (scramble decode)
 * ao carregar a página e também ao passar o mouse.
 */
function ScrambleMetric({ value }: { value: string }) {
  const [displayText, setDisplayText] = useState(value);

  const runScramble = useCallback(() => {
    const digits = "0123456789";
    const totalFrames = 26;
    let frame = 0;

    const interval = setInterval(() => {
      frame++;
      const progress = frame / totalFrames;
      const lockedCount = Math.floor(progress * value.length);

      const next = value
        .split("")
        .map((char, i) => {
          if (char === "." || char === "," || char === "+" || char === "%" || char === "s") {
            return char;
          }
          if (i < lockedCount) {
            return value[i];
          }
          return digits[Math.floor(Math.random() * digits.length)];
        })
        .join("");

      setDisplayText(next);

      if (frame >= totalFrames) {
        clearInterval(interval);
        setDisplayText(value);
      }
    }, 35);

    return () => clearInterval(interval);
  }, [value]);

  useEffect(() => {
    const cleanup = runScramble();
    return cleanup;
  }, [runScramble]);

  return (
    <span
      onMouseEnter={runScramble}
      className="cursor-default select-none transition-colors"
    >
      {displayText}
    </span>
  );
}

interface ToolItem {
  name: string;
  href: string;
  glowColor: string;
  renderIcon: () => React.ReactNode;
}

const TOOLS: ToolItem[] = [
  {
    name: "Figma",
    href: "https://www.figma.com",
    glowColor: "rgba(242, 78, 30, 0.4)",
    renderIcon: () => (
      <svg className="w-4 h-4 shrink-0" viewBox="0 0 38 57" fill="none">
        <path
          d="M19 28.5C19 23.2533 23.2533 19 28.5 19C33.7467 19 38 23.2533 38 28.5C38 33.7467 33.7467 38 28.5 38C23.2533 38 19 33.7467 19 28.5Z"
          fill="#1ABCFE"
        />
        <path
          d="M0 47.5C0 42.2533 4.25329 38 9.5 38H19V47.5C19 52.7467 14.7467 57 9.5 57C4.25329 57 0 52.7467 0 47.5Z"
          fill="#0ACF83"
        />
        <path
          d="M19 0V19H28.5C33.7467 19 38 14.7467 38 9.5C38 4.25329 33.7467 0 28.5 0H19Z"
          fill="#FF7262"
        />
        <path
          d="M0 9.5C0 14.7467 4.25329 19 9.5 19H19V0H9.5C4.25329 0 0 4.25329 0 9.5Z"
          fill="#F24E1E"
        />
        <path
          d="M0 28.5C0 33.7467 4.25329 38 9.5 38H19V19H9.5C4.25329 19 0 23.2533 0 28.5Z"
          fill="#A259FF"
        />
      </svg>
    ),
  },
  {
    name: "Webflow",
    href: "https://webflow.com",
    glowColor: "rgba(20, 110, 245, 0.4)",
    renderIcon: () => (
      <svg className="w-4 h-4 shrink-0 text-[#146EF5]" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19.123 7.828c-.808 2.05-1.92 4.148-3.328 6.289l-2.072-6.289h-2.924l-1.996 6.062L6.87 7.828H3.64l3.75 10.344h3.132l1.97-5.836 2.046 5.836h3.133L21.499 7.828h-2.376z" />
      </svg>
    ),
  },
  {
    name: "Lovable",
    href: "https://lovable.dev",
    glowColor: "rgba(255, 87, 34, 0.4)",
    renderIcon: () => (
      <svg className="w-4 h-4 shrink-0 text-[#FF5722]" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
      </svg>
    ),
  },
  {
    name: "v0",
    href: "https://v0.dev",
    glowColor: "rgba(255, 255, 255, 0.4)",
    renderIcon: () => (
      <svg className="w-4 h-4 shrink-0 text-white" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2L1 21h22L12 2z" />
      </svg>
    ),
  },
  {
    name: "WhatsApp",
    href: "https://www.whatsapp.com",
    glowColor: "rgba(37, 211, 102, 0.4)",
    renderIcon: () => (
      <svg className="w-4 h-4 shrink-0 text-[#25D366]" viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
      </svg>
    ),
  },
  {
    name: "Cloudflare",
    href: "https://www.cloudflare.com",
    glowColor: "rgba(243, 128, 32, 0.4)",
    renderIcon: () => (
      <svg className="w-4 h-4 shrink-0 text-[#F38020]" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.3 10.7c-.5-.7-1.3-1.1-2.1-1.1-.3 0-.6.1-.9.2-.5-1.5-2-2.5-3.6-2.5-1.6 0-3 1-3.6 2.4-.3-.1-.6-.2-.9-.2-1.3 0-2.4.9-2.7 2.2-.8.3-1.5 1.1-1.5 2 0 1.2 1 2.2 2.2 2.2h12.5c1.4 0 2.5-1.1 2.5-2.5 0-1.2-.9-2.3-2-2.5-.1-.1-.2-.1-.3-.2h.4z" />
      </svg>
    ),
  },
  {
    name: "Vercel",
    href: "https://vercel.com",
    glowColor: "rgba(255, 255, 255, 0.4)",
    renderIcon: () => (
      <svg className="w-4 h-4 shrink-0 text-white" viewBox="0 0 24 24" fill="currentColor">
        <path d="M24 22.525H0l12-21.05 12 21.05z" />
      </svg>
    ),
  },
  {
    name: "Hotmart",
    href: "https://hotmart.com",
    glowColor: "rgba(255, 90, 0, 0.4)",
    renderIcon: () => (
      <svg className="w-4 h-4 shrink-0 text-[#FF5A00]" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 14.5c0 .83-.67 1.5-1.5 1.5S10 17.33 10 16.5V11c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5v5.5z" />
      </svg>
    ),
  },
  {
    name: "Kiwify",
    href: "https://kiwify.com.br",
    glowColor: "rgba(16, 185, 129, 0.4)",
    renderIcon: () => (
      <svg className="w-4 h-4 shrink-0 text-[#10B981]" viewBox="0 0 24 24" fill="currentColor">
        <circle cx="12" cy="12" r="10" />
        <path
          d="M8 12l3 3 5-5"
          stroke="#000"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
    ),
  },
];

export function SocialProofBar() {
  const [activeSequentialIndex, setActiveSequentialIndex] = useState<number>(0);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Animação sequencial: faz cada ícone brilhar um por um em loop contínuo
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveSequentialIndex((prev) => (prev + 1) % TOOLS.length);
    }, 1500);

    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative border-y border-white/10 bg-black py-12">
      <div className="mx-auto max-w-[1400px] px-6 sm:px-8 lg:px-12">
        <Reveal>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 mb-10">
            {METRICS.map((metric) => (
              <div key={metric.label} className="text-center md:text-left">
                <p className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight tabular-nums font-mono">
                  <ScrambleMetric value={metric.value} />
                </p>
                <p className="mt-1 text-xs sm:text-sm text-neutral-400 font-medium">
                  {metric.label}
                </p>
              </div>
            ))}
          </div>
        </Reveal>

        <Reveal delay={100}>
          <div className="pt-8 border-t border-white/10">
            <p className="text-center text-[11px] uppercase tracking-widest text-neutral-400 mb-6 font-semibold">
              Funciona com as ferramentas que você já usa
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
              {TOOLS.map((tool, index) => {
                const isCurrentlyActive =
                  hoveredIndex === index || (hoveredIndex === null && activeSequentialIndex === index);

                return (
                  <a
                    key={tool.name}
                    href={tool.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    onMouseEnter={() => setHoveredIndex(index)}
                    onMouseLeave={() => setHoveredIndex(null)}
                    className={`group relative flex items-center gap-2.5 rounded-xl border px-4 py-2 text-sm font-medium transition-all duration-500 cursor-pointer select-none no-underline ${
                      isCurrentlyActive
                        ? "scale-105 border-white/40 bg-white/[0.1] text-white opacity-100 grayscale-0"
                        : "border-white/10 bg-white/[0.04] text-neutral-300 opacity-80 grayscale hover:opacity-100 hover:grayscale-0 hover:border-white/25 hover:text-white"
                    }`}
                    style={{
                      boxShadow: isCurrentlyActive
                        ? `0 0 24px ${tool.glowColor}, inset 0 0 12px ${tool.glowColor}`
                        : "none",
                    }}
                  >
                    <div
                      className={`transition-transform duration-300 ${
                        isCurrentlyActive ? "scale-110" : "group-hover:scale-110"
                      }`}
                    >
                      {tool.renderIcon()}
                    </div>
                    <span className="tracking-wide text-xs sm:text-sm font-semibold">
                      {tool.name}
                    </span>
                  </a>
                );
              })}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}