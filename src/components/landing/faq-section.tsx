"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { Reveal } from "@/components/ui/reveal";

const FAQS = [
  {
    question: "Preciso saber programar?",
    answer:
      "Não. Se você tem o HTML da sua página (do Figma, Webflow ou IA), é só colar e publicar. O formulário dinâmico é injetado automaticamente onde você colocar a tag {{FORM_SLOT}}.",
  },
  {
    question: "Funciona com qualquer página HTML?",
    answer:
      "Sim. HTML, CSS e JS estático. Se abre no navegador, funciona na Vórtex+. O servidor não processa nada, garantindo nota máxima no Core Web Vitals do Google.",
  },
  {
    question: "Como funciona o formulário dinâmico?",
    answer:
      "Você coloca {{FORM_SLOT}} no seu HTML e nós injetamos o formulário automaticamente. Os leads vão direto pro seu dashboard em tempo real, sem precisar configurar nada.",
  },
  {
    question: "Posso usar meu próprio domínio?",
    answer:
      "Sim, nos planos Pro e Ultra. Aponte o DNS e pronto. Domínio personalizado também ajuda a proteger sua oferta contra ferramentas de espionagem.",
  },
  {
    question: "E se eu quiser cancelar?",
    answer:
      "Cancele quando quiser, sem multa. Seus dados ficam disponíveis por 30 dias após o cancelamento. Sem fidelidade, sem pegadinha.",
  },
  {
    question: "O anti-scraping funciona mesmo?",
    answer:
      "Sim. Links gerados com identificadores únicos, proteção contra bots e ofuscação de código impedem que ferramentas de espionagem copiem sua oferta vencedora.",
  },
];

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="py-24 sm:py-32 bg-secondary/30 border-y border-border/50 relative overflow-hidden">
      <div className="mx-auto max-w-[800px] px-6 sm:px-8 lg:px-12 relative z-10">
        <Reveal>
          <div className="text-center mb-16">
            <span className="inline-block text-xs font-bold uppercase tracking-widest text-primary mb-4">
              FAQ
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mb-4">
              Perguntas frequentes
            </h2>
            <p className="text-lg text-muted-foreground">
              Tudo o que você precisa saber antes de começar.
            </p>
          </div>
        </Reveal>

        <div className="space-y-3">
          {FAQS.map((faq, i) => {
            const isOpen = openIndex === i;
            return (
              <Reveal key={faq.question} delay={i * 50}>
                <div className="rounded-xl border border-border/60 bg-card/50 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setOpenIndex(isOpen ? null : i)}
                    className="w-full flex items-center justify-between gap-4 p-5 text-left transition-colors duration-200 hover:bg-card/80"
                    aria-expanded={isOpen}
                  >
                    <span className="font-semibold text-foreground">
                      {faq.question}
                    </span>
                    <ChevronDown
                      className={`h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-200 ease-out ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  <div
                    className={`grid transition-all duration-200 ease-out ${
                      isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                    }`}
                  >
                    <div className="overflow-hidden">
                      <p className="px-5 pb-5 text-sm text-muted-foreground leading-relaxed">
                        {faq.answer}
                      </p>
                    </div>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>

        <Reveal delay={300}>
          <div className="mt-12 text-center">
            <p className="text-muted-foreground">
              Ainda com dúvidas?{" "}
              <Link
                href="/admin/login"
                className="font-semibold text-primary hover:underline"
              >
                Comece grátis e veja com seus olhos →
              </Link>
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}