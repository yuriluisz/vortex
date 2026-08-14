import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, Sparkles, Store } from "lucide-react";

export const metadata: Metadata = {
  title: "Documentação Oficial — Vórtex+",
  description:
    "Guia completo e documentação oficial da plataforma Vórtex+. Aprenda a criar campanhas, configurar formulários dinâmicos, integrar WhatsApp e gerenciar templates.",
};

export default function PublicDocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-primary/30">
      {/* Top Navbar */}
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Logo & Badge */}
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/Vortex Padrão.svg"
                alt="Vórtex+"
                className="h-6 w-auto invert opacity-90 transition-opacity group-hover:opacity-100"
              />
            </Link>
            <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
              <BookOpen className="w-3 h-3" />
              Docs
            </span>
          </div>

          {/* Nav Links */}
          <nav className="flex items-center gap-4 sm:gap-6">
            <Link
              href="/"
              className="text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Início
            </Link>
            <Link
              href="/templates"
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <Store className="w-3.5 h-3.5" />
              Templates
            </Link>
            <Link
              href="/admin/login"
              className="text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Entrar
            </Link>
            <Link
              href="/admin/login?mode=register"
              className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-1.5 text-xs sm:text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 hover:scale-105 active:scale-95 shadow-md shadow-primary/20"
            >
              <span>Começar grátis</span>
              <ArrowRight className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/60 bg-card/30 py-10 relative z-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/Vortex Padrão.svg"
              alt="Vórtex+"
              className="h-5 w-auto invert opacity-40"
            />
          </div>
          <div className="flex items-center gap-6 text-xs text-muted-foreground">
            <Link href="/" className="hover:text-foreground transition-colors">
              Início
            </Link>
            <Link href="/templates" className="hover:text-foreground transition-colors">
              Templates
            </Link>
            <Link href="/privacy" className="hover:text-foreground transition-colors">
              Política de Privacidade
            </Link>
            <Link href="/admin/login" className="hover:text-foreground transition-colors font-medium text-primary">
              Acessar Painel →
            </Link>
          </div>
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} Vórtex+. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
