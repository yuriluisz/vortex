"use client";

import { useActionState, useState, useRef, useEffect } from "react";
import { createGroupAction, createWhatsAppGroupAction } from "../../../actions";
import type { ActionState } from "../../../actions";
import { Loader2, Plus, Zap, Link as LinkIcon } from "lucide-react";
import { FieldTooltip } from "@/components/admin/field-tooltip";

export default function CreateGroupForm({ 
  campaignId, 
  hasWhatsapp 
}: { 
  campaignId: string;
  hasWhatsapp?: boolean;
}) {
  const [activeTab, setActiveTab] = useState<"auto" | "manual">(hasWhatsapp ? "auto" : "manual");
  const formRef = useRef<HTMLFormElement>(null);

  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    createGroupAction,
    undefined
  );

  const [autoState, autoFormAction, autoPending] = useActionState<ActionState, FormData>(
    createWhatsAppGroupAction,
    undefined
  );

  // Limpar form após sucesso
  useEffect(() => {
    if (state?.success || autoState?.success) {
      formRef.current?.reset();
    }
  }, [state?.success, autoState?.success]);

  const isAuto = activeTab === "auto";
  const isPending = isAuto ? autoPending : pending;
  const currentState = isAuto ? autoState : state;
  const currentAction = isAuto ? autoFormAction : formAction;

  return (
    <div className="glass-panel rounded-xl p-6 relative overflow-hidden mb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h3 className="text-lg font-medium text-card-foreground">Adicionar Novo Grupo</h3>
        
        {hasWhatsapp && (
          <div className="flex bg-secondary p-1 rounded-lg">
            <button
              type="button"
              onClick={() => setActiveTab("auto")}
              className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                isAuto 
                  ? "bg-background text-foreground shadow-sm" 
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Zap className="h-4 w-4" />
              Criar no WhatsApp
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("manual")}
              className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                !isAuto 
                  ? "bg-background text-foreground shadow-sm" 
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <LinkIcon className="h-4 w-4" />
              Inserir Link
            </button>
          </div>
        )}
      </div>
      
      <form ref={formRef} action={currentAction} className="space-y-4">
        <input type="hidden" name="campaignId" value={campaignId} />
        
        {currentState?.error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {currentState.error}
          </div>
        )}

        {currentState?.success && (
          <div className="rounded-lg border border-chart-1/30 bg-chart-1/10 px-4 py-3 text-sm text-chart-1">
            Grupo {isAuto ? "criado no WhatsApp e " : ""}cadastrado com sucesso!
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className={`space-y-2 ${isAuto ? "md:col-span-2" : ""}`}>
            <label htmlFor="name" className="block text-sm font-medium text-foreground/80 flex items-center">
              Nome do Grupo
              <FieldTooltip tooltip="O nome que identifica este grupo na lista de grupos da campanha." docsAnchor="grupo-criar" />
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              placeholder={isAuto ? "Ex: Lançamento VIP 01" : "Ex: VIP 01"}
              className="w-full rounded-lg border border-input bg-secondary px-4 py-2.5 text-sm text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/20 transition-all"
            />
          </div>

          {!isAuto && (
            <div className="space-y-2 md:col-span-2">
              <label htmlFor="url" className="block text-sm font-medium text-foreground/80 flex items-center">
                Link de Convite
                <FieldTooltip tooltip="Cole o link de convite do grupo do WhatsApp (https://chat.whatsapp.com/...)." docsAnchor="grupo-criar" />
              </label>
              <input
                id="url"
                name="url"
                type="url"
                required={!isAuto}
                placeholder="https://chat.whatsapp.com/..."
                className="w-full rounded-lg border border-input bg-secondary px-4 py-2.5 text-sm text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/20 transition-all"
              />
            </div>
          )}

          {isAuto && (
            <div className="space-y-2 md:col-span-2">
              <label htmlFor="participantNumber" className="block text-sm font-medium text-foreground/80 flex items-center gap-2">
                Número Auxiliar
                <span className="text-[10px] font-normal text-muted-foreground/70 bg-muted px-1.5 py-0.5 rounded">Obrigatório p/ criar grupo</span>
              </label>
              <input
                id="participantNumber"
                name="participantNumber"
                type="text"
                required={isAuto}
                placeholder="Ex: 5511999999999"
                className="w-full rounded-lg border border-input bg-secondary px-4 py-2.5 text-sm text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/20 transition-all"
                defaultValue={typeof window !== 'undefined' ? localStorage.getItem('vortex_aux_number') || "" : ""}
                onChange={(e) => localStorage.setItem('vortex_aux_number', e.target.value)}
              />
              <p className="text-xs text-muted-foreground">O WhatsApp exige adicionar pelo menos 1 pessoa para criar o grupo.</p>
            </div>
          )}

          {isAuto && (
            <>
              <div className="space-y-2 md:col-span-3">
                <label htmlFor="description" className="block text-sm font-medium text-foreground/80">
                  Descrição do Grupo (Opcional)
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={2}
                  placeholder="Seja bem-vindo ao grupo VIP..."
                  className="w-full rounded-lg border border-input bg-secondary px-4 py-2.5 text-sm text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/20 transition-all resize-none"
                />
              </div>
              <div className="space-y-2 md:col-span-3">
                <label htmlFor="picture" className="block text-sm font-medium text-foreground/80">
                  Foto do Grupo (Opcional)
                </label>
                <input
                  id="picture"
                  name="picture"
                  type="file"
                  accept="image/jpeg, image/png, image/webp"
                  className="w-full rounded-lg border border-input bg-secondary px-4 py-2.5 text-sm text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/20 transition-all file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                />
              </div>
            </>
          )}

          <div className="space-y-2">
            <label htmlFor="maxCapacity" className="block text-sm font-medium text-foreground/80 flex items-center">
              Lotação Máxima
              <FieldTooltip tooltip="Ao atingir esse número, os próximos leads serão redirecionados para o grupo seguinte da fila." docsAnchor="campo-lotacao" />
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
            disabled={isPending}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isAuto ? (
              <Zap className="h-4 w-4" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            {isAuto ? "Criar Grupo Automaticamente" : "Cadastrar Grupo"}
          </button>
        </div>
      </form>
    </div>
  );
}
