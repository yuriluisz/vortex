import Link from "next/link";
import {
  BarChart3,
  Shield,
  ArrowRight,
  CheckCircle2,
  MessageSquareMore,
  Code2,
} from "lucide-react";
import { DotGrid } from "@/components/ui/dot-grid";
import { HeroMockup } from "@/components/landing/hero-mockup";
import { MobileHeroMockup } from "@/components/landing/mobile-hero-mockup";
import { Reveal } from "@/components/ui/reveal";
import { GlowCard } from "@/components/ui/glow-card";
import { InspireSection } from "@/components/landing/inspire-section";
import { SocialProofBar } from "@/components/landing/social-proof-bar";
import { PainSection } from "@/components/landing/pain-section";
import { UseCasesSection } from "@/components/landing/use-cases-section";
import { ComparisonSection } from "@/components/landing/comparison-section";
import { FaqSection } from "@/components/landing/faq-section";
import { FinalCta } from "@/components/landing/final-cta";
import { HowItWorksSection } from "@/components/landing/how-it-works-section";
import { HeatmapSection } from "@/components/landing/heatmap-section";

export default function Home() {
  const plans = [
    {
      name: "Starter",
      price: "Grátis",
      period: "",
      description: "Para validar sua primeira ideia de graça.",
      highlight: false,
      features: [
        "1 campanha ativa",
        "Até 100 leads/mês",
        "3 grupos de WhatsApp",
        "Formulário dinâmico",
        "Marca Vórtex+",
      ],
      cta: "Validar minha primeira oferta grátis",
      href: "/admin/login?mode=register",
    },
    {
      name: "Validador Pro",
      price: "R$ 97",
      period: "/mês",
      description: "Para quem testa ofertas toda semana.",
      highlight: true, // DESTAQUE — plano alvo (decoy effect)
      badge: "Mais Popular",
      features: [
        "10 campanhas ativas",
        "Até 10.000 leads/mês",
        "Blindagem Anti Scrapping",
        "Domínio personalizado",
        "Sem marca Vórtex+",
        "Suporte prioritário",
      ],
      cta: "Começar a validar em escala",
      href: "/admin/login?mode=register&plan=PRO",
    },
    {
      name: "Scale / Ultra",
      price: "R$ 157",
      period: "/mês",
      description: "A oferta vendeu. É hora de escalar a operação.",
      highlight: false,
      features: [
        "Campanhas ilimitadas",
        "Leads ilimitados",
        "Grupos ilimitados",
        "Gravação de Sessões & Replay de Tela",
        "Mapa de Calor Térmico no Mobile",
        "Automação de WhatsApp com API",
        "Criação de Grupos em Massa",
        "Domínio personalizado",
        "Suporte dedicado",
      ],
      cta: "Escalar minha operação",
      href: "/admin/login?mode=register&plan=ULTRA",
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-black text-white">
      {/* Hero Section */}
      <header className="relative overflow-hidden bg-black">
        {/* Background: preto absoluto com a imagem background-hero encostada na direita preenchendo toda a altura vertical */}
        <div className="pointer-events-none absolute inset-0 z-0 select-none overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/background-hero.png"
            alt=""
            className="absolute -right-[5px] top-0 h-full w-full md:w-3/4 lg:w-[55%] xl:w-1/2 object-cover object-right opacity-70 md:opacity-100"
          />
          {/* Gradientes direcionais de proteção exclusivos para mobile */}
          <div className="md:hidden absolute inset-0 bg-gradient-to-r from-black via-black/90 to-black/30" />
          <div className="md:hidden absolute inset-0 bg-gradient-to-b from-black/80 via-transparent to-black" />
        </div>

        <div className="relative z-10 mx-auto max-w-[1400px] px-6 pt-24 pb-16 sm:px-8 sm:pt-32 sm:pb-24 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-12 lg:gap-16 items-center">
            {/* Coluna Esquerda */}
            <div className="text-left order-1">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/Vortex Padrão.svg"
                alt="Vórtex+"
                className="h-12 w-auto invert mb-8 animate-fade-in-up"
                style={{ animationDelay: "0ms" }}
              />

              <h1
                className="animate-fade-in-up text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-[1.1] mb-6 drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)]"
                style={{ animationDelay: "200ms" }}
              >
                Seu site no ar em minutos totalmente de{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
                  GRAÇA.
                </span>
              </h1>

              <p
                className="animate-fade-in-up text-lg text-neutral-200 mb-8 max-w-[540px] leading-relaxed drop-shadow-[0_1px_6px_rgba(0,0,0,0.8)]"
                style={{ animationDelay: "300ms" }}
              >
                Hospede seu design do Figma, Webflow, Lovable, em minutos sem precisar esquentar a cabeça com códigos complexos, deploys, e nem nada disso.
              </p>

              <div
                className="animate-fade-in-up flex flex-col sm:flex-row items-start sm:items-center gap-4"
                style={{ animationDelay: "400ms" }}
              >
                <Link
                  href="/admin/login"
                  className="group relative inline-flex items-center justify-center gap-2 rounded-full bg-primary px-8 py-3.5 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 hover:scale-105 active:scale-95 shadow-xl shadow-primary/25 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                  <span className="relative">Validar Minha Primeira Oferta</span>
                  <ArrowRight className="relative h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
                <Link
                  href="#como-funciona"
                  className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/60 backdrop-blur-md px-6 py-3.5 text-sm font-semibold text-white transition-all hover:bg-white/10 hover:border-white/40 hover:scale-105 active:scale-95 shadow-md"
                >
                  Ver como funciona
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              <p
                className="animate-fade-in-up mt-3 text-xs text-neutral-400 drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)]"
                style={{ animationDelay: "450ms" }}
              >
                Grátis · 30 segundos · Sem cartão de crédito
              </p>

              <div className="animate-fade-in-up mt-10 flex items-center gap-4 text-sm text-neutral-300" style={{ animationDelay: "500ms" }}>
                <div className="flex -space-x-2">
                  {[
                    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=64&h=64&fit=crop&crop=faces&q=80",
                    "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=64&h=64&fit=crop&crop=faces&q=80",
                    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=64&h=64&fit=crop&crop=faces&q=80",
                    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=64&h=64&fit=crop&crop=faces&q=80"
                  ].map((src, i) => (
                    <div key={i} className="h-8 w-8 rounded-full border-2 border-background bg-secondary flex items-center justify-center overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={src} alt={`Avatar ${i+1}`} className="h-full w-full object-cover" loading="lazy" />
                    </div>
                  ))}
                </div>
                <p>
                  <span className="font-semibold text-white">1.247 ofertas</span>{" "}
                  validadas por marketers como você
                </p>
              </div>
            </div>

            {/* Coluna Direita: Mockup */}
            <div className="order-2 relative lg:h-[600px] flex items-center justify-center">
              <div
                className="animate-fade-in-up w-full max-w-[800px] lg:absolute lg:right-[-100px] xl:right-[-150px] top-1/2 lg:-translate-y-1/2 perspective-1000"
                style={{ animationDelay: "400ms" }}
              >
                <div className="transform-gpu lg:rotate-y-[-10deg] lg:rotate-x-[5deg] lg:rotate-z-[-2deg] transition-transform duration-500 hover:rotate-0">
                  {/* Desktop Mockup */}
                  <div className="hidden md:block">
                    <HeroMockup />
                  </div>
                  {/* Mobile Mockup */}
                  <div className="block md:hidden">
                    <MobileHeroMockup />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Social Proof Bar */}
      <SocialProofBar />

      <main className="flex-1 relative z-10 bg-black">

        {/* Seção de Dor */}
        <PainSection />

        {/* Seção Como Funciona */}
        <HowItWorksSection />

        {/* Bento Grid Features */}
        <section className="py-24 sm:py-32 bg-black border-y border-white/10 relative overflow-hidden">
          {/* Background: background-codigos.png preenchendo toda a seção */}
          <div className="pointer-events-none absolute inset-0 z-0 select-none overflow-hidden flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/background-codigos.png"
              alt=""
              className="w-full h-full object-cover object-center opacity-70 mix-blend-screen scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,#000000_90%)]" />
          </div>

          <div className="relative mx-auto max-w-[1400px] px-6 sm:px-8 lg:px-12 z-10">
            <Reveal>
              <div className="mb-16 md:w-1/2">
                <span className="inline-block text-xs font-bold uppercase tracking-widest text-primary mb-4">
                  Recursos
                </span>
                <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mb-4">
                  Uma máquina blindada para quem<br />roda tráfego direto.
                </h2>
                <p className="text-lg text-neutral-300">
                  Não é um construtor de sites. É um hospedador estratégico de ofertas.
                </p>
              </div>
            </Reveal>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

              {/* BENTO: Injeção HTML (Principal) */}
              <div className="md:col-span-8 flex">
                <Reveal delay={100} className="w-full">
                  <GlowCard className="h-full flex flex-col p-8 sm:p-10 justify-between gap-8 group bg-black/70 backdrop-blur-xl border border-white/15 hover:border-primary/40">
                    <div className="space-y-4 max-w-lg z-10 relative">
                      <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 text-accent mb-2">
                        <Code2 className="h-6 w-6" />
                      </div>
                      <h3 className="text-2xl font-bold text-white">
                        Deploy em 1 Segundo com {'{{'}FORM_SLOT{'}}'}
                      </h3>
                      <p className="text-neutral-300 leading-relaxed">
                        Nada de {"\u201Cdiv soup\u201D"} ou plugins pesados. Você hospeda HTML/CSS/JS estático. O servidor não processa nada, garantindo a nota máxima no Core Web Vitals do Google. O formulário é injetado automaticamente onde você colocar a tag.
                      </p>
                      <Link
                        href="/admin/login"
                        className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-accent transition-colors"
                      >
                        Testar o {'{{'}FORM_SLOT{'}}'}
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </Link>
                    </div>

                    <div className="relative w-full mt-auto p-4 rounded-xl bg-[#0d1117]/90 font-mono text-[12px] leading-relaxed text-gray-300 border border-white/10 shadow-inner z-10 overflow-hidden">
                      <div className="flex gap-1.5 mb-3 border-b border-white/5 pb-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-500/80"></div>
                        <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80"></div>
                        <div className="w-2.5 h-2.5 rounded-full bg-green-500/80"></div>
                      </div>
                      {[
                        <span key="c1" className="text-gray-500">{"<!-- index.html (Exportado do Webflow) -->"}</span>,
                        <span key="c2" className="text-blue-400">{"<section"}</span>,
                        <span key="c3" className="text-blue-200">{" class="}</span>,
                        <span key="c4" className="text-blue-300">{"\"hero-wrapper\""}</span>,
                        <span key="c5" className="text-blue-400">{">"}</span>,
                        <br key="b1" />,
                        <span key="c6" className="text-blue-400">{"  <div"}</span>,
                        <span key="c7" className="text-blue-200">{" class="}</span>,
                        <span key="c8" className="text-blue-300">{"\"container\""}</span>,
                        <span key="c9" className="text-blue-400">{">"}</span>,
                        <br key="b2" />,
                        <span key="c10" className="text-blue-400">{"    <h1>"}</span>,
                        <span key="c11">{"A Revelação Milionária"}</span>,
                        <span key="c12" className="text-blue-400">{"</h1>"}</span>,
                        <br key="b3" />,
                        <br key="b4" />,
                        <span key="c13" className="text-gray-500">{"    <!-- A Vórtex injeta o form aqui -->"}</span>,
                        <br key="b5" />,
                        <span key="c14" className="text-blue-400">{"    <div"}</span>,
                        <span key="c15" className="text-blue-200">{" class="}</span>,
                        <span key="c16" className="text-blue-300">{"\"form-container\""}</span>,
                        <span key="c17" className="text-blue-400">{">"}</span>,
                        <br key="b6" />,
                        <span key="c18" className="text-green-400 font-bold bg-green-400/10 px-1 rounded">{"{{FORM_SLOT}}"}</span>,
                        <br key="b7" />,
                        <span key="c19" className="text-blue-400">{"    </div>"}</span>,
                        <br key="b8" />,
                        <br key="b9" />,
                        <span key="c20" className="text-blue-400">{"  </div>"}</span>,
                        <br key="b10" />,
                        <span key="c21" className="text-blue-400">{"</section>"}</span>,
                      ]}
                    </div>
                  </GlowCard>
                </Reveal>
              </div>

              {/* BENTO: Blindagem Anti-Spy */}
              <div className="md:col-span-4 flex">
                <Reveal delay={200} className="w-full">
                  <GlowCard className="h-full flex flex-col p-8 bg-black/70 backdrop-blur-xl border border-white/15 hover:border-chart-1/40">
                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-chart-1/10 text-chart-1 mb-6 z-10 relative">
                      <Shield className="h-6 w-6" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-3 z-10 relative">
                      Proteção contra Scrappers
                    </h3>
                    <p className="text-neutral-300 text-sm leading-relaxed z-10 relative">
                      Esconda sua oferta vencedora. Links gerados com identificadores únicos ou domínios personalizados evitam que ferramentas de espionagem roubem seu layout e copy.
                    </p>
                  </GlowCard>
                </Reveal>
              </div>

              {/* BENTO: Métricas Real-Time */}
              <div className="md:col-span-4 flex">
                <Reveal delay={300} className="w-full">
                  <GlowCard className="h-full flex flex-col p-8 bg-black/70 backdrop-blur-xl border border-white/15 hover:border-chart-3/40">
                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-chart-3/10 text-chart-3 mb-6 z-10 relative">
                      <BarChart3 className="h-6 w-6" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-3 z-10 relative">
                      Métricas sem Delay
                    </h3>
                    <p className="text-neutral-300 text-sm leading-relaxed z-10 relative">
                      Acompanhe Pageviews, CTR e Leads capturados no exato milissegundo em que acontecem. Dados precisos para você desligar ou dobrar o orçamento da campanha.
                    </p>

                    <div className="mt-6 h-24 w-full rounded-lg bg-black/50 border border-white/10 p-2 flex flex-col justify-end z-10 relative overflow-hidden">
                       <div className="flex items-end h-full gap-1.5 w-[200%] animate-marquee">
                         {[40, 70, 45, 90, 65, 100, 50, 80, 40, 70, 45, 90, 65, 100, 50, 80].map((h, i) => (
                           <div key={i} className="flex-1 bg-chart-3/20 rounded-t-sm transition-colors" style={{ height: `${h}%` }}>
                             <div className="w-full bg-chart-3 rounded-t-sm" style={{ height: '2px' }} />
                           </div>
                         ))}
                       </div>
                    </div>
                  </GlowCard>
                </Reveal>
              </div>

              {/* BENTO: Escala com WhatsApp */}
              <div className="md:col-span-8 flex">
                <Reveal delay={400} className="w-full">
                  <GlowCard className="h-full flex flex-col p-8 sm:p-10 justify-between gap-8 group md:flex-row md:items-center bg-black/70 backdrop-blur-xl border border-white/15 hover:border-primary/40">
                    <div className="space-y-4 max-w-lg z-10 relative flex-1">
                      <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary mb-2">
                        <MessageSquareMore className="h-6 w-6" />
                      </div>
                      <h3 className="text-2xl font-bold text-white">
                        A oferta validou? Ligue a Máquina.
                      </h3>
                      <p className="text-neutral-300 leading-relaxed">
                        Quando a campanha tracionar, ligue nossa integração nativa. O Vórtex+ passa a criar grupos no seu próprio número, com travas de segurança e redirecionamento inteligente. Zero leads perdidos por lotação.
                      </p>
                    </div>

                    <div className="relative h-40 w-full md:w-64 shrink-0 mt-auto md:mt-0 rounded-xl border border-white/10 bg-black/50 overflow-hidden z-10 flex items-center justify-center">
                      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
                      <div className="flex gap-3 items-center z-10 relative">
                        <div className="h-12 w-12 rounded-full bg-chart-2/20 flex items-center justify-center border border-chart-2/30 animate-pulse">
                          <MessageSquareMore className="h-6 w-6 text-chart-2" />
                        </div>
                        <ArrowRight className="text-muted-foreground h-5 w-5" />
                        <div className="flex -space-x-3">
                          {[
                            "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=64&h=64&fit=crop&crop=faces&q=80",
                            "https://images.unsplash.com/photo-1552058544-f2b08422138a?w=64&h=64&fit=crop&crop=faces&q=80",
                            "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=64&h=64&fit=crop&crop=faces&q=80",
                          ].map((src, i) => (
                            <div key={i} className="h-10 w-10 rounded-full border-2 border-background bg-secondary flex items-center justify-center shadow-md transform transition-transform group-hover:translate-x-1 overflow-hidden">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={src} alt={`Group member ${i+1}`} className="h-full w-full object-cover" loading="lazy" />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </GlowCard>
                </Reveal>
              </div>
            </div>
          </div>
        </section>

        {/* Seção Inspire-SE — Templates da Comunidade */}
        <InspireSection />

        {/* Seção Casos de Uso */}
        <UseCasesSection />

        {/* Seção Mapa de Calor & Replays (Exclusivo ULTRA) */}
        <HeatmapSection />

        {/* Seção Comparação */}
        <ComparisonSection />

        {/* Seção Pricing */}
        <section className="py-24 sm:py-32 relative overflow-hidden bg-black border-y border-white/10">
          {/* Background: background-plans.png */}
          <div className="pointer-events-none absolute inset-0 z-0 select-none overflow-hidden flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/background-plans.png"
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
                  Planos
                </span>
                <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mb-4">
                  Planos simples e transparentes
                </h2>
                <p className="text-lg text-neutral-300">
                  Comece de graça, faça o upgrade quando o jogo ficar sério.
                </p>
              </div>
            </Reveal>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 items-start lg:px-12">
              {plans.map((plan, i) => (
                <Reveal key={plan.name} delay={i * 100} className={plan.highlight ? "md:-mt-4" : ""}>
                  <div
                    className={`relative flex flex-col p-6 sm:p-8 rounded-2xl sm:rounded-3xl transition-all duration-300 overflow-hidden ${
                      plan.highlight
                        ? "border border-primary/50 bg-black/85 shadow-2xl shadow-primary/20 ring-1 ring-primary/40 md:min-h-[520px] backdrop-blur-xl"
                        : "border border-white/15 bg-black/70 backdrop-blur-xl hover:border-white/30"
                    }`}
                  >
                    {/* Efeito Dot Grid Animado + Glow pulsante no Plano em Destaque */}
                    {plan.highlight && (
                      <>
                        <div className="absolute inset-0 pointer-events-none z-0">
                          <div className="absolute inset-0 opacity-40 mix-blend-screen">
                            <DotGrid />
                          </div>
                          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/70 to-black" />
                        </div>
                        <div className="absolute -inset-4 pointer-events-none z-0 bg-primary/10 blur-2xl animate-glow-pulse" />
                      </>
                    )}

                    <div className="relative z-10 flex flex-col h-full">
                      <div className="flex items-start justify-between gap-2 mb-6">
                        <div>
                          <h3 className={`text-xl font-bold ${plan.highlight ? 'text-primary' : 'text-white'}`}>
                            {plan.name}
                          </h3>
                          <p className="mt-2 text-xs sm:text-sm text-neutral-300 min-h-[36px] sm:min-h-[40px]">
                            {plan.description}
                          </p>
                        </div>
                        {plan.highlight && (
                          <span className="rounded-full bg-primary px-2.5 sm:px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-primary-foreground shadow-sm flex-shrink-0 whitespace-nowrap">
                            {plan.badge}
                          </span>
                        )}
                      </div>

                      <div className="mb-6 sm:mb-8">
                        <span className="text-3xl sm:text-4xl font-bold text-white">
                          {plan.price}
                        </span>
                        <span className="text-neutral-300 font-medium ml-1 text-sm sm:text-base">
                          {plan.period}
                        </span>
                      </div>

                      <ul className="mb-6 sm:mb-8 flex-1 space-y-3 sm:space-y-4">
                        {plan.features.map((feature) => (
                          <li key={feature} className="flex items-start gap-2.5 sm:gap-3">
                            <CheckCircle2 className={`h-4 w-4 sm:h-5 sm:w-5 shrink-0 mt-0.5 ${plan.highlight ? 'text-primary' : 'text-neutral-300'}`} />
                            <span className="text-xs sm:text-sm text-neutral-100 leading-snug">
                              {feature}
                            </span>
                          </li>
                        ))}
                      </ul>

                      <Link
                        href={plan.href}
                        className={`mt-auto inline-flex w-full items-center justify-center rounded-xl px-4 py-3 text-xs sm:text-sm font-semibold transition-all ${
                          plan.highlight
                            ? "bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98] shadow-md"
                            : "bg-white/10 text-white hover:bg-white/15 border border-white/15"
                        }`}
                      >
                        {plan.cta}
                      </Link>

                      <p className="mt-3 text-center text-[10px] sm:text-[11px] text-neutral-400">
                        7 dias de garantia · Cancele quando quiser
                      </p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* Seção FAQ */}
        <FaqSection />

        {/* CTA Final */}
        <FinalCta />

      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-black py-10 sm:py-12 relative z-10">
        <div className="mx-auto max-w-[1400px] px-6 sm:px-8 lg:px-12 flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
          <div className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/Vortex Padrão.svg" alt="Vórtex+" className="h-6 w-auto invert opacity-70" />
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
            <Link
              href="/docs"
              className="text-xs sm:text-sm text-neutral-400 hover:text-white transition-colors"
            >
              Docs
            </Link>
            <Link
              href="/templates"
              className="text-xs sm:text-sm text-neutral-400 hover:text-white transition-colors"
            >
              Templates
            </Link>
            <Link
              href="/privacy"
              className="text-xs sm:text-sm text-neutral-400 hover:text-white transition-colors"
            >
              Política de Privacidade
            </Link>
            <Link
              href="/admin/login"
              className="text-xs sm:text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
            >
              Começar grátis →
            </Link>
          </div>
          <p className="text-xs sm:text-sm text-neutral-500">
            &copy; {new Date().getFullYear()} Vórtex+. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}