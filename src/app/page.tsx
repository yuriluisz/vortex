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
  TrendingUp,
} from "lucide-react";
import { DotGrid } from "@/components/landing/dot-grid";
import { HeroMockup } from "@/components/landing/hero-mockup";
import { Reveal } from "@/components/landing/reveal";
import { GlowCard } from "@/components/landing/glow-card";

export default function Home() {
  const features = [
    {
      icon: Zap,
      title: "Captura Inteligente",
      description:
        "Formulários dinâmicos com schema configurável. Cada campanha tem sua própria página e regras — sem precisar de dev.",
    },
    {
      icon: Users,
      title: "Rotação de Grupos",
      description:
        "Distribui leads automaticamente entre grupos de WhatsApp com limite de capacidade. Um grupo lotou? O próximo entra em ação.",
    },
    {
      icon: BarChart3,
      title: "Métricas em Tempo Real",
      description:
        "Dashboard com contagens de leads, grupos ativos e campanhas em andamento. Saiba exatamente onde seu tráfego está indo.",
    },
    {
      icon: Shield,
      title: "Segurança 2FA",
      description:
        "Autenticação com OTP por e-mail, JWT seguro e proteção de rotas via middleware. Seus dados protegidos de ponta a ponta.",
    },
  ];

  const steps = [
    {
      icon: MousePointerClick,
      step: "01",
      title: "Página de Captura",
      description:
        "Cole o HTML da sua página pronta (Webflow, Figma, código) ou crie do zero. O Vórtex+ injeta o formulário automaticamente onde você marcar com {'{{'}FORM_SLOT{'}}'}.",
    },
    {
      icon: Database,
      step: "02",
      title: "Cofre de Leads",
      description:
        "Cada cadastro é salvo com segurança na sua base. Consulte, analise e use para vender no futuro — sem perder nenhum contato.",
    },
    {
      icon: RefreshCw,
      step: "03",
      title: "Rotação Automática",
      description:
        "O lead é redirecionado ao grupo do evento. Grupo encheu? O sistema manda os próximos para o seguinte, sozinho. Sem gargalos, sem perdas.",
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
        "3 grupos de WhatsApp",
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
      description: "Para lançamentos e campanhas sérias.",
      highlight: true,
      features: [
        "10 campanhas ativas",
        "Até 10.000 leads/mês",
        "50 grupos de WhatsApp",
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
      description: "Para agências e alto volume.",
      highlight: false,
      features: [
        "Campanhas ilimitadas",
        "Leads ilimitados",
        "Grupos ilimitados",
        "Domínio personalizado",
        "Sem marca Vórtex+",
        "Suporte dedicado 24h",
        "SLA de uptime",
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
            {/* Coluna Esquerda: Pain/Dor + Promessa + CTAs */}
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
                style={{ animationDelay: "80ms" }}
              >
                <TrendingUp className="h-3.5 w-3.5" />
                <span><strong>+12.500</strong> leads processados esse mês</span>
              </div>

              <h1
                className="animate-fade-in-up text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl xl:text-7xl leading-[1.08]"
                style={{ animationDelay: "150ms" }}
              >
                <span className="block">Seu grupo de WhatsApp</span>
                <span className="block">lotou e você <span className="text-primary">perdeu leads</span>?</span>
              </h1>

              <p
                className="animate-fade-in-up mt-6 text-lg leading-relaxed text-muted-foreground max-w-lg"
                style={{ animationDelay: "220ms" }}
              >
                O Vórtex+ captura contatos com formulários dinâmicos, guarda cada
                lead com segurança e distribui acessos aos seus grupos de WhatsApp
                <strong> automaticamente</strong> — sem código, sem integrações complicadas.
              </p>

              <div
                className="animate-fade-in-up mt-10 flex flex-col sm:flex-row items-start gap-4"
                style={{ animationDelay: "300ms" }}
              >
                <Link
                  href="/signup"
                  className="group inline-flex items-center gap-2 rounded-lg bg-primary px-7 py-3.5 text-sm font-semibold text-primary-foreground shadow-md transition-all duration-200 hover:bg-primary/90 hover:shadow-lg active:scale-[0.97]"
                >
                  Começar em 30s — grátis
                  <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                </Link>
                <a
                  href="#como-funciona"
                  className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-7 py-3.5 text-sm font-medium text-card-foreground transition-all duration-200 hover:bg-accent hover:text-accent-foreground active:scale-[0.97]"
                >
                  Como funciona
                </a>
              </div>

              {/* Click trigger */}
              <p
                className="animate-fade-in-up mt-3 text-xs text-muted-foreground"
                style={{ animationDelay: "350ms" }}
              >
                Plano gratuito — 1 campanha, 100 leads, sem cartão de crédito
              </p>
            </div>

            {/* Coluna Direita: Mockup */}
            <div
              className="animate-fade-in-up animate-float-slow order-2"
              style={{ animationDelay: "300ms" }}
            >
              <HeroMockup />
            </div>
          </div>
        </div>
      </header>

      {/* Como Funciona */}
      <section
        id="como-funciona"
        className="mx-auto max-w-5xl px-6 pb-24 scroll-mt-8"
      >
        <Reveal>
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-foreground">
              Como funciona
            </h2>
            <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
              Um funil completo em três etapas. Em menos de 5 minutos você tem
              sua primeira campanha no ar.
            </p>
          </div>
        </Reveal>

        <div className="relative mt-14 grid grid-cols-1 gap-10 sm:grid-cols-3 sm:gap-6">
          {/* Connector line */}
          <div className="pointer-events-none absolute left-0 right-0 top-6 hidden h-px bg-gradient-to-r from-transparent via-border to-transparent sm:block" />

          {steps.map((item, index) => (
            <Reveal key={item.step} delay={index * 120}>
              <div className="group relative text-center sm:text-left">
                <div className="relative z-10 mx-auto sm:mx-0 flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-card text-primary shadow-sm transition-all duration-200 group-hover:border-primary/40 group-hover:shadow-md group-hover:-translate-y-1">
                  <item.icon className="h-5 w-5 transition-transform duration-200 group-hover:scale-110" />
                </div>
                <p className="mt-4 text-xs font-semibold uppercase tracking-widest text-primary/70">
                  Passo {item.step}
                </p>
                <h3 className="mt-1 font-semibold text-foreground">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {item.description}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-5xl px-6 pb-24 w-full">
        <Reveal>
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight text-foreground">
              Tudo que você precisa para crescer
            </h2>
            <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
              Captura, distribuição e análise — o Vórtex+ faz o trabalho pesado
              para você focar no que importa: vender.
            </p>
          </div>
        </Reveal>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {features.map((feature, index) => (
            <Reveal key={feature.title} delay={index * 100}>
              <GlowCard className="group h-full rounded-xl border border-border bg-card p-6 shadow-sm transition-all duration-200 hover:shadow-md hover:border-primary/20 hover:-translate-y-1">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary transition-transform duration-200 group-hover:scale-110">
                    <feature.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-card-foreground group-hover:text-primary transition-colors duration-200">
                      {feature.title}
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </GlowCard>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Pricing Section */}
      <section id="precos" className="mx-auto max-w-5xl px-6 pb-24 w-full">
        <Reveal>
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight text-foreground">
              Planos que escalam com você
            </h2>
            <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
              Do teste ao enterprise. Sem armadilhas, sem surpresas.
            </p>
          </div>
        </Reveal>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-4">
          {plans.map((plan, index) => (
            <Reveal key={plan.name} delay={index * 100}>
              <div
                className={`relative flex flex-col rounded-2xl border p-6 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg ${
                  plan.highlight
                    ? "border-primary/50 bg-card shadow-md shadow-primary/5"
                    : "border-border bg-card shadow-sm"
                }`}
              >
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center rounded-full bg-primary px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-primary-foreground">
                    Mais popular
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="text-lg font-bold text-card-foreground">{plan.name}</h3>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-card-foreground">{plan.price}</span>
                    {plan.period && (
                      <span className="text-sm text-muted-foreground">{plan.period}</span>
                    )}
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{plan.description}</p>
                </div>

                <ul className="mb-8 flex-1 space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href={plan.href}
                  className={`inline-flex items-center justify-center rounded-lg px-4 py-3 text-sm font-semibold transition-all duration-200 active:scale-[0.97] ${
                    plan.highlight
                      ? "bg-primary text-primary-foreground shadow-md hover:bg-primary/90 hover:shadow-lg"
                      : "border border-border bg-background text-card-foreground hover:bg-accent hover:text-accent-foreground"
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Social Proof / Stats */}
      <section className="mx-auto max-w-5xl px-6 pb-24 w-full">
        <Reveal>
          <div className="rounded-2xl border border-border bg-card px-8 py-12">
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-3 text-center">
              <div>
                <p className="text-3xl font-bold text-foreground tabular-nums">+12.500</p>
                <p className="mt-1 text-sm text-muted-foreground">Leads processados esse mês</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-foreground tabular-nums">+230</p>
                <p className="mt-1 text-sm text-muted-foreground">Campanhas criadas</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-foreground tabular-nums">99,9%</p>
                <p className="mt-1 text-sm text-muted-foreground">Uptime do sistema</p>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* CTA Final */}
      <section className="mx-auto max-w-5xl px-6 pb-24 w-full">
        <Reveal>
          <div className="relative overflow-hidden rounded-2xl border border-border bg-card px-6 py-14 text-center">
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute left-1/2 top-0 h-64 w-[480px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/15 blur-[96px]" />
            </div>
            <div className="relative">
              <h2 className="text-2xl font-bold tracking-tight text-card-foreground sm:text-3xl">
                Pronto para capturar cada oportunidade?
              </h2>
              <p className="mt-3 text-muted-foreground max-w-lg mx-auto">
                Crie sua primeira campanha em minutos. Plano gratuito disponível —
                sem cartão de crédito.
              </p>
              <Link
                href="/signup"
                className="mt-8 inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-md transition-all duration-200 hover:bg-primary/90 hover:shadow-lg active:scale-[0.97]"
              >
                Começar agora — grátis
                <ArrowRight className="h-4 w-4" />
              </Link>
              <p className="mt-2 text-xs text-muted-foreground">
                1 campanha, 100 leads, sem cartão de crédito
              </p>
            </div>
          </div>
        </Reveal>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-border bg-card/50 px-6 py-6">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-3 sm:flex-row">
          <div className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/Vortex Padrão.svg" alt="Vórtex+" className="h-7 w-auto invert opacity-70" />
            <span className="text-xs text-muted-foreground">
              &copy; {new Date().getFullYear()}
            </span>
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <Link
              href="/docs"
              className="transition-colors duration-200 hover:text-foreground"
            >
              Documentação
            </Link>
            <Link
              href="/admin/login"
              className="transition-colors duration-200 hover:text-foreground"
            >
              Painel
            </Link>
            <Link
              href="#precos"
              className="transition-colors duration-200 hover:text-foreground"
            >
              Preços
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}