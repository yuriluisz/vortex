import Link from "next/link";
import {
  Zap,
  Users,
  BarChart3,
  Shield,
  ArrowRight,
  MousePointerClick,
  Database,
  RefreshCw,
  CheckCircle2,
  MessageSquareMore,
  Code2,
  Lock,
  Layers,
  Network
} from "lucide-react";
import { DotGrid } from "@/components/landing/dot-grid";
import { HeroMockup } from "@/components/landing/hero-mockup";
import { MobileHeroMockup } from "@/components/landing/mobile-hero-mockup";
import { Reveal } from "@/components/landing/reveal";
import { GlowCard } from "@/components/landing/glow-card";

export default function Home() {
  const steps = [
    {
      icon: Code2,
      step: "01",
      title: "Injete seu HTML",
      description:
        "Pegue a sua landing page feita no Webflow, Figma ou VSCode e cole na Vórtex. Adicione a tag {{FORM_SLOT}} onde quiser que o formulário apareça.",
    },
    {
      icon: MessageSquareMore,
      step: "02",
      title: "Conecte o WhatsApp",
      description:
        "Crie dezenas de grupos VIP de forma 100% automática, já com configurações de segurança ativadas (somente admins).",
    },
    {
      icon: Network,
      step: "03",
      title: "Roteamento Inteligente",
      description:
        "Divulgue o seu link. O sistema captura o lead, envia para o grupo ativo e, assim que lotar, o redirecionamento muda para o próximo sozinho.",
    },
  ];

  const plans = [
    {
      name: "Free",
      price: "Grátis",
      period: "",
      description: "Para testar e validar sua ideia.",
      highlight: false,
      features: [
        "1 campanha ativa",
        "Até 100 leads/mês",
        "3 grupos de WhatsApp (Manual)",
        "Formulário dinâmico",
        "Marca Vórtex+",
      ],
      cta: "Começar grátis",
      href: "/signup",
    },
    {
      name: "Pro",
      price: "R$ 97",
      period: "/mês",
      description: "Para pequenos lançamentos.",
      highlight: false,
      features: [
        "10 campanhas ativas",
        "Até 10.000 leads/mês",
        "50 grupos de WhatsApp (Manual)",
        "Domínio personalizado",
        "Sem marca Vórtex+",
        "Suporte prioritário (chat)",
      ],
      cta: "Assinar Pro",
      href: "/signup",
    },
    {
      name: "Ultra",
      price: "R$ 157",
      period: "/mês",
      description: "WhatsApp API + Automação total.",
      highlight: true, // featured com dot grid
      features: [
        "Campanhas ilimitadas",
        "Leads ilimitados",
        "Grupos ilimitados",
        "Automação de WhatsApp (API)",
        "Criação de Grupos em Massa",
        "Domínio personalizado",
        "Suporte dedicado 24h",
      ],
      cta: "Assinar Ultra",
      href: "/signup",
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Hero Section */}
      <header className="relative overflow-hidden">
        {/* Background effects: dot grid interativo + glows */}
        <div className="pointer-events-none absolute inset-0">
          <DotGrid />
          <div className="absolute -left-1/4 -top-1/4 h-[600px] w-[600px] rounded-full bg-primary/10 blur-[128px]" />
          <div className="absolute -bottom-1/4 -right-1/4 h-[600px] w-[600px] rounded-full bg-accent/15 blur-[128px]" />
        </div>

        <div className="relative mx-auto max-w-[1400px] px-6 pt-24 pb-16 sm:px-8 sm:pt-32 sm:pb-24 lg:px-12">
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

              {/* Badge de prova social */}
              <div
                className="animate-fade-in-up inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3.5 py-1.5 text-xs font-medium text-primary mb-6"
                style={{ animationDelay: "100ms" }}
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
                Integração nativa com WhatsApp API 🚀
              </div>

              <h1
                className="animate-fade-in-up text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-[1.1] mb-6"
                style={{ animationDelay: "200ms" }}
              >
                Automatize seus lançamentos e capture leads{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
                  sem gargalos.
                </span>
              </h1>
              
              <p
                className="animate-fade-in-up text-lg text-muted-foreground mb-8 max-w-[540px] leading-relaxed"
                style={{ animationDelay: "300ms" }}
              >
                Chega de criar grupos na mão e perder leads por lotação. Conecte seu WhatsApp, crie dezenas de grupos em massa com travas automáticas de segurança, e deixe o algoritmo rotear cada clique perfeitamente.
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
                  <span className="relative">Começar Gratuitamente</span>
                  <ArrowRight className="relative h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
                <Link
                  href="/admin/login"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-secondary px-8 py-3.5 text-sm font-semibold text-secondary-foreground transition-colors hover:bg-secondary/80 border border-border"
                >
                  Acessar Painel
                </Link>
              </div>

              <div className="animate-fade-in-up mt-10 flex items-center gap-4 text-sm text-muted-foreground" style={{ animationDelay: "500ms" }}>
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-8 w-8 rounded-full border-2 border-background bg-secondary flex items-center justify-center">
                      <Users className="h-3.5 w-3.5 text-muted-foreground/50" />
                    </div>
                  ))}
                </div>
                <p>Junte-se a <span className="font-semibold text-foreground">centenas</span> de produtores e agências.</p>
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

      <main className="flex-1 relative z-10 bg-background/50 backdrop-blur-3xl border-t border-border/50">
        
        {/* Seção Como Funciona */}
        <section className="py-24 sm:py-32 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-accent/5 rounded-full blur-[120px] -translate-y-1/2 pointer-events-none" />
          
          <div className="mx-auto max-w-[1400px] px-6 sm:px-8 lg:px-12 relative z-10">
            <Reveal>
              <div className="text-center max-w-2xl mx-auto mb-16">
                <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mb-4">
                  O fluxo perfeito para o seu lançamento
                </h2>
                <p className="text-lg text-muted-foreground">
                  Da criação da página à gestão dos grupos, tudo funciona em sincronia.
                </p>
              </div>
            </Reveal>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
              {/* Linha conectora desktop */}
              <div className="hidden md:block absolute top-12 left-[15%] right-[15%] h-px bg-gradient-to-r from-transparent via-border to-transparent" />
              
              {steps.map((step, i) => (
                <Reveal key={step.title} delay={i * 100}>
                  <div className="relative flex flex-col items-center text-center p-6 group">
                    <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-secondary border border-border shadow-sm group-hover:scale-110 transition-transform duration-300 relative z-10">
                      <step.icon className="h-8 w-8 text-primary group-hover:text-accent transition-colors duration-300" />
                      <div className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-primary text-[10px] font-bold text-primary-foreground flex items-center justify-center">
                        {step.step}
                      </div>
                    </div>
                    <h3 className="mb-3 text-xl font-semibold text-foreground">
                      {step.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* Bento Grid Features */}
        <section className="py-24 sm:py-32 bg-secondary/30 border-y border-border/50 relative">
          <div className="mx-auto max-w-[1400px] px-6 sm:px-8 lg:px-12">
            <Reveal>
              <div className="mb-16 md:w-1/2">
                <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mb-4">
                  Tudo que você precisa,<br />em uma única plataforma
                </h2>
                <p className="text-lg text-muted-foreground">
                  Adeus ferramentas complexas. O Vórtex junta criação de landing pages e roteamento inteligente em um único lugar.
                </p>
              </div>
            </Reveal>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              
              {/* BENTO: Automação WhatsApp (Principal) */}
              <div className="md:col-span-8 flex">
                <Reveal delay={100} className="w-full">
                  <GlowCard className="h-full flex flex-col p-8 sm:p-10 justify-between gap-8 group">
                    <div className="space-y-4 max-w-lg z-10 relative">
                      <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary mb-2">
                        <MessageSquareMore className="h-6 w-6" />
                      </div>
                      <h3 className="text-2xl font-bold text-foreground">
                        Automação Suprema de WhatsApp
                      </h3>
                      <p className="text-muted-foreground leading-relaxed">
                        Esqueça a criação manual. Com um clique, gere dezenas de grupos já configurados com nome, imagem, descrição e travas de segurança (somente administradores). A integração nativa usa o seu próprio número de forma invisível.
                      </p>
                    </div>
                    <div className="relative h-48 w-full mt-auto rounded-xl border border-border/50 bg-background overflow-hidden z-10 flex items-center justify-center">
                      {/* Abstract visual para o whatsapp */}
                      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
                      <div className="flex gap-4 items-center z-10 relative">
                        <div className="h-16 w-16 rounded-full bg-chart-2/20 flex items-center justify-center border border-chart-2/30 animate-pulse">
                          <MessageSquareMore className="h-8 w-8 text-chart-2" />
                        </div>
                        <ArrowRight className="text-muted-foreground h-6 w-6" />
                        <div className="flex -space-x-4">
                          {[1,2,3,4].map(i => (
                            <div key={i} className="h-12 w-12 rounded-full border-4 border-background bg-secondary flex items-center justify-center shadow-lg transform transition-transform group-hover:translate-x-2">
                              <Users className="h-4 w-4 text-muted-foreground" />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </GlowCard>
                </Reveal>
              </div>

              {/* BENTO: Formulários Dinâmicos */}
              <div className="md:col-span-4 flex">
                <Reveal delay={200} className="w-full">
                  <GlowCard className="h-full flex flex-col p-8 bg-gradient-to-br from-card to-secondary/20">
                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 text-accent mb-6 z-10 relative">
                      <Code2 className="h-6 w-6" />
                    </div>
                    <h3 className="text-xl font-bold text-foreground mb-3 z-10 relative">
                      Injeção de Formulários HTML
                    </h3>
                    <p className="text-muted-foreground text-sm leading-relaxed mb-6 z-10 relative">
                      Crie qualquer design no Figma ou Webflow. Apenas cole o código na Vórtex e insira a tag <code>{"{{FORM_SLOT}}"}</code>. O formulário é injetado magicamente, sem precisar tocar em JavaScript.
                    </p>
                    <div className="mt-auto p-4 rounded-lg bg-black/80 font-mono text-xs text-green-400 border border-white/10 shadow-inner z-10 relative">
                      &lt;div id="lead-area"&gt;<br/>
                      &nbsp;&nbsp;{'{{'}FORM_SLOT{'}}'}<br/>
                      &lt;/div&gt;
                    </div>
                  </GlowCard>
                </Reveal>
              </div>

              {/* BENTO: Cofre de Leads */}
              <div className="md:col-span-4 flex">
                <Reveal delay={300} className="w-full">
                  <GlowCard className="h-full flex flex-col p-8">
                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-chart-1/10 text-chart-1 mb-6 z-10 relative">
                      <Database className="h-6 w-6" />
                    </div>
                    <h3 className="text-xl font-bold text-foreground mb-3 z-10 relative">
                      Cofre Seguro de Leads
                    </h3>
                    <p className="text-muted-foreground text-sm leading-relaxed z-10 relative">
                      Seus leads não se perdem em planilhas soltas. Tudo é registrado no painel central com exportação nativa em CSV. Dados sempre protegidos por isolamento de tenant.
                    </p>
                  </GlowCard>
                </Reveal>
              </div>

              {/* BENTO: Métricas Real-Time */}
              <div className="md:col-span-8 flex">
                <Reveal delay={400} className="w-full">
                  <GlowCard className="h-full flex flex-col p-8 sm:p-10 justify-between gap-8 md:flex-row md:items-center">
                    <div className="space-y-4 flex-1 z-10 relative">
                      <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-chart-3/10 text-chart-3 mb-2">
                        <BarChart3 className="h-6 w-6" />
                      </div>
                      <h3 className="text-2xl font-bold text-foreground">
                        Métricas ao Vivo
                      </h3>
                      <p className="text-muted-foreground leading-relaxed">
                        Acompanhe cada conversão, clique e loteamento de grupos no instante em que acontecem. Gráficos limpos que te mostram o pulso do seu lançamento sem delay.
                      </p>
                    </div>
                    <div className="w-full md:w-64 h-40 rounded-xl bg-background border border-border/50 p-4 flex flex-col justify-end gap-2 shrink-0 z-10 relative">
                       {/* Falso grafico de barras */}
                       <div className="flex items-end justify-between h-full gap-2 px-2">
                         {[40, 70, 45, 90, 65, 100].map((h, i) => (
                           <div key={i} className="w-full bg-chart-3/20 rounded-t-sm hover:bg-chart-3/50 transition-colors" style={{ height: `${h}%` }}>
                             <div className="w-full bg-chart-3 rounded-t-sm" style={{ height: '4px' }} />
                           </div>
                         ))}
                       </div>
                    </div>
                  </GlowCard>
                </Reveal>
              </div>
            </div>
          </div>
        </section>

        {/* Seção Pricing */}
        <section className="py-24 sm:py-32 relative overflow-hidden">
          <div className="mx-auto max-w-[1400px] px-6 sm:px-8 lg:px-12">
            <Reveal>
              <div className="text-center max-w-2xl mx-auto mb-16">
                <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mb-4">
                  Planos simples e transparentes
                </h2>
                <p className="text-lg text-muted-foreground">
                  Comece de graça, faça o upgrade quando o jogo ficar sério.
                </p>
              </div>
            </Reveal>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start lg:px-12">
              {plans.map((plan, i) => (
                <Reveal key={plan.name} delay={i * 100} className={plan.highlight ? "md:-mt-4" : ""}>
                  <div
                    className={`relative flex flex-col rounded-3xl p-8 transition-all duration-300 overflow-hidden ${
                      plan.highlight
                        ? "border border-primary/50 bg-background shadow-2xl shadow-primary/10 ring-1 ring-primary/20 md:min-h-[520px]"
                        : "border border-border bg-card/50 hover:border-border/80"
                    }`}
                  >
                    {/* Efeito Dot Grid Animado no Plano em Destaque */}
                    {plan.highlight && (
                      <div className="absolute inset-0 pointer-events-none z-0">
                        <div className="absolute inset-0 opacity-40 mix-blend-screen">
                          <DotGrid />
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/70 to-background" />
                      </div>
                    )}

                    <div className="relative z-10 flex flex-col h-full">
                      {plan.highlight && (
                        <span className="absolute -top-3 right-0 rounded-full bg-primary px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-primary-foreground shadow-sm">
                          O Mais Completo
                        </span>
                      )}

                      <div className="mb-6">
                        <h3 className={`text-xl font-bold ${plan.highlight ? 'text-primary' : 'text-foreground'}`}>
                          {plan.name}
                        </h3>
                        <p className="mt-2 text-sm text-muted-foreground min-h-[40px]">
                          {plan.description}
                        </p>
                      </div>

                      <div className="mb-8">
                        <span className="text-4xl font-bold text-foreground">
                          {plan.price}
                        </span>
                        <span className="text-muted-foreground font-medium ml-1">
                          {plan.period}
                        </span>
                      </div>

                      <ul className="mb-8 flex-1 space-y-4">
                        {plan.features.map((feature) => (
                          <li key={feature} className="flex items-start gap-3">
                            <CheckCircle2 className={`h-5 w-5 shrink-0 ${plan.highlight ? 'text-primary' : 'text-muted-foreground'}`} />
                            <span className="text-sm text-foreground/80 leading-snug">
                              {feature}
                            </span>
                          </li>
                        ))}
                      </ul>

                      <Link
                        href={plan.href}
                        className={`mt-auto inline-flex w-full items-center justify-center rounded-xl px-4 py-3 text-sm font-semibold transition-all ${
                          plan.highlight
                            ? "bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98] shadow-md"
                            : "bg-secondary text-secondary-foreground hover:bg-accent hover:text-accent-foreground border border-border"
                        }`}
                      >
                        {plan.cta}
                      </Link>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

      </main>

      {/* Footer simples */}
      <footer className="border-t border-border bg-background py-12 relative z-10">
        <div className="mx-auto max-w-[1400px] px-6 sm:px-8 lg:px-12 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/Vortex Padrão.svg" alt="Vórtex+" className="h-6 w-auto invert opacity-50" />
          </div>
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Vórtex+. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}