"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface BlockedPageProps {
  slug: string;
}

/**
 * Tela de bloqueio exibida quando a campanha está indisponível.
 * Mostra um contador de 10 segundos e redireciona automaticamente
 * para a página da campanha.
 */
export default function BlockedPage({ slug }: BlockedPageProps) {
  const [seconds, setSeconds] = useState(10);

  useEffect(() => {
    const interval = setInterval(() => {
      setSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          window.location.href = `/${slug}`;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [slug]);

  function handleRetry() {
    window.location.href = `/${slug}`;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4">
      <div className="max-w-md text-center">
        <div className="mb-6 flex justify-center">
          <div className="rounded-2xl bg-amber-500/10 p-4 border border-amber-500/20">
            <AlertTriangle className="h-12 w-12 text-amber-500" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-white">
          Página Indisponível
        </h1>
        <p className="mt-3 text-zinc-400">
          Esta página está temporariamente fora do ar.
        </p>
        <p className="mt-2 text-sm text-zinc-500">
          Redirecionando para a página da campanha em {seconds} segundos...
        </p>
        <button
          onClick={handleRetry}
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-white/10 px-6 py-3 text-sm font-semibold text-white transition-all duration-200 hover:bg-white/20"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Tentar Novamente</span>
        </button>
      </div>
    </div>
  );
}