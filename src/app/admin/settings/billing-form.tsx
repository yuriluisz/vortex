"use client";

import { useActionState, useState } from "react";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { saveBillingInfoAction } from "./actions";
import { FieldTooltip } from "@/components/admin/field-tooltip";

interface BillingFormProps {
  currentData: {
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
  } | null;
}

export function BillingInfoForm({ currentData }: BillingFormProps) {
  const [personType, setPersonType] = useState<string>(
    currentData?.billingPersonType || "FISICA"
  );
  const [state, formAction, pending] = useActionState(
    saveBillingInfoAction,
    undefined
  );

  const hasBillingData = !!(currentData?.billingCpfCnpj && currentData?.billingPhone);

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
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
        Esses dados são usados para criar sua conta de cobrança e emissão de faturas. Você pode alterar quando quiser.
      </p>

      <form action={formAction} className="space-y-4">
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
            defaultValue={currentData?.billingCpfCnpj || ""}
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
              defaultValue={currentData?.billingBusinessName || ""}
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
            defaultValue={currentData?.billingPhone || ""}
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
              defaultValue={currentData?.billingAddress?.zipCode || ""}
              placeholder="00000-000"
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-card-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-card-foreground mb-1">Logradouro</label>
            <input
              type="text"
              name="street"
              defaultValue={currentData?.billingAddress?.street || ""}
              placeholder="Rua, Avenida..."
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-card-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-card-foreground mb-1">Número</label>
            <input
              type="text"
              name="number"
              defaultValue={currentData?.billingAddress?.number || ""}
              placeholder="Nº"
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-card-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-card-foreground mb-1">Complemento</label>
            <input
              type="text"
              name="complement"
              defaultValue={currentData?.billingAddress?.complement || ""}
              placeholder="Apto, Sala..."
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-card-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-card-foreground mb-1">Bairro</label>
            <input
              type="text"
              name="neighborhood"
              defaultValue={currentData?.billingAddress?.neighborhood || ""}
              placeholder="Bairro"
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-card-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-card-foreground mb-1">Cidade</label>
            <input
              type="text"
              name="city"
              defaultValue={currentData?.billingAddress?.city || ""}
              placeholder="Cidade"
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-card-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-card-foreground mb-1">Estado</label>
            <select
              name="state"
              defaultValue={currentData?.billingAddress?.state || ""}
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-card-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            >
              <option value="">Selecione</option>
              {["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"].map(uf => (
                <option key={uf} value={uf}>{uf}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Feedback */}
        {state?.error && (
          <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>{state.error}</span>
          </div>
        )}
        {state?.success && (
          <div className="flex items-start gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-600">
            <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>Dados salvos com sucesso!</span>
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={pending}
            className="inline-flex items-center justify-center rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {pending ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Salvando...
              </span>
            ) : (
              "Salvar dados de cobrança"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}