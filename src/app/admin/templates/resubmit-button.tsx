"use client";

import { useState } from "react";
import { RefreshCw, Loader2 } from "lucide-react";
import { resubmitTemplateAction } from "./actions";

export function ResubmitButton({ templateId }: { templateId: string }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function handleResubmit() {
    setPending(true);
    setError("");
    try {
      await resubmitTemplateAction(templateId);
    } catch (e: any) {
      setError(e.message || "Erro ao reenviar.");
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col items-end">
      <button
        onClick={handleResubmit}
        disabled={pending}
        className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-all duration-200 active:scale-[0.97]"
      >
        {pending ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <RefreshCw className="w-3.5 h-3.5" />
        )}
        {pending ? "Enviando..." : "Reenviar para análise"}
      </button>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}