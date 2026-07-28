"use client";

import { useEffect, useRef } from "react";

interface RedirectClientProps {
  groupUrl: string | null;
  slug: string;
}

/**
 * Componente client-side que redireciona o usuário para o grupo do WhatsApp.
 * O MetaPixel já disparou o evento CompleteRegistration, então este componente
 * apenas executa o redirect (ou mostra o fallback se não houver grupo).
 */
export default function RedirectClient({ groupUrl, slug }: RedirectClientProps) {
  const redirected = useRef(false);

  useEffect(() => {
    if (redirected.current) return;
    redirected.current = true;

    if (groupUrl) {
      // Pequeno delay para garantir que o evento CompleteRegistration subiu
      setTimeout(() => {
        window.location.href = groupUrl;
      }, 500);
    }
  }, [groupUrl]);

  // Se não tem grupo, mostra fallback (mesmo visual de antes)
  if (!groupUrl) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="max-w-md text-center">
          <div className="mb-6 text-6xl">⏳</div>
          <h1 className="text-2xl font-bold text-foreground">
            Grupos temporariamente indisponíveis
          </h1>
          <p className="mt-3 text-muted-foreground">
            Todos os grupos desta campanha estão cheios no momento.
            Tente novamente em alguns instantes.
          </p>
          <a
            href={`/${slug}`}
            className="mt-6 inline-block rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-all duration-200 hover:bg-primary/90"
          >
            Voltar à página
          </a>
        </div>
      </div>
    );
  }

  // Tela de carregamento enquanto redireciona
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <div className="mb-6 text-6xl animate-pulse">🔄</div>
        <h1 className="text-2xl font-bold text-foreground">
          Redirecionando...
        </h1>
        <p className="mt-3 text-muted-foreground">
          Você está sendo redirecionado para o grupo do WhatsApp.
        </p>
      </div>
    </div>
  );
}