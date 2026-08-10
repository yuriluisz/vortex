"use client";

import { useActionState, useState } from "react";
import { updateCombinedSettingsAction } from "./actions";
import { FieldTooltip } from "@/components/admin/field-tooltip";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";

interface BillingInfo {
  billingCpfCnpj: string | null;
  billingPersonType: string | null;
  billingBusinessName: string | null;
  billingPhone: string | null;
  billingAddress: {
    street?: string;
    number?: string;
    complement?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
    zipCode?: string;
  } | null;
}

interface ProfileFormProps {
  companyName: string;
  slug: string;
  billingInfo: BillingInfo | null;
}

export function ProfileForm({ companyName, slug, billingInfo }: ProfileFormProps) {
  const [personType, setPersonType] = useState<string>(
    billingInfo?.billingPersonType || "FISICA"
  );
  const [state, formAction, pending] = useActionState(
    updateCombinedSettingsAction,
    undefined
  );

  const hasBillingData = !!(billingInfo?.billingCpfCnpj && billingInfo?.billingPhone);

  return (
    <form action={formAction} className="space-y-8">
      {/* 1. Informações da Empresa */}
      <div className="glass-panel rounded-xl p-6 shadow-sm relative overflow-hidden">
        <h2 className="text-lg font-semibold text-card-foreground mb-1">
          Informações da Empresa
        </h2>
        <p className="text-sm text-muted-foreground mb-6">
          Essas informações aparecem no seu painel e na página de captura.
        </p>

        <div className="space-y-5">
          {/* Nome da Empresa */}
          <div>
            <label
              htmlFor="companyName"
              className="block text-sm font-medium text-foreground mb-1.5 flex items-center"
            >
              Nome da empresa
              <FieldTooltip tooltip="O nome da sua empresa que aparece na sidebar do painel e identifica o seu ambiente." docsAnchor="perfil-nome" />
            </label>
            <input
              id="companyName"
              name="companyName"
              type="text"
              defaultValue={companyName}
              required
              className="block w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors duration-150"
              placeholder="Minha Empresa Ltda"
            />
            {state?.fieldErrors?.companyName && (
              <p className="mt-1 text-xs text-destructive">
                {state.fieldErrors.companyName[0]}
              </p>
            )}
          </div>

          {/* Subdomínio */}
          <div>
            <label
              htmlFor="slug"
              className="block text-sm font-medium text-foreground mb-1.5 flex items-center"
            >
              Subdomínio
              <FieldTooltip tooltip="O prefixo do seu domínio personalizado (ex: minha-empresa.vortexpages.online). Apenas letras minúsculas, números e hífens." docsAnchor="perfil-subdominio" />
            </label>
            <div className="flex rounded-lg border border-border bg-background focus-within:ring-2 focus-within:ring-primary/40 focus-within:border-primary transition-colors duration-150">
              <input
                id="slug"
                name="slug"
                type="text"
                defaultValue={slug}
                required
                pattern="^[a-z0-9-]+$"
                className="block w-full rounded-l-lg bg-transparent px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                placeholder="minha-empresa"
              />
              <span className="flex items-center px-4 text-sm text-muted-foreground border-l border-border bg-muted/30 rounded-r-lg">
                .vortexpages.online
              </span>
            </div>
            {state?.fieldErrors?.slug && (
              <p className="mt-1 text-xs text-destructive">
                {state.fieldErrors.slug[0]}
              </p>
            )}
            <p className="mt-1 text-xs text-muted-foreground">
              Apenas letras minúsculas, números e hífens.
            </p>
          </div>
        </div>
      </div>

      {/* 2. Dados de Cobrança */}
      <div className="glass-panel rounded-xl p-6 shadow-sm relative overflow-hidden mt-8">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-lg font-semibold text-card-foreground">
            Dados de Cobrança
          </h2>
          {hasBillingData && !state?.success && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-600">
              <CheckCircle2 className="h-3 w-3" />
              Preenchido
            </span>
          )}
        </div>
        <p className="text-sm text-muted-foreground mb-6">
          Esses dados são usados para criar sua conta de cobrança e emissão de faturas.
        </p>

        <div className="space-y-4">
          {/* Tipo de Pessoa */}
          <div>
            <label className="block text-sm font-medium text-card-foreground mb-2 flex items-center">
              Tipo de Pessoa
              <FieldTooltip tooltip="Selecione se a conta de cobrança será em nome de Pessoa Física (CPF) ou Jurídica (CNPJ)." docsAnchor="cobranca-dados" />
            </label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setPersonType("FISICA")}
                className={`flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium transition-all ${
                  personType === "FISICA"
                    ? "border-primary bg-primary/5 text-primary ring-1 ring-primary"
                    : "border-border bg-background text-muted-foreground hover:border-primary/50"
                }`}
              >
                Pessoa Física
              </button>
              <button
                type="button"
                onClick={() => setPersonType("JURIDICA")}
                className={`flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium transition-all ${
                  personType === "JURIDICA"
                    ? "border-primary bg-primary/5 text-primary ring-1 ring-primary"
                    : "border-border bg-background text-muted-foreground hover:border-primary/50"
                }`}
              >
                Pessoa Jurídica
              </button>
            </div>
            <input type="hidden" name="personType" value={personType} />
          </div>

          {/* CPF ou CNPJ */}
          <div>
            <label className="block text-sm font-medium text-card-foreground mb-1 flex items-center">
              {personType === "JURIDICA" ? "CNPJ" : "CPF"} *
              <FieldTooltip tooltip="Documento fiscal do responsável pela cobrança. Usado para emissão de faturas." docsAnchor="cobranca-dados" />
            </label>
            <input
              type="text"
              name="cpfCnpj"
              defaultValue={billingInfo?.billingCpfCnpj || ""}
              placeholder={personType === "JURIDICA" ? "00.000.000/0001-00" : "000.000.000-00"}
              required
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-card-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>

          {/* Razão Social (apenas PJ) */}
          {personType === "JURIDICA" && (
            <div>
              <label className="block text-sm font-medium text-card-foreground mb-1">
                Razão Social *
              </label>
              <input
                type="text"
                name="businessName"
                defaultValue={billingInfo?.billingBusinessName || ""}
                placeholder="Nome da empresa"
                required
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-card-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
          )}

          {/* Telefone */}
          <div>
            <label className="block text-sm font-medium text-card-foreground mb-1 flex items-center">
              Telefone / WhatsApp *
              <FieldTooltip tooltip="Número de contato para questões sobre cobranças e faturas." docsAnchor="cobranca-dados" />
            </label>
            <input
              type="tel"
              name="phone"
              defaultValue={billingInfo?.billingPhone || ""}
              placeholder="(11) 99999-9999"
              required
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-card-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>

          {/* Endereço */}
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-card-foreground mb-1">CEP</label>
              <input
                type="text"
                name="zipCode"
                defaultValue={billingInfo?.billingAddress?.zipCode || ""}
                placeholder="00000-000"
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-card-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-card-foreground mb-1">Logradouro</label>
              <input
                type="text"
                name="street"
                defaultValue={billingInfo?.billingAddress?.street || ""}
                placeholder="Rua, Avenida..."
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-card-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-card-foreground mb-1">Número</label>
              <input
                type="text"
                name="number"
                defaultValue={billingInfo?.billingAddress?.number || ""}
                placeholder="Nº"
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-card-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-card-foreground mb-1">Complemento</label>
              <input
                type="text"
                name="complement"
                defaultValue={billingInfo?.billingAddress?.complement || ""}
                placeholder="Apto, Sala..."
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-card-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-card-foreground mb-1">Bairro</label>
              <input
                type="text"
                name="neighborhood"
                defaultValue={billingInfo?.billingAddress?.neighborhood || ""}
                placeholder="Bairro"
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-card-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-card-foreground mb-1">Cidade</label>
              <input
                type="text"
                name="city"
                defaultValue={billingInfo?.billingAddress?.city || ""}
                placeholder="Cidade"
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-card-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-card-foreground mb-1">Estado</label>
              <select
                name="state"
                defaultValue={billingInfo?.billingAddress?.state || ""}
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-card-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              >
                <option value="">Selecione</option>
                {["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"].map(uf => (
                  <option key={uf} value={uf}>{uf}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Feedback e Botão Unificado */}
      <div className="sticky bottom-4 z-10 p-4 glass-panel rounded-xl shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4 mt-8">
        <div className="flex-1">
          {state?.error && (
            <div className="flex items-start gap-2 text-sm text-destructive font-medium">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>{state.error}</span>
            </div>
          )}
          {state?.success && (
            <div className="flex items-start gap-2 text-sm text-emerald-600 font-medium">
              <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>Configurações salvas com sucesso!</span>
            </div>
          )}
        </div>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center justify-center rounded-lg bg-primary px-8 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-all duration-150 hover:bg-primary/90 active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
        >
          {pending ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Salvando...
            </span>
          ) : (
            "Salvar todas as alterações"
          )}
        </button>
      </div>
    </form>
  );
}