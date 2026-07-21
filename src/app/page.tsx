import Link from "next/link";
import { Zap, Users, BarChart3, Shield, ArrowRight } from "lucide-react";

export default function Home() {
  const features = [
    {
      icon: Zap,
      title: "Captura Inteligente",
      description: "Formulários dinâmicos com schema configurável. Cada campanha tem sua própria página e regras.",
    },
    {
      icon: Users,
      title: "Rotação de Grupos",
      description: "Distribui leads automaticamente entre grupos de WhatsApp com limite de capacidade.",
    },
    {
      icon: BarChart3,
      title: "Métricas em Tempo Real",
      description: "Dashboard com contagens de leads, grupos ativos e campanhas em andamento.",
    },
    {
      icon: Shield,
      title: "Segurança 2FA",
      description: "Autenticação com OTP por e-mail, JWT seguro e proteção de rotas via middleware.",
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Hero Section */}
      <header className="relative overflow-hidden">
        {/* Background effects */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-1/4 -top-1/4 h-[600px] w-[600px] rounded-full bg-primary/10 blur-[128px]" />
          <div className="absolute -bottom-1/4 -right-1/4 h-[600px] w-[600px] rounded-full bg-accent/15 blur-[128px]" />
        </div>

        <div className="relative mx-auto max-w-5xl px-6 py-32 text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs font-medium text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            Gerenciador de Lançamentos
          </div>

          <h1 className="text-5xl font-bold tracking-tight text-foreground sm:text-6xl">
            Vórtex
            <span className="text-primary">+</span>
          </h1>

          <p className="mt-6 text-lg leading-relaxed text-muted-foreground max-w-2xl mx-auto">
            Plataforma de captação de leads com formulários dinâmicos e rotação automática de grupos WhatsApp. 
            Crie campanhas, capture dados e distribua acessos — tudo em um único sistema.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/admin"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-md transition-all hover:bg-primary/90"
            >
              Acessar Painel
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/docs"
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-6 py-3 text-sm font-medium text-card-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              Documentação
            </Link>
          </div>
        </div>
      </header>

      {/* Features */}
      <section className="mx-auto max-w-5xl px-6 pb-32">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group rounded-xl border border-border bg-card p-6 shadow-sm transition-all duration-300 hover:shadow-md hover:border-primary/20"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <feature.icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-card-foreground group-hover:text-primary transition-colors">
                    {feature.title}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-border bg-card/50 px-6 py-6">
        <p className="text-center text-xs text-muted-foreground">
          Vórtex+ — Gerenciador de Lançamentos &copy; {new Date().getFullYear()}
        </p>
      </footer>
    </div>
  );
}
