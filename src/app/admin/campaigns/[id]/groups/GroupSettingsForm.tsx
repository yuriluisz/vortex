"use client";

import { useActionState } from "react";
import { updateCampaignGroupSettingsAction } from "../../../actions";
import type { ActionState } from "../../../actions";
import { Loader2, CheckCircle2 } from "lucide-react";
import { FieldTooltip } from "@/components/admin/field-tooltip";

interface CampaignGroupSettings {
  id: string;
  groupMaxCapacity: number;
  groupSupportPhones: string[];
  groupDescription: string | null;
  groupImageUrl: string | null;
}

export function GroupSettingsForm({ campaign, isUltra }: { campaign: CampaignGroupSettings, isUltra?: boolean }) {
  const updateActionWithId = updateCampaignGroupSettingsAction.bind(null, campaign.id);
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    updateActionWithId,
    undefined
  );

  return (
    <div className={`glass-panel rounded-xl p-6 relative overflow-hidden mb-8 transition-all duration-300 ${isUltra ? 'hover:shadow-md hover:border-primary/20' : 'opacity-80'}`}>
      {!isUltra && (
        <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider bg-primary/20 text-primary px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm">
            Exclusivo Ultra
          </span>
        </div>
      )}

      <div className="mb-6 border-b border-border pb-4">
        <h3 className="text-lg font-medium text-card-foreground flex items-center gap-2">
          Padrão para Auto-Criação de Grupos
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          Configure as informações que os grupos gerados automaticamente pelo sistema deverão herdar.
        </p>
      </div>

      <form action={formAction} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label htmlFor="groupMaxCapacity" className="block text-sm font-medium text-foreground/80 flex items-center">
              Capacidade Máxima do Grupo
              <FieldTooltip tooltip="O WhatsApp suporta até 1024 membros por grupo. O Rotacionador vai provisionar o próximo automaticamente perto deste limite." docsAnchor="campo-capacidade" />
            </label>
            <input
              id="groupMaxCapacity"
              name="groupMaxCapacity"
              type="number"
              min="1"
              max="1024"
              required
              disabled={!isUltra}
              defaultValue={campaign.groupMaxCapacity || 1000}
              className={`w-full rounded-lg border border-input bg-secondary px-4 py-3 text-sm text-foreground outline-none transition-all focus:border-ring focus:ring-2 focus:ring-ring/20 ${!isUltra ? 'cursor-not-allowed opacity-60' : ''}`}
            />
            {state?.fieldErrors?.groupMaxCapacity && (
              <p className="text-xs text-destructive">{state.fieldErrors.groupMaxCapacity[0]}</p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="groupSupportPhones" className="block text-sm font-medium text-foreground/80 flex items-center">
              Números de Suporte (Administradores)
              <FieldTooltip tooltip="Lista de números (com DDI e DDD) separados por vírgula que serão adicionados e promovidos a ADMIN automaticamente nos grupos recém criados." docsAnchor="campo-suporte" />
            </label>
            <input
              id="groupSupportPhones"
              name="groupSupportPhones"
              type="text"
              disabled={!isUltra}
              defaultValue={campaign.groupSupportPhones?.join(", ")}
              placeholder="Ex: 5511999999999, 5511888888888"
              className={`w-full rounded-lg border border-input bg-secondary px-4 py-3 text-sm text-foreground outline-none transition-all focus:border-ring focus:ring-2 focus:ring-ring/20 ${!isUltra ? 'cursor-not-allowed opacity-60' : ''}`}
            />
            {state?.fieldErrors?.groupSupportPhones && (
              <p className="text-xs text-destructive">{state.fieldErrors.groupSupportPhones[0]}</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="groupImageUrl" className="block text-sm font-medium text-foreground/80 flex items-center">
            Foto Padrão do Grupo (URL)
            <FieldTooltip tooltip="A URL pública da imagem que será aplicada automaticamente na foto dos novos grupos." docsAnchor="campo-imagem" />
          </label>
          <input
            id="groupImageUrl"
            name="groupImageUrl"
            type="url"
            disabled={!isUltra}
            defaultValue={campaign.groupImageUrl || ""}
            placeholder="Ex: https://meusite.com/imagem-grupo.jpg"
            className={`w-full rounded-lg border border-input bg-secondary px-4 py-3 text-sm text-foreground outline-none transition-all focus:border-ring focus:ring-2 focus:ring-ring/20 ${!isUltra ? 'cursor-not-allowed opacity-60' : ''}`}
          />
          {state?.fieldErrors?.groupImageUrl && (
            <p className="text-xs text-destructive">{state.fieldErrors.groupImageUrl[0]}</p>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="groupDescription" className="block text-sm font-medium text-foreground/80 flex items-center">
            Descrição Padrão do Grupo
            <FieldTooltip tooltip="Texto que aparecerá na descrição de todos os grupos gerados automaticamente." docsAnchor="campo-desc" />
          </label>
          <textarea
            id="groupDescription"
            name="groupDescription"
            disabled={!isUltra}
            defaultValue={campaign.groupDescription || ""}
            placeholder="Ex: Bem-vindos ao grupo VIP da Mentoria 2026..."
            rows={4}
            className={`w-full rounded-lg border border-input bg-secondary px-4 py-3 text-sm text-foreground outline-none transition-all focus:border-ring focus:ring-2 focus:ring-ring/20 resize-none ${!isUltra ? 'cursor-not-allowed opacity-60' : ''}`}
          />
          {state?.fieldErrors?.groupDescription && (
            <p className="text-xs text-destructive">{state.fieldErrors.groupDescription[0]}</p>
          )}
        </div>

        <div className="pt-4 flex items-center justify-end border-t border-border mt-6">
          <div className="flex-1">
            {state?.error && (
              <div className="flex items-start gap-2 text-sm text-destructive font-medium">
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-destructive flex-shrink-0" />
                  {state.error}
                </span>
              </div>
            )}
            {state?.success && (
              <div className="flex items-start gap-2 text-sm text-emerald-600 font-medium">
                <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                <span>Configurações atualizadas!</span>
              </div>
            )}
          </div>
          <button
            type="submit"
            disabled={pending || !isUltra}
            className="inline-flex items-center justify-center rounded-lg bg-primary px-8 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-all duration-150 hover:bg-primary/90 active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {pending ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Salvando...
              </span>
            ) : (
              "Salvar Configurações"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
