"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { syncCampaignLeadsAction } from "./actions";
import { useRouter } from "next/navigation";

export function SyncLeadsButton({ campaignId, tenantId }: { campaignId: string; tenantId: string }) {
  const [isSyncing, setIsSyncing] = useState(false);
  const router = useRouter();

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const result = await syncCampaignLeadsAction(campaignId, tenantId);
      
      if (result.success) {
        alert(`Sincronização concluída: ${result.totalSynced} leads foram sincronizados.`);
        router.refresh();
      } else {
        alert(`Falha ao sincronizar: ${result.error || "Ocorreu um erro inesperado."}`);
      }
    } catch (err) {
      alert("Erro na requisição: Não foi possível conectar ao servidor.");
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleSync}
      disabled={isSyncing}
      className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground border border-border transition-colors hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <RefreshCw className={`h-4 w-4 ${isSyncing ? "animate-spin" : ""}`} />
      {isSyncing ? "Sincronizando..." : "Sincronizar Leads"}
    </button>
  );
}
