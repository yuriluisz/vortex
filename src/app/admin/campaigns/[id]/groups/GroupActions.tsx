"use client";

import { useState, useActionState } from "react";
import { RefreshCw, Loader2, PackagePlus } from "lucide-react";
import { syncGroupAction, bulkCreateGroupsAction } from "@/app/admin/whatsapp/actions";
import type { BulkCreateState } from "@/app/admin/whatsapp/actions";

// ============================================================================
// SYNC BUTTON — Sincronizar grupo individual
// ============================================================================

export function SyncGroupButton({ groupId }: { groupId: string }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleSync = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await syncGroupAction(groupId);
      if (res.success) {
        setResult(`✅ ${res.count} membros`);
        // Refresh a página após 1.5s para mostrar o novo count
        setTimeout(() => window.location.reload(), 1500);
      } else {
        setResult(`❌ ${res.error}`);
      }
    } catch {
      setResult("❌ Erro");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleSync}
        disabled={loading}
        title="Sincronizar contagem real"
        className="p-2 rounded-lg text-primary hover:bg-primary/10 transition-colors disabled:opacity-50"
      >
        <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
      </button>
      {result && (
        <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] whitespace-nowrap text-muted-foreground">
          {result}
        </span>
      )}
    </div>
  );
}

// ============================================================================
// BULK CREATE MODAL — Criação em massa de grupos
// ============================================================================

export function BulkCreateButton({ campaignId }: { campaignId: string }) {
  const [isOpen, setIsOpen] = useState(false);

  const [state, formAction, pending] = useActionState<BulkCreateState, FormData>(
    bulkCreateGroupsAction,
    undefined
  );

  // Fechar e dar reload quando criou com sucesso
  if (state?.success && isOpen) {
    setTimeout(() => {
      setIsOpen(false);
      window.location.reload();
    }, 1500);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground border border-border transition-colors hover:bg-accent hover:text-accent-foreground"
      >
        <PackagePlus className="h-4 w-4" />
        Criar em Massa
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-2xl">
            <h4 className="text-lg font-semibold text-card-foreground mb-4">
              Criar Grupos em Massa
            </h4>

            {state?.success && (
              <div className="rounded-lg border border-chart-1/30 bg-chart-1/10 px-4 py-3 text-sm text-chart-1 mb-4">
                ✅ {state.createdCount} grupo(s) criado(s) com sucesso!
              </div>
            )}

            {state?.error && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive mb-4">
                {state.error}
              </div>
            )}

            <form action={formAction} className="space-y-4">
              <input type="hidden" name="campaignId" value={campaignId} />

              <div className="space-y-2">
                <label className="block text-sm font-medium text-foreground/80">
                  Nome Base
                </label>
                <input
                  name="baseName"
                  type="text"
                  required
                  placeholder="Ex: VIP"
                  className="w-full rounded-lg border border-input bg-secondary px-4 py-2.5 text-sm text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/20 transition-all"
                />
                <p className="text-xs text-muted-foreground">
                  Os grupos serão nomeados: VIP 01, VIP 02, VIP 03...
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-foreground/80">
                    Quantidade
                  </label>
                  <input
                    name="quantity"
                    type="number"
                    min="1"
                    max="20"
                    required
                    defaultValue="5"
                    className="w-full rounded-lg border border-input bg-secondary px-4 py-2.5 text-sm text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/20 transition-all"
                  />
                </div>
                <div className="space-y-2">
                <label htmlFor="maxCapacity" className="block text-sm font-medium text-foreground/80">
                  Lotação Máxima por Grupo
                </label>
                <input
                  id="maxCapacity"
                  name="maxCapacity"
                  type="number"
                  min="1"
                  max="1024"
                  required
                  defaultValue="250"
                  className="w-full rounded-lg border border-input bg-secondary px-4 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20 transition-all"
                />
              </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="participantNumberBulk" className="block text-sm font-medium text-foreground/80 flex items-center gap-2">
                  Número Auxiliar
                  <span className="text-[10px] font-normal text-muted-foreground/70 bg-muted px-1.5 py-0.5 rounded">Recomendado</span>
                </label>
                <input
                  id="participantNumberBulk"
                  name="participantNumber"
                  type="text"
                  placeholder="Ex: 5511999999999"
                  className="w-full rounded-lg border border-input bg-secondary px-4 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20 transition-all"
                  defaultValue={typeof window !== 'undefined' ? localStorage.getItem('vortex_aux_number') || "" : ""}
                  onChange={(e) => localStorage.setItem('vortex_aux_number', e.target.value)}
                />
                <p className="text-xs text-muted-foreground">O WhatsApp exige pelo menos 1 pessoa para criar o grupo automático.</p>
              </div>

              <div className="space-y-2">
                <label htmlFor="descriptionBulk" className="block text-sm font-medium text-foreground/80">
                  Descrição (Opcional - Para todos)
                </label>
                <textarea
                  id="descriptionBulk"
                  name="description"
                  rows={2}
                  placeholder="Seja bem-vindo..."
                  className="w-full rounded-lg border border-input bg-secondary px-4 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20 transition-all resize-none"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="pictureBulk" className="block text-sm font-medium text-foreground/80">
                  Foto (Opcional - Para todos)
                </label>
                <input
                  id="pictureBulk"
                  name="picture"
                  type="file"
                  accept="image/jpeg, image/png, image/webp"
                  className="w-full rounded-lg border border-input bg-secondary px-4 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20 transition-all file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={pending}
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-50"
                >
                  {pending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <PackagePlus className="h-4 w-4" />
                  )}
                  Criar Grupos
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
