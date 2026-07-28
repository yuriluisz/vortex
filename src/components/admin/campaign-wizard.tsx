"use client";

import { useState, useActionState } from "react";
import { createCampaignAction } from "@/app/admin/actions";
import type { ActionState } from "@/app/admin/actions";
import { ArrowLeft, ArrowRight, Check, Loader2, Plus, X } from "lucide-react";
import { HtmlTemplateManager } from "./html-template-manager";
import { CampaignFormBuilder } from "./campaign-form-builder";
import { FieldTooltip } from "./field-tooltip";
import Link from "next/link";

type Step = 1 | 2 | 3;

export function CampaignWizard() {
  const [step, setStep] = useState<Step>(1);
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    createCampaignAction,
    undefined
  );

  // Dados acumulados entre steps
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    pixelId: "",
    rawHtml: "",
    formSchema: "",
  });

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const canProceed = (s: Step): boolean => {
    switch (s) {
      case 1:
        return formData.name.trim().length > 0 && formData.slug.trim().length > 0;
      case 2:
        return formData.rawHtml.trim().length > 0 && formData.formSchema.trim().length > 0;
      case 3:
        return true;
    }
  };

  const handleNext = () => {
    if (step < 3 && canProceed(step)) setStep((step + 1) as Step);
  };

  const handleBack = () => {
    if (step > 1) setStep((step - 1) as Step);
  };

  return (
    <div className="mx-auto max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/admin/campaigns"
          className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para Campanhas
        </Link>
        <h2 className="text-3xl font-bold text-foreground tracking-tight">
          Nova Campanha
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {step === 1 && "Informações básicas da campanha."}
          {step === 2 && "Personalize o HTML e o formulário de captura."}
          {step === 3 && "Crie um grupo no WhatsApp (opcional)."}
        </p>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center gap-2">
          {([1, 2, 3] as const).map((s) => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all ${
                  step === s
                    ? "bg-primary text-primary-foreground ring-2 ring-primary/30"
                    : step > s
                    ? "bg-emerald-500/20 text-emerald-400"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {step > s ? <Check className="h-4 w-4" /> : s}
              </div>
              <span
                className={`text-xs font-medium hidden sm:inline ${
                  step === s
                    ? "text-foreground"
                    : step > s
                    ? "text-emerald-400"
                    : "text-muted-foreground"
                }`}
              >
                {s === 1 && "Configuração"}
                {s === 2 && "Conteúdo"}
                {s === 3 && "Grupo"}
              </span>
              {s < 3 && (
                <div
                  className={`flex-1 h-px ${
                    step > s ? "bg-emerald-500/50" : "bg-border"
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-8 shadow-sm">
        <form action={formAction}>
          {state?.error && (
            <div className="mb-6 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {state.error}
            </div>
          )}

          {/* Step 1: Configuração */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label htmlFor="name" className="block text-sm font-medium text-foreground/80 flex items-center">
                    Nome da Campanha *
                    <FieldTooltip tooltip="Identifique sua campanha de forma clara. Este nome é exibido apenas no painel admin e não aparece para o público." docsAnchor="campo-nome" />
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => updateField("name", e.target.value)}
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
                    <FieldTooltip tooltip="O slug é o endereço público da sua página de captura. Aparece como vortexpages.online/seu-slug. Use apenas letras minúsculas, números e hífens." docsAnchor="campo-slug" />
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
                      value={formData.slug}
                      onChange={(e) => updateField("slug", e.target.value.toLowerCase().replace(/\s+/g, "-"))}
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
                  <FieldTooltip tooltip="Insira o ID do pixel do Meta (Facebook/Instagram). Quando um lead se cadastrar, eventos de conversão serão disparados automaticamente." docsAnchor="campo-pixel" />
                </label>
                <input
                  id="pixelId"
                  name="pixelId"
                  type="text"
                  value={formData.pixelId}
                  onChange={(e) => updateField("pixelId", e.target.value)}
                  placeholder="Ex: 1234567890"
                  className="w-full rounded-lg border border-input bg-secondary px-4 py-3 text-sm text-foreground outline-none transition-all focus:border-ring focus:ring-2 focus:ring-ring/20"
                />
              </div>
            </div>
          )}

          {/* Step 2: Conteúdo */}
          {step === 2 && (
            <div className="space-y-6">
              <HtmlTemplateManager
                defaultValue={formData.rawHtml}
                error={state?.fieldErrors?.rawHtml?.[0]}
                onChange={(code) => updateField("rawHtml", code)}
              />

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground/80">
                    Schema do Formulário (Visual) *
                  </label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Construa as perguntas extras que você deseja na sua página de captura.
                  </p>
                </div>

                <CampaignFormBuilder
                  defaultValue={formData.formSchema}
                  error={state?.fieldErrors?.formSchema?.[0]}
                  onChange={(schema) => updateField("formSchema", schema)}
                />
              </div>
            </div>
          )}

          {/* Step 3: Grupo (opcional) */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="rounded-lg border border-border bg-muted/50 p-6">
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Grupo do WhatsApp
                </h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Opcional. Crie um grupo agora para começar a receber leads. Você pode adicionar grupos depois.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label htmlFor="groupName" className="block text-sm font-medium text-foreground/80 flex items-center">
                      Nome do Grupo
                      <FieldTooltip tooltip="O nome que identifica este grupo na lista. Não precisa ser o mesmo nome que aparece no WhatsApp." docsAnchor="wizard-etapa-grupo" />
                    </label>
                    <input
                      id="groupName"
                      name="groupName"
                      type="text"
                      placeholder="Ex: VIP Mentoria 2026"
                      className="w-full rounded-lg border border-input bg-secondary px-4 py-3 text-sm text-foreground outline-none transition-all focus:border-ring focus:ring-2 focus:ring-ring/20"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="groupUrl" className="block text-sm font-medium text-foreground/80 flex items-center">
                      Link do Grupo
                      <FieldTooltip tooltip="Insira o link de convite do grupo do WhatsApp. Comece com https://chat.whatsapp.com/ seguido do código." docsAnchor="grupo-criar" />
                    </label>
                    <input
                      id="groupUrl"
                      name="groupUrl"
                      type="url"
                      placeholder="https://chat.whatsapp.com/..."
                      className="w-full rounded-lg border border-input bg-secondary px-4 py-3 text-sm text-foreground outline-none transition-all focus:border-ring focus:ring-2 focus:ring-ring/20"
                    />
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  <label htmlFor="maxCapacity" className="block text-sm font-medium text-foreground/80 flex items-center">
                    Capacidade Máxima
                    <FieldTooltip tooltip="Quando o grupo atingir essa quantidade de leads, os novos serão redirecionados automaticamente para o próximo grupo da fila." docsAnchor="campo-lotacao" />
                  </label>
                  <input
                    id="maxCapacity"
                    name="maxCapacity"
                    type="number"
                    min={1}
                    max={1024}
                    defaultValue={150}
                    className="w-full max-w-xs rounded-lg border border-input bg-secondary px-4 py-3 text-sm text-foreground outline-none transition-all focus:border-ring focus:ring-2 focus:ring-ring/20"
                  />
                </div>
              </div>

              <div className="rounded-lg border border-dashed border-border bg-card p-6 text-center">
                <p className="text-sm text-muted-foreground">
                  Você pode pular esta etapa e adicionar grupos depois.
                </p>
              </div>
            </div>
          )}

          {/* Hidden fields to pass accumulated data */}
          <input type="hidden" name="name" value={formData.name} />
          <input type="hidden" name="slug" value={formData.slug} />
          <input type="hidden" name="pixelId" value={formData.pixelId} />
          <input type="hidden" name="rawHtml" value={formData.rawHtml} />
          <input type="hidden" name="formSchema" value={formData.formSchema} />

          {/* Navigation */}
          <div className="pt-6 border-t border-border mt-6 flex items-center justify-between">
            <button
              type="button"
              onClick={handleBack}
              disabled={step === 1}
              className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-foreground transition-all hover:bg-accent disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </button>

            {step < 3 ? (
              <button
                type="button"
                onClick={handleNext}
                disabled={!canProceed(step)}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-md transition-all hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Próximo
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={pending}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-md transition-all hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {pending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                {pending ? "Criando..." : "Criar Campanha"}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}