"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, Loader2, ArrowRight, XCircle, RefreshCw } from "lucide-react";
import { verifyPaymentAction } from "../actions";

export default function CheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const status = searchParams.get("status");
  const [countdown, setCountdown] = useState(6);
  const [pollStatus, setPollStatus] = useState<"polling" | "success" | "error" | "idle">("idle");
  const [pollMessage, setPollMessage] = useState<string | null>(null);
  const pollingRef = useRef(false);
  const pollCountRef = useRef(0);

  // Redirect se não tem status
  useEffect(() => {
    if (!status) {
      router.push("/admin/settings?tab=subscription");
    }
  }, [status, router]);

  // Polling automático: verifica pagamento a cada 5s
  useEffect(() => {
    if (status !== "success") return;

    const doPolling = async () => {
      if (pollingRef.current) return;
      pollingRef.current = true;

      try {
        const result = await verifyPaymentAction();
        if (result?.success) {
          setPollStatus("success");
          setPollMessage("Pagamento confirmado! Plano ativado.");
          return; // Para o polling
        }
        if (result?.error) {
          pollCountRef.current += 1;
          // Só mostra erro depois de 3 tentativas (15s)
          if (pollCountRef.current > 3) {
            setPollStatus("error");
            setPollMessage(result.error);
          }
        }
      } catch {
        pollCountRef.current += 1;
        if (pollCountRef.current > 3) {
          setPollStatus("error");
          setPollMessage("Não foi possível verificar o pagamento.");
        }
      } finally {
        pollingRef.current = false;
      }
    };

    // Primeira verificação imediata
    doPolling();

    // Polling a cada 5s
    const interval = setInterval(doPolling, 5000);

    return () => clearInterval(interval);
  }, [status]);

  // Countdown + redirect após sucesso
  useEffect(() => {
    if (pollStatus !== "success") return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          router.push("/admin/settings?tab=subscription");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [pollStatus, router]);

  const handleCheckNow = async () => {
    setPollStatus("idle");
    setPollMessage(null);
    pollCountRef.current = 0;

    const result = await verifyPaymentAction();
    if (result?.success) {
      setPollStatus("success");
      setPollMessage("Pagamento confirmado! Plano ativado.");
    } else if (result?.error) {
      setPollStatus("error");
      setPollMessage(result.error);
    } else {
      setPollMessage("Pagamento ainda não confirmado. O sistema continuará verificando automaticamente.");
    }
  };

  if (status === "success") {
    return (
      <div className="mx-auto max-w-md mt-20 text-center">
        <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-emerald-500/10 p-4">
              <CheckCircle2 className="h-10 w-10 text-emerald-500" />
            </div>
          </div>

          <h1 className="text-2xl font-bold text-card-foreground mb-2">
            Pagamento processado! 🎉
          </h1>
          <p className="text-sm text-muted-foreground mb-6">
            Seu pagamento está sendo confirmado. O plano será ativado assim que a confirmação for recebida.
          </p>

          {/* Status do polling */}
          {pollStatus === "success" && (
            <div className="mb-6 text-sm text-emerald-600 font-medium">
              {pollMessage}
            </div>
          )}

          {/* Progresso de redirect */}
          {pollStatus === "success" && (
            <>
              <div className="mb-6">
                <div className="flex justify-center gap-1 mb-2">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div
                      key={i}
                      className={`h-1.5 w-8 rounded-full transition-all duration-300 ${
                        i < 6 - countdown ? "bg-primary" : "bg-muted"
                      }`}
                    />
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Redirecionando em {countdown} segundo{countdown !== 1 ? "s" : ""}...
                </p>
              </div>

              <button
                onClick={() => router.push("/admin/settings?tab=subscription")}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90"
              >
                Ir para assinatura
                <ArrowRight className="h-4 w-4" />
              </button>
            </>
          )}

          {/* Ainda verificando */}
          {pollStatus === "idle" && (
            <div className="mb-6">
              <div className="flex justify-center mb-3">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
              <p className="text-xs text-muted-foreground">
                Verificando pagamento automaticamente...
              </p>
            </div>
          )}

          {/* Mensagem de erro no polling */}
          {pollStatus === "error" && (
            <div className="mb-6">
              <p className="text-xs text-muted-foreground mb-3">{pollMessage}</p>
              <button
                onClick={handleCheckNow}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white transition-all hover:bg-blue-500"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Verificar novamente
              </button>
              <div className="mt-3">
                <button
                  onClick={() => router.push("/admin/settings?tab=subscription")}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Ir para assinatura
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (status === "cancel") {
    return (
      <div className="mx-auto max-w-md mt-20 text-center">
        <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-yellow-500/10 p-4">
              <XCircle className="h-10 w-10 text-yellow-500" />
            </div>
          </div>

          <h1 className="text-2xl font-bold text-card-foreground mb-2">
            Pagamento não concluído
          </h1>
          <p className="text-sm text-muted-foreground mb-6">
            O pagamento foi cancelado ou não foi concluído. Seu plano permanece o mesmo.
            Você pode tentar novamente a qualquer momento.
          </p>

          <button
            onClick={() => router.push("/admin/settings?tab=subscription")}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90"
          >
            Voltar para assinatura
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md mt-20 text-center">
      <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
        <div className="flex justify-center mb-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
        <p className="text-sm text-muted-foreground">
          Processando pagamento...
        </p>
      </div>
    </div>
  );
}