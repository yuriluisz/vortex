"use client";

import { useState, useTransition } from "react";
import { AlertTriangle, X } from "lucide-react";
import { cancelSubscriptionAction } from "./actions";
import type { Plan } from "@prisma/client";

interface CancelDialogProps {
  open: boolean;
  onClose: () => void;
  currentPlan: Plan;
  currentPeriodEnd: string | null;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export function CancelDialog({
  open,
  onClose,
  currentPlan,
  currentPeriodEnd,
}: CancelDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  if (!open) return null;

  const handleCancel = () => {
    setError(null);
    startTransition(async () => {
      const result = await cancelSubscriptionAction();
      if (result?.error) {
        setError(result.error);
      } else {
        setConfirmed(true);
        setTimeout(() => {
          onClose();
          window.location.reload();
        }, 2000);
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl animate-in fade-in zoom-in-95 duration-200">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 rounded-lg p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        {confirmed ? (
          // Estado de sucesso
          <div className="text-center py-4">
            <div className="mx-auto w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mb-4">
              <svg className="h-6 w-6 text-emerald-500" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-card-foreground mb-2">
              Assinatura cancelada
            </h3>
            <p className="text-sm text-muted-foreground">
              Você mantém acesso ao plano {currentPlan} até{" "}
              <strong>{formatDate(currentPeriodEnd)}</strong>.
            </p>
          </div>
        ) : (
          // Formulário de confirmação
          <>
            <div className="flex items-center gap-3 mb-4">
              <div className="rounded-full bg-destructive/10 p-2.5">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-card-foreground">
                  Cancelar assinatura {currentPlan}?
                </h3>
              </div>
            </div>

            <div className="space-y-4 mb-6">
              {currentPeriodEnd && (
                <div className="rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
                  Ao cancelar, você <strong>continua com acesso</strong> ao plano{" "}
                  <strong>{currentPlan}</strong> até{" "}
                  <strong>{formatDate(currentPeriodEnd)}</strong>.
                </div>
              )}

              <div className="text-sm text-muted-foreground">
                <p className="mb-2">Após essa data, sua conta será rebaixada para o plano Free com:</p>
                <ul className="space-y-1.5 ml-4">
                  <li className="flex items-start gap-1.5">
                    <span className="text-destructive mt-0.5">•</span>
                    <span>1 campanha ativa</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-destructive mt-0.5">•</span>
                    <span>3 grupos de WhatsApp</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-destructive mt-0.5">•</span>
                    <span>100 leads/mês</span>
                  </li>
                </ul>
              </div>

              <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/5 px-4 py-3 text-sm text-yellow-700 dark:text-yellow-400">
                <strong>Atenção:</strong> Se você tiver mais recursos do que o limite do plano Free, o acesso excedente será restringido.
              </div>

              <div className="rounded-lg border border-blue-500/30 bg-blue-500/5 px-4 py-3 text-sm text-blue-700 dark:text-blue-400">
                <strong>Importante:</strong> Você pode <strong>reativar sua assinatura</strong> a qualquer momento antes do fim do ciclo. Basta ir em "Assinatura" e clicar em "Reativar assinatura".
              </div>
            </div>

            {error && (
              <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={onClose}
                disabled={isPending}
                className="flex-1 rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-semibold text-card-foreground transition-all hover:bg-accent active:scale-[0.97] disabled:opacity-50"
              >
                Manter plano
              </button>
              <button
                onClick={handleCancel}
                disabled={isPending}
                className="flex-1 rounded-lg bg-destructive px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-destructive/90 active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPending ? "Cancelando..." : "Confirmar cancelamento"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
