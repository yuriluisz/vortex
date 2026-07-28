"use client";

import { useEffect, useState } from "react";

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
        <div className="mb-6 text-6xl">⚠️</div>
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
          className="mt-6 inline-block rounded-lg bg-white/10 px-6 py-3 text-sm font-semibold text-white transition-all duration-200 hover:bg-white/20"
        >
          🔄 Tentar Novamente
        </button>
      </div>
    </div>
  );
}