"use client";

import { useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, X, CheckCircle2, Info } from "lucide-react";
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

  const dialog = (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-xl animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative my-auto w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl border border-white/15 bg-zinc-950 p-6 shadow-2xl animate-in zoom-in-95 duration-200 z-10 space-y-4">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 rounded-xl p-1.5 text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        {confirmed ? (
          // Estado de sucesso
          <div className="text-center py-6 space-y-3">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/20">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-bold text-foreground">
              Cancelamento Agendado
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Você continua com acesso total aos recursos do plano {currentPlan} até{" "}
              <strong className="text-foreground">{formatDate(currentPeriodEnd)}</strong>.
            </p>
          </div>
        ) : (
          // Formulário de confirmação
          <>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-destructive/15 border border-destructive/25 text-destructive flex items-center justify-center shrink-0">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">
                  Cancelar Plano {currentPlan}?
                </h3>
                <p className="text-xs text-muted-foreground">
                  Confirmação de downgrade de assinatura
                </p>
              </div>
            </div>

            <div className="space-y-3 text-xs text-muted-foreground leading-relaxed pt-2">
              {currentPeriodEnd && (
                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3.5 text-foreground/90">
                  Ao cancelar, você <strong>mantém acesso total</strong> ao plano{" "}
                  <strong className="text-primary">{currentPlan}</strong> até{" "}
                  <strong>{formatDate(currentPeriodEnd)}</strong>.
                </div>
              )}

              <div>
                <p className="mb-2 font-medium text-foreground">Após essa data, sua conta voltará ao plano Free com:</p>
                <ul className="space-y-1 pl-2">
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-destructive" />
                    <span>1 campanha ativa</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-destructive" />
                    <span>3 grupos de WhatsApp vinculados</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-destructive" />
                    <span>Até 100 leads por mês</span>
                  </li>
                </ul>
              </div>

              <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-primary text-[11px] flex items-center gap-1.5">
                <Info className="h-4 w-4 shrink-0 text-primary" />
                <span>Você pode <strong>reativar sua assinatura com 1 clique</strong> a qualquer momento antes do término do ciclo.</span>
              </div>
            </div>

            {error && (
              <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive font-semibold">
                {error}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isPending}
                className="flex-1 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-4 py-2.5 text-xs font-bold text-foreground transition-all active:scale-95 disabled:opacity-50"
              >
                Manter Meu Plano
              </button>
              <button
                type="button"
                onClick={handleCancel}
                disabled={isPending}
                className="flex-1 rounded-xl bg-destructive hover:bg-destructive/90 px-4 py-2.5 text-xs font-bold text-white transition-all shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPending ? "Processando..." : "Confirmar Cancelamento"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );

  return typeof window !== "undefined" ? createPortal(dialog, document.body) : null;
}
