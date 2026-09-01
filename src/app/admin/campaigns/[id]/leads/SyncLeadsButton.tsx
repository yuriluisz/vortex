"use client";

import { useState, useEffect } from "react";
import { RefreshCw, CheckCircle2, AlertCircle, X } from "lucide-react";
import { syncCampaignLeadsAction } from "./actions";
import { useRouter } from "next/navigation";

export function SyncLeadsButton({ campaignId }: { campaignId: string; tenantId?: string }) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const handleSync = async () => {
    setIsSyncing(true);
    setToast(null);
    try {
      const result = await syncCampaignLeadsAction(campaignId);
      
      if (result.success) {
        setToast({ type: "success", message: `Sincronização concluída: ${result.totalSynced} leads foram sincronizados.` });
        router.refresh();
      } else {
        setToast({ type: "error", message: `Falha ao sincronizar: ${result.error || "Erro inesperado."}` });
      }
    } catch {
      setToast({ type: "error", message: "Erro na requisição: Servidor indisponível." });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleSync}
        disabled={isSyncing}
        className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground border border-border transition-colors hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <RefreshCw className={`h-4 w-4 ${isSyncing ? "animate-spin" : ""}`} />
        {isSyncing ? "Sincronizando..." : "Sincronizar Leads"}
      </button>

      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-6 right-6 z-[100] flex items-center gap-3 bg-card border border-border px-5 py-4 rounded-xl shadow-2xl max-w-sm animate-in fade-in slide-in-from-top-2 duration-200">
          {toast.type === "success" ? (
            <div className="rounded-full bg-emerald-500/10 p-1.5 flex-shrink-0">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            </div>
          ) : (
            <div className="rounded-full bg-destructive/10 p-1.5 flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-destructive" />
            </div>
          )}
          <p className="text-sm font-medium text-card-foreground flex-1">
            {toast.message}
          </p>
          <button
            onClick={() => setToast(null)}
            className="p-1 rounded-lg text-muted-foreground hover:bg-muted transition-colors flex-shrink-0"
            aria-label="Fechar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </>
  );
}
