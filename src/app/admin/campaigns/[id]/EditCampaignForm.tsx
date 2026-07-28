"use client";

import { useActionState } from "react";
import { updateCampaignAction } from "../../actions";
import type { ActionState } from "../../actions";
import { Loader2, CheckCircle2 } from "lucide-react";
import { HtmlTemplateManager } from "@/components/admin/html-template-manager";
import { CampaignFormBuilder } from "@/components/admin/campaign-form-builder";
import { FieldTooltip } from "@/components/admin/field-tooltip";

interface Campaign {
  id: string;
  name: string;
  slug: string;
  pixelId: string | null;
  rawHtml: string;
  formSchema: unknown;
}

export function EditCampaignForm({ campaign }: { campaign: Campaign }) {
  const updateActionWithId = updateCampaignAction.bind(null, campaign.id);
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    updateActionWithId,
    undefined
  );

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm transition-all duration-300 hover:shadow-md hover:border-primary/20">
      <div className="mb-6">
        <h3 className="text-lg font-medium text-card-foreground">Editar Configurações da Campanha</h3>
        <p className="text-sm text-muted-foreground mt-1">Atualize os detalhes, HTML ou o formulário desta campanha.</p>
      </div>

      <form action={formAction} className="space-y-6">
        {state?.error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {state.error}
          </div>
        )}
        
        {state?.success && (
          <div className="rounded-lg border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-primary flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            Campanha atualizada com sucesso!
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label htmlFor="name" className="block text-sm font-medium text-foreground/80 flex items-center">
              Nome da Campanha *
              <FieldTooltip tooltip="Identifique sua campanha de forma clara. Este nome é exibido apenas no painel admin." docsAnchor="campo-nome" />
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              defaultValue={campaign.name}
              placeholder="Ex: Lançamento Mentoria 2026"
              className="w-full rounded-lg border border-input bg-secondary px-4 py-3 text-sm text-foreground outline-none transition-all focus:border-ring focus:ring-2 focus:ring-ring/20"
            />
            {state?.fieldErrors?.name && (
              <p className="text-xs text-destructive">{state.fieldErrors.name[0]}</p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="slug" className="block text-sm font-medium text-foreground/80 flex items-center">
              Slug (URL) *
              <FieldTooltip tooltip="O slug é o endereço público da sua página de captura (vortexpages.online/seu-slug)." docsAnchor="campo-slug" />
            </label>
            <div className="flex rounded-lg border border-input bg-secondary overflow-hidden focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/20 transition-all">
              <span className="flex items-center px-4 border-r border-input text-sm text-muted-foreground bg-muted">
                vortexpages.online/
              </span>
              <input
                id="slug"
                name="slug"
                type="text"
                required
                defaultValue={campaign.slug}
                placeholder="mentoria-2026"
                className="w-full bg-transparent px-4 py-3 text-sm text-foreground outline-none"
              />
            </div>
            {state?.fieldErrors?.slug && (
              <p className="text-xs text-destructive">{state.fieldErrors.slug[0]}</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="pixelId" className="block text-sm font-medium text-foreground/80 flex items-center">
            Meta Pixel ID (Opcional)
            <FieldTooltip tooltip="ID do pixel do Meta para rastreamento de conversões em anúncios do Facebook/Instagram." docsAnchor="campo-pixel" />
          </label>
          <input
            id="pixelId"
            name="pixelId"
            type="text"
            defaultValue={campaign.pixelId || ""}
            placeholder="Ex: 1234567890"
            className="w-full rounded-lg border border-input bg-secondary px-4 py-3 text-sm text-foreground outline-none transition-all focus:border-ring focus:ring-2 focus:ring-ring/20"
          />
        </div>

        <HtmlTemplateManager defaultValue={campaign.rawHtml} error={state?.fieldErrors?.rawHtml?.[0]} />

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground/80">
              Schema do Formulário (Visual) *
            </label>
            <p className="text-xs text-muted-foreground mt-1">
              Modifique as perguntas extras que você deseja na sua página de captura.
            </p>
          </div>
          
          <CampaignFormBuilder defaultValue={JSON.stringify(campaign.formSchema)} error={state?.fieldErrors?.formSchema?.[0]} />
        </div>

        <div className="pt-4 border-t border-border flex justify-end">
          <button
            type="submit"
            disabled={pending}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-md transition-all hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {pending ? "Salvando..." : "Salvar Alterações"}
          </button>
        </div>
      </form>
    </div>
  );
}
