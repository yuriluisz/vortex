"use client";

import { useActionState } from "react";
import { createCampaignAction } from "../../actions";
import type { ActionState } from "../../actions";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { HtmlTemplateManager } from "@/components/admin/html-template-manager";
import { CampaignFormBuilder } from "@/components/admin/campaign-form-builder";

export default function NewCampaignPage() {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    createCampaignAction,
    undefined
  );

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-8">
        <Link
          href="/admin/campaigns"
          className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para Campanhas
        </Link>
        <h2 className="text-3xl font-bold text-foreground tracking-tight">Nova Campanha</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Configure as regras, HTML e o formulário de captação.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-8 shadow-sm">
        <form action={formAction} className="space-y-6">
          
          {state?.error && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {state.error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label htmlFor="name" className="block text-sm font-medium text-foreground/80">
                Nome da Campanha *
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                placeholder="Ex: Lançamento Mentoria 2026"
                className="w-full rounded-lg border border-input bg-secondary px-4 py-3 text-sm text-foreground outline-none transition-all focus:border-ring focus:ring-2 focus:ring-ring/20"
              />
              {state?.fieldErrors?.name && (
                <p className="text-xs text-destructive">{state.fieldErrors.name[0]}</p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="slug" className="block text-sm font-medium text-foreground/80">
                Slug (URL) *
              </label>
              <div className="flex rounded-lg border border-input bg-secondary overflow-hidden focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/20 transition-all">
                <span className="flex items-center px-4 border-r border-input text-sm text-muted-foreground bg-muted">
                  vortex.com/
                </span>
                <input
                  id="slug"
                  name="slug"
                  type="text"
                  required
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
            <label htmlFor="pixelId" className="block text-sm font-medium text-foreground/80">
              Meta Pixel ID (Opcional)
            </label>
            <input
              id="pixelId"
              name="pixelId"
              type="text"
              placeholder="Ex: 1234567890"
              className="w-full rounded-lg border border-input bg-secondary px-4 py-3 text-sm text-foreground outline-none transition-all focus:border-ring focus:ring-2 focus:ring-ring/20"
            />
          </div>

          <HtmlTemplateManager error={state?.fieldErrors?.rawHtml?.[0]} />

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground/80">
                Schema do Formulário (Visual) *
              </label>
              <p className="text-xs text-muted-foreground mt-1">
                Construa as perguntas extras que você deseja na sua página de captura.
              </p>
            </div>
            
            <CampaignFormBuilder error={state?.fieldErrors?.formSchema?.[0]} />
          </div>

          <div className="pt-4 border-t border-border flex justify-end">
            <button
              type="submit"
              disabled={pending}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-md transition-all hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {pending ? "Criando..." : "Criar Campanha"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
