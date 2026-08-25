"use client";

import { useState, useActionState, useEffect } from "react";
import { Loader2, CheckCircle2, AlertCircle, X, ShieldCheck } from "lucide-react";
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

  // Se salvou com sucesso, chamar onComplete
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/80 backdrop-blur-xl animate-in fade-in duration-200" onClick={onClose} />

      {/* Modal */}
      <div className="relative my-auto w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-white/15 bg-zinc-950 p-6 sm:p-7 shadow-2xl animate-in zoom-in-95 duration-200 z-10 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div>
            <h2 className="text-lg font-bold text-foreground">
              Dados Fiscais & Cobrança
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Informações necessárias para emissão de notas fiscais e ativação da assinatura.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-1.5 text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form action={formAction} className="space-y-4">
          {/* Tipo de Pessoa */}
          <div>
            <label className="block text-xs font-semibold text-foreground/80 mb-2">
              Tipo de Titular Fiscal
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPersonType("FISICA")}
                className={`rounded-xl border px-4 py-2.5 text-xs font-bold transition-all active:scale-95 ${
                  personType === "FISICA"
                    ? "border-primary bg-primary/15 text-primary shadow-sm ring-1 ring-primary/30"
                    : "border-white/10 bg-white/[0.03] text-muted-foreground hover:border-white/20"
                }`}
              >
                Pessoa Física (CPF)
              </button>
              <button
                type="button"
                onClick={() => setPersonType("JURIDICA")}
                className={`rounded-xl border px-4 py-2.5 text-xs font-bold transition-all active:scale-95 ${
                  personType === "JURIDICA"
                    ? "border-primary bg-primary/15 text-primary shadow-sm ring-1 ring-primary/30"
                    : "border-white/10 bg-white/[0.03] text-muted-foreground hover:border-white/20"
                }`}
              >
                Pessoa Jurídica (CNPJ)
              </button>
            </div>
            <input type="hidden" name="personType" value={personType} />
          </div>

          {/* CPF ou CNPJ */}
          <div>
            <label className="block text-xs font-semibold text-foreground/80 mb-1.5">
              {personType === "JURIDICA" ? "CNPJ da Empresa" : "CPF do Titular"} *
            </label>
            <input
              type="text"
              name="cpfCnpj"
              defaultValue={currentData?.billingCpfCnpj || ""}
              placeholder={personType === "JURIDICA" ? "00.000.000/0001-00" : "000.000.000-00"}
              required
              className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-xs sm:text-sm text-foreground font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-4 focus:ring-primary/20 focus:border-primary/50 transition-all"
            />
          </div>

          {/* Razão Social (apenas PJ) */}
          {personType === "JURIDICA" && (
            <div>
              <label className="block text-xs font-semibold text-foreground/80 mb-1.5">
                Razão Social *
              </label>
              <input
                type="text"
                name="businessName"
                defaultValue={currentData?.billingBusinessName || ""}
                placeholder="Nome empresarial conforme cartão CNPJ"
                required
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-4 focus:ring-primary/20 focus:border-primary/50 transition-all"
              />
            </div>
          )}

          {/* Telefone */}
          <div>
            <label className="block text-xs font-semibold text-foreground/80 mb-1.5">
              Telefone / WhatsApp de Contato *
            </label>
            <input
              type="tel"
              name="phone"
              defaultValue={currentData?.billingPhone || ""}
              placeholder="(11) 99999-9999"
              required
              className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-xs sm:text-sm text-foreground font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-4 focus:ring-primary/20 focus:border-primary/50 transition-all"
            />
          </div>

          {/* Endereço */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-foreground/80 mb-1.5">CEP</label>
              <input
                type="text"
                name="zipCode"
                defaultValue={currentData?.billingAddress?.zipCode || ""}
                placeholder="00000-000"
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-xs sm:text-sm text-foreground font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-4 focus:ring-primary/20 focus:border-primary/50 transition-all"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-foreground/80 mb-1.5">Logradouro / Rua</label>
              <input
                type="text"
                name="street"
                defaultValue={currentData?.billingAddress?.street || ""}
                placeholder="Rua, Avenida..."
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-4 focus:ring-primary/20 focus:border-primary/50 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground/80 mb-1.5">Número</label>
              <input
                type="text"
                name="number"
                defaultValue={currentData?.billingAddress?.number || ""}
                placeholder="Nº"
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-4 focus:ring-primary/20 focus:border-primary/50 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground/80 mb-1.5">Complemento</label>
              <input
                type="text"
                name="complement"
                defaultValue={currentData?.billingAddress?.complement || ""}
                placeholder="Apto, Sala..."
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-4 focus:ring-primary/20 focus:border-primary/50 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground/80 mb-1.5">Bairro</label>
              <input
                type="text"
                name="neighborhood"
                defaultValue={currentData?.billingAddress?.neighborhood || ""}
                placeholder="Bairro"
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-4 focus:ring-primary/20 focus:border-primary/50 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground/80 mb-1.5">Cidade</label>
              <input
                type="text"
                name="city"
                defaultValue={currentData?.billingAddress?.city || ""}
                placeholder="Cidade"
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-4 focus:ring-primary/20 focus:border-primary/50 transition-all"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-foreground/80 mb-1.5">Estado (UF)</label>
              <select
                name="state"
                defaultValue={currentData?.billingAddress?.state || ""}
                className="w-full rounded-xl border border-white/10 bg-zinc-900 px-4 py-2.5 text-xs sm:text-sm text-foreground focus:outline-none focus:ring-4 focus:ring-primary/20 focus:border-primary/50 transition-all"
              >
                <option value="">Selecione o Estado</option>
                {["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"].map(uf => (
                  <option key={uf} value={uf}>{uf}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Feedback */}
          {state?.error && (
            <div className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-xs text-destructive font-semibold">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{state.error}</span>
            </div>
          )}
          {state?.success && (
            <div className="flex items-start gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-xs text-emerald-400 font-semibold">
              <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
              <span>Dados fiscais salvos com sucesso! Prosseguindo...</span>
            </div>
          )}

          {/* Terms Checkbox */}
          <div className="pt-3 flex items-start gap-3 border-t border-white/10">
            <div className="flex h-5 items-center">
              <input
                id="terms"
                name="terms"
                type="checkbox"
                required
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="h-4 w-4 rounded border-white/20 bg-transparent text-primary focus:ring-primary/20 cursor-pointer"
              />
            </div>
            <div className="text-xs text-muted-foreground">
              <label htmlFor="terms" className="font-medium text-foreground cursor-pointer">
                Li e concordo com os termos de uso do Vórtex+.
              </label>{" "}
              <button
                type="button"
                onClick={() => setShowTermsModal(true)}
                className="text-primary hover:underline font-semibold"
              >
                Ler resumo dos termos
              </button>
            </div>
          </div>

          <div className="flex gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              disabled={pending}
              className="flex-1 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-4 py-2.5 text-xs font-bold text-foreground transition-all active:scale-95 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={pending || !termsAccepted}
              className="flex-1 inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {pending ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Salvando Dados...
                </span>
              ) : (
                "Salvar e Prosseguir"
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Terms Sub-Modal */}
      {showTermsModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 overflow-y-auto">
          <div className="fixed inset-0 bg-black/80 backdrop-blur-xl" onClick={() => setShowTermsModal(false)} />
          <div className="relative my-auto w-full max-w-lg rounded-2xl border border-white/15 bg-zinc-950 p-6 shadow-2xl animate-in zoom-in-95 z-10 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-primary" />
                <h3 className="text-base font-bold text-foreground">Termos de Uso (Resumo)</h3>
              </div>
              <button
                onClick={() => setShowTermsModal(false)}
                className="rounded-xl p-1 text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-muted-foreground max-h-[50vh] overflow-y-auto pr-2 leading-relaxed">
              <p>
                <strong className="text-foreground">1. Capacidades do Sistema:</strong> Ao assinar, você desbloqueia a capacidade de campanhas, leads, automações e conexões de WhatsApp do seu plano.
              </p>
              <p>
                <strong className="text-foreground">2. Limites de Utilização:</strong> Respeite os limites do plano. Caso atinja o teto, novos disparos e leads podem ser temporariamente pausados até que ocorra um upgrade.
              </p>
              <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/25 text-destructive">
                <p className="font-bold mb-1">Tolerância Zero — Política de Bloqueio</p>
                <p className="leading-normal">
                  É terminantemente proibido o uso da plataforma para campanhas de spam ilegal, produtos ilícitos, pornografia e esquemas fraudulentos. O descumprimento gera suspensão imediata e irrevogável da conta.
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => {
                  setTermsAccepted(true);
                  setShowTermsModal(false);
                }}
                className="w-full rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-all active:scale-95 shadow-md shadow-primary/20"
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