"use client";

import { useState, useEffect, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { WifiOff, X } from "lucide-react";

interface WhatsAppStatusToastProps {
  plan: string;
}

/**
 * Toast global que aparece quando o WhatsApp está desconectado.
 * Faz polling a cada 30s e só aparece para tenants ULTRA com instância configurada.
 */
export function WhatsAppStatusToast({ plan }: WhatsAppStatusToastProps) {
  const [isOffline, setIsOffline] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  // Não mostrar se não é ULTRA
  const isUltra = plan === "ULTRA";

  // Não mostrar na própria página de config
  const isOnConfigPage = pathname?.startsWith("/admin/whatsapp/config");

  const checkStatus = useCallback(async () => {
    if (!isUltra) return;

    try {
      const res = await fetch("/api/whatsapp/status", {
        cache: "no-store",
      });
      const data = await res.json();

      if (data.hasFeature && data.configured && !data.connected) {
        setIsOffline(true);
        setIsDismissed(false); // Resetar dismiss quando detectar offline
      } else {
        setIsOffline(false);
      }
    } catch {
      // Silently fail
    }
  }, [isUltra]);

  // Polling a cada 30s
  useEffect(() => {
    if (!isUltra) return;

    let ignore = false;
    const runCheck = async () => {
      if (!ignore) {
        await checkStatus();
      }
    };

    runCheck();
    const interval = setInterval(runCheck, 30_000);

    return () => {
      ignore = true;
      clearInterval(interval);
    };
  }, [isUltra, checkStatus]);

  // Animação de entrada
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isOffline && !isDismissed && !isOnConfigPage) {
      timer = setTimeout(() => setIsVisible(true), 100);
    } else {
      timer = setTimeout(() => setIsVisible(false), 0);
    }
    return () => clearTimeout(timer);
  }, [isOffline, isDismissed, isOnConfigPage]);

  if (!isUltra || !isOffline || isDismissed || isOnConfigPage) {
    return null;
  }

  return (
    <div
      className={`fixed bottom-22 right-6 z-[100] transition-all duration-500 ease-out ${
        isVisible
          ? "translate-y-0 opacity-100 scale-100"
          : "translate-y-4 opacity-0 scale-95"
      }`}
    >
      <div
        role="button"
        tabIndex={0}
        onClick={() => router.push("/admin/whatsapp/config")}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            router.push("/admin/whatsapp/config");
          }
        }}
        className="group flex items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/10 backdrop-blur-xl px-5 py-4 shadow-2xl shadow-destructive/10 cursor-pointer transition-all duration-200 hover:bg-destructive/15 hover:border-destructive/50 hover:shadow-destructive/20 hover:scale-[1.02] active:scale-[0.98]"
      >
        {/* Ícone pulsante */}
        <div className="relative flex-shrink-0">
          <WifiOff className="h-5 w-5 text-destructive" />
          <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-destructive animate-pulse" />
        </div>

        {/* Texto */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-destructive">
            WhatsApp desconectado
          </p>
          <p className="text-xs text-destructive/70 mt-0.5">
            Clique para reconectar
          </p>
        </div>

        {/* Botão fechar */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsDismissed(true);
          }}
          className="flex-shrink-0 p-1 rounded-lg text-destructive/50 hover:text-destructive hover:bg-destructive/10 transition-colors"
          aria-label="Fechar aviso"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
