"use client";

import { useState } from "react";
import { Check, X } from "lucide-react";
import { moderateTemplateAction } from "../actions";

export function ModerateTemplateButton({ templateId }: { templateId: string }) {
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [reason, setReason] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function handleApprove() {
    setPending(true);
    setError("");
    try {
      await moderateTemplateAction(templateId, "approve");
    } catch (e: any) {
      setError(e.message || "Erro ao aprovar.");
      setPending(false);
    }
  }

  async function handleReject() {
    if (!reason.trim()) {
      setError("Informe o motivo da rejeição.");
      return;
    }
    setPending(true);
    setError("");
    try {
      await moderateTemplateAction(templateId, "reject", reason);
    } catch (e: any) {
      setError(e.message || "Erro ao rejeitar.");
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {showRejectForm ? (
        <>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Motivo da rejeição (obrigatório)..."
            rows={2}
            className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground placeholder-muted-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
          />
          <div className="flex items-center gap-2">
            <button
              onClick={handleReject}
              disabled={pending}
              className="inline-flex items-center gap-1.5 rounded-lg bg-red-500 px-3 py-2 text-xs font-semibold text-white hover:bg-red-600 transition-colors disabled:opacity-50"
            >
              <X className="w-3.5 h-3.5" />
              {pending ? "Rejeitando..." : "Confirmar Rejeição"}
            </button>
            <button
              onClick={() => {
                setShowRejectForm(false);
                setReason("");
                setError("");
              }}
              className="rounded-lg border border-border px-3 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancelar
            </button>
          </div>
        </>
      ) : (
        <div className="flex items-center gap-2">
          <button
            onClick={handleApprove}
            disabled={pending}
            className="inline-flex items-center gap-1.5 rounded-lg bg-green-500 px-3 py-2 text-xs font-semibold text-white hover:bg-green-600 transition-colors disabled:opacity-50"
          >
            <Check className="w-3.5 h-3.5" />
            {pending ? "Processando..." : "Aprovar"}
          </button>
          <button
            onClick={() => setShowRejectForm(true)}
            disabled={pending}
            className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/30 px-3 py-2 text-xs font-semibold text-red-500 hover:bg-red-500/10 transition-colors disabled:opacity-50"
          >
            <X className="w-3.5 h-3.5" />
            Rejeitar
          </button>
        </div>
      )}

      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}