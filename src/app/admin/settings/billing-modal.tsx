"use client";

import { useState, useActionState, useEffect } from "react";
import { Loader2, CheckCircle2, AlertCircle, X } from "lucide-react";
import { saveBillingInfoAction } from "./actions";

interface BillingModalProps {
  open: boolean;
  onClose: () => void;
  onComplete: () => void;
  currentData: {
    billingCpfCnpj: string | null;
    billingPersonType: string | null;
    billingBusinessName: string | null;
    billingPhone: string | null;
    billingAddress: Record<string, string> | null;
  } | null;
}

export function BillingModal({ open, onClose, onComplete, currentData }: BillingModalProps) {
  const [personType, setPersonType] = useState<string>(
    currentData?.billingPersonType || "FISICA"
  );
  const [state, formAction, pending] = useActionState(
    saveBillingInfoAction,
    undefined
  );
  
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

  // Se salvou com sucesso, chamar onComplete (com cleanup para evitar múltiplos disparos)
  useEffect(() => {
    if (state?.success) {
      const timer = setTimeout(() => {
        onComplete();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [state?.success, onComplete]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-xl animate-in fade-in zoom-in-95 duration-200">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 rounded-lg p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="mb-6">
          <h2 className="text-lg font-semibold text-card-foreground">
            Dados de Cobrança
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Preencha seus dados fiscais para continuar com a assinatura. Seus dados são protegidos e usados apenas para emissão de notas fiscais.
          </p>
        </div>

        <form action={formAction} className="space-y-4">
          {/* Tipo de Pessoa */}
          <div>
            <label className="block text-sm font-medium text-card-foreground mb-2">
              Tipo de Pessoa
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
            <label className="block text-sm font-medium text-card-foreground mb-1">
              {personType === "JURIDICA" ? "CNPJ" : "CPF"} *
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
            <label className="block text-sm font-medium text-card-foreground mb-1">
              Telefone / WhatsApp *
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

          {/* Endereço simplificado */}
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
              <span>Dados salvos! Prosseguindo...</span>
            </div>
          )}

          {/* Terms Checkbox */}
          <div className="pt-2 flex items-start gap-3">
            <div className="flex h-5 items-center">
              <input
                id="terms"
                name="terms"
                type="checkbox"
                required
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="h-4 w-4 rounded border-border bg-background text-primary focus:ring-primary/20 cursor-pointer"
              />
            </div>
            <div className="text-sm text-muted-foreground">
              <label htmlFor="terms" className="font-medium text-foreground cursor-pointer">
                Li e concordo com os termos de uso.
              </label>{" "}
              <button
                type="button"
                onClick={() => setShowTermsModal(true)}
                className="text-primary hover:underline"
              >
                Ler termos resumidos
              </button>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={pending}
              className="flex-1 rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-semibold text-card-foreground transition-all hover:bg-accent active:scale-[0.97] disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={pending || !termsAccepted}
              className="flex-1 inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {pending ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Salvando...
                </span>
              ) : (
                "Salvar e continuar"
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Terms Sub-Modal */}
      {showTermsModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowTermsModal(false)} />
          <div className="relative w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <button
              onClick={() => setShowTermsModal(false)}
              className="absolute top-4 right-4 rounded-lg p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
            <h3 className="text-lg font-bold text-foreground mb-4">Termos de Uso (Resumo)</h3>
            <div className="space-y-4 text-sm text-muted-foreground max-h-[60vh] overflow-y-auto pr-2">
              <p>
                <strong>1. Benefícios do Sistema:</strong> Ao assinar, você desbloqueia as possibilidades e capacidades referentes ao seu plano (campanhas, leads e automações).
              </p>
              <p>
                <strong>2. Escassez e Limites:</strong> Respeite os limites do seu plano. O excedente pode ser pausado caso os recursos não comportem o tráfego sem um upgrade.
              </p>
              <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive mt-4">
                <p className="font-bold mb-1">Tolerância Zero - Política de Bloqueio</p>
                <p>
                  O uso do sistema é ESTRITAMENTE PROIBIDO para: campanhas ilícitas, drogas, conteúdo adulto/pornografia, esquemas de pirâmide e fraudes.
                  A violação destas regras resultará em <strong>bloqueio imediato da conta</strong>, sem aviso prévio e sem direito a reembolso.
                </p>
              </div>
            </div>
            <div className="mt-6 pt-4 border-t border-border">
              <button
                onClick={() => {
                  setTermsAccepted(true);
                  setShowTermsModal(false);
                }}
                className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
              >
                Concordar e Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}