"use client";

import { useActionState } from "react";
import { createGroupAction } from "../../../actions";
import type { ActionState } from "../../../actions";
import { Loader2, Plus } from "lucide-react";

export default function CreateGroupForm({ campaignId }: { campaignId: string }) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    createGroupAction,
    undefined
  );

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm mb-8">
      <h3 className="text-lg font-medium text-card-foreground mb-4">Adicionar Novo Grupo</h3>
      
      <form action={formAction} className="space-y-4">
        <input type="hidden" name="campaignId" value={campaignId} />
        
        {state?.error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {state.error}
          </div>
        )}

        {state?.success && (
          <div className="rounded-lg border border-chart-1/30 bg-chart-1/10 px-4 py-3 text-sm text-chart-1">
            Grupo criado com sucesso!
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label htmlFor="name" className="block text-sm font-medium text-foreground/80">
              Nome de Referência
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              placeholder="Ex: VIP 01"
              className="w-full rounded-lg border border-input bg-secondary px-4 py-2.5 text-sm text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/20 transition-all"
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <label htmlFor="url" className="block text-sm font-medium text-foreground/80">
              Link de Convite
            </label>
            <input
              id="url"
              name="url"
              type="url"
              required
              placeholder="https://chat.whatsapp.com/..."
              className="w-full rounded-lg border border-input bg-secondary px-4 py-2.5 text-sm text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/20 transition-all"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="maxCapacity" className="block text-sm font-medium text-foreground/80">
              Lotação Máxima
            </label>
            <input
              id="maxCapacity"
              name="maxCapacity"
              type="number"
              min="1"
              max="1024"
              required
              defaultValue="250"
              className="w-full rounded-lg border border-input bg-secondary px-4 py-2.5 text-sm text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/20 transition-all"
            />
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={pending}
            className="inline-flex items-center gap-2 rounded-lg bg-secondary px-5 py-2.5 text-sm font-medium text-secondary-foreground border border-border transition-colors hover:bg-accent hover:text-accent-foreground disabled:opacity-50"
          >
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Cadastrar Grupo
          </button>
        </div>
      </form>
    </div>
  );
}
