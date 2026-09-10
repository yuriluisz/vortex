"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  CheckCircle2,
  ArrowRight,
  Loader2,
  AlertTriangle,
  Clock,
  Zap,
  Crown,
  Sparkles,
  XCircle,
  RefreshCw,
  CreditCard,
  Building,
  BarChart3,
  Calendar,
  Layers,
  Users,
  Send,
  Edit,
} from "lucide-react";
import { changePlanCheckoutAction, reactivateSubscriptionAction, verifyPaymentAction } from "./actions";
import { CancelDialog } from "./cancel-dialog";
import { BillingModal } from "./billing-modal";
import type { Plan } from "@prisma/client";

interface UsageStats {
  campaigns: { current: number; max: number };
  groups: { current: number; max: number };
  leads: { current: number; max: number };
}

interface SubscriptionInfo {
  status: string;
  currentPeriodEnd: string | null;
  pendingPlan: Plan | null;
  cancelAt: string | null;
  gracePeriodEnd: string | null;
  hasSubscription: boolean;
}

interface PlanSelectorProps {
  currentPlan: Plan;
  usage: UsageStats;
  billingInfo?: {
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
  subscriptionInfo: SubscriptionInfo;
}

const PLANS = [
  {
    id: "FREE" as Plan,
    name: "Free",
    price: "Grátis",
    priceValue: 0,
    period: "",
    description: "Para testar, validar e estruturar seu primeiro funil.",
    icon: Zap,
    features: [
      "1 campanha ativa simultânea",
      "Até 100 leads por mês",
      "3 grupos de WhatsApp vinculados",
      "Formulário dinâmico integrado",
      "Selo discreto Vórtex+",
    ],
  },
  {
    id: "PRO" as Plan,
    name: "Pro",
    price: "R$ 97",
    priceValue: 97,
    period: "/mês",
    description: "Para lançamentos consistentes e crescimento acelerado.",
    highlight: true,
    icon: Crown,
    features: [
      "10 campanhas ativas simultâneas",
      "Até 10.000 leads por mês",
      "50 grupos de WhatsApp vinculados",
      "Domínio personalizado próprio",
      "Sem qualquer marcação Vórtex+",
      "Suporte prioritário via chat",
    ],
  },
  {
    id: "ULTRA" as Plan,
    name: "Ultra",
    price: "R$ 157",
    priceValue: 157,
    period: "/mês",
    description: "Para agências, grandes produtores e alto volume de escala.",
    icon: Sparkles,
    features: [
      "Campanhas ativas ilimitadas (∞)",
      "Leads capturados ilimitados (∞)",
      "Grupos de WhatsApp ilimitados (∞)",
      "Gravação de Sessões & Replay de Tela em Vídeo",
      "Mapa de Calor Térmico (Mobile & Desktop)",
      "Integração WhatsApp & Disparos em Massa",
      "Criação automática de grupos via API",
      "Domínio próprio + Suporte dedicado 24/7",
    ],
  },
];

const STATUS_LABELS: Record<string, { label: string; color: string; icon: typeof CheckCircle2 }> = {
  ACTIVE: { label: "Plano Ativo", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20", icon: CheckCircle2 },
  PAST_DUE: { label: "Pagamento Vencido", color: "text-destructive bg-destructive/10 border-destructive/20", icon: AlertTriangle },
  CANCELING: { label: "Cancelamento Agendado", color: "text-amber-400 bg-amber-500/10 border-amber-500/20", icon: Clock },
  CANCELED: { label: "Cancelada", color: "text-muted-foreground bg-white/5 border-white/10", icon: XCircle },
  PENDING_PAYMENT: { label: "Aguardando Pagamento", color: "text-blue-400 bg-blue-500/10 border-blue-500/20", icon: Clock },
  TRIAL: { label: "Período Gratuito", color: "text-muted-foreground bg-white/5 border-white/10", icon: Zap },
};

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  const date = new Date(dateStr);
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function cycleProgress(currentPeriodEnd: string | null): number {
  if (!currentPeriodEnd) return 0;
  const end = new Date(currentPeriodEnd).getTime();
  const start = end - 30 * 24 * 60 * 60 * 1000;
  const now = Date.now();
  const elapsed = now - start;
  const total = end - start;
  return Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)));
}

export function PlanSelector({
  currentPlan,
  usage,
  billingInfo,
  subscriptionInfo,
}: PlanSelectorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const checkoutPlanParam = searchParams.get("checkout_plan");
  
  const [state, formAction, pending] = useActionState(changePlanCheckoutAction, undefined);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showBillingModal, setShowBillingModal] = useState(false);
  const [reactivating, setReactivating] = useState(false);
  const [reactivateError, setReactivateError] = useState<string | null>(null);
  const [verifyingPayment, setVerifyingPayment] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [verifySuccess, setVerifySuccess] = useState(false);
  const [pendingPlan, setPendingPlan] = useState<string | null>(null);
  const redirectingRef = useRef(false);

  // Redirect para checkout ASAAS
  useEffect(() => {
    if (state?.invoiceUrl && !redirectingRef.current) {
      redirectingRef.current = true;
      window.location.href = state.invoiceUrl;
    }
  }, [state?.invoiceUrl]);

  // Automação do checkout vindo do Login
  useEffect(() => {
    if (checkoutPlanParam && !pending && !state?.needsBilling && !state?.invoiceUrl) {
      if (redirectingRef.current) return;
      
      const formData = new FormData();
      formData.append("plan", checkoutPlanParam);
      
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete("checkout_plan");
      router.replace(newUrl.pathname + newUrl.search);

      formAction(formData);
    }
  }, [checkoutPlanParam, pending, state, formAction, router]);

  // Detectar needsBilling e abrir modal
  useEffect(() => {
    if (state?.needsBilling) {
      setShowBillingModal(true);
    }
  }, [state?.needsBilling]);

  const statusInfo = STATUS_LABELS[subscriptionInfo.status] || STATUS_LABELS.TRIAL;
  const StatusIcon = statusInfo.icon;
  const isPaid = currentPlan !== "FREE";
  const isActive = subscriptionInfo.status === "ACTIVE";
  const isCanceling = subscriptionInfo.status === "CANCELING";
  const isPastDue = subscriptionInfo.status === "PAST_DUE";
  const isPendingPayment = subscriptionInfo.status === "PENDING_PAYMENT";
  const progress = cycleProgress(subscriptionInfo.currentPeriodEnd);
  const daysLeft = daysUntil(subscriptionInfo.currentPeriodEnd);

  const handleReactivate = async () => {
    setReactivating(true);
    setReactivateError(null);
    try {
      const result = await reactivateSubscriptionAction();
      if (result?.error) {
        setReactivateError(result.error);
      } else {
        window.location.reload();
      }
    } catch (error) {
      setReactivateError(error instanceof Error ? error.message : "Erro ao reativar assinatura.");
    } finally {
      setReactivating(false);
    }
  };

  const handleVerifyPayment = async () => {
    setVerifyingPayment(true);
    setVerifyError(null);
    setVerifySuccess(false);
    try {
      const result = await verifyPaymentAction();
      if (result?.error) {
        setVerifyError(result.error);
      } else {
        setVerifySuccess(true);
        setTimeout(() => window.location.reload(), 1500);
      }
    } catch (error) {
      setVerifyError(error instanceof Error ? error.message : "Erro ao verificar pagamento.");
    } finally {
      setVerifyingPayment(false);
    }
  };

  return (
    <div className="space-y-8 pb-16">
      {/* ------------------------------------------------------------------- */}
      {/* 1. HERO DA ASSINATURA ATUAL                                         */}
      {/* ------------------------------------------------------------------- */}
      {isPaid && (
        <div className="glass-panel rounded-2xl p-6 sm:p-7 border border-primary/25 bg-gradient-to-br from-primary/10 via-zinc-950/70 to-zinc-950/90 backdrop-blur-xl shadow-xl space-y-5 relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="h-11 w-11 rounded-2xl bg-primary/20 border border-primary/30 text-primary flex items-center justify-center shadow-lg shadow-primary/20 shrink-0">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground">
                  Assinatura Plano {currentPlan}
                </h2>
                <p className="text-xs text-muted-foreground">
                  Valor mensal: <strong className="text-foreground">R$ {PLANS.find(p => p.id === currentPlan)?.priceValue || 0},00/mês</strong>
                </p>
              </div>
            </div>

            <div className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold self-start ${statusInfo.color}`}>
              <StatusIcon className="h-3.5 w-3.5" />
              <span>{statusInfo.label}</span>
            </div>
          </div>

          {/* Barra de Progresso do Ciclo */}
          {subscriptionInfo.currentPeriodEnd && (isActive || isCanceling) && (
            <div className="p-4 rounded-xl border border-white/5 bg-white/[0.02] space-y-2">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-primary" />
                  Ciclo Atual de Cobrança
                </span>
                <span className="text-primary font-bold">
                  {daysLeft !== null
                    ? `${daysLeft} dia${daysLeft !== 1 ? "s" : ""} restante${daysLeft !== 1 ? "s" : ""}`
                    : "—"}
                </span>
              </div>
              <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isCanceling ? "bg-amber-400" : "bg-gradient-to-r from-primary to-primary/70"
                  }`}
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-muted-foreground font-mono">
                <span>Início do ciclo</span>
                <span>Próxima renovação: {formatDate(subscriptionInfo.currentPeriodEnd)}</span>
              </div>
            </div>
          )}

          {/* Aviso de cancelamento agendado */}
          {isCanceling && subscriptionInfo.cancelAt && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs sm:text-sm text-amber-400 font-medium space-y-3">
              <p>
                <strong>Cancelamento agendado:</strong> Seu plano será revertido para Free em{" "}
                <strong>{formatDate(subscriptionInfo.cancelAt)}</strong>. Você continua com acesso total até essa data.
              </p>
              <button
                onClick={handleReactivate}
                disabled={reactivating}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 active:scale-95 px-4 py-2 text-xs font-bold text-white transition-all shadow-md disabled:opacity-50"
              >
                {reactivating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                {reactivating ? "Reativando..." : "Reativar Assinatura Agora"}
              </button>
              {reactivateError && (
                <p className="text-xs text-destructive">{reactivateError}</p>
              )}
            </div>
          )}

          {/* Aviso de pagamento pendente */}
          {isPendingPayment && subscriptionInfo.pendingPlan && (
            <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-4 text-xs sm:text-sm text-blue-400 space-y-3">
              <p>
                <strong>Aguardando confirmação de pagamento</strong> para o plano {subscriptionInfo.pendingPlan}.
              </p>
              <button
                onClick={handleVerifyPayment}
                disabled={verifyingPayment}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-500 hover:bg-blue-600 active:scale-95 px-4 py-2 text-xs font-bold text-white transition-all shadow-md disabled:opacity-50"
              >
                {verifyingPayment ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                {verifyingPayment ? "Verificando..." : "Já Paguei — Verificar Agora"}
              </button>
              {verifyError && <p className="text-xs text-destructive">{verifyError}</p>}
              {verifySuccess && <p className="text-xs text-emerald-400 font-semibold">✅ Pagamento confirmado com sucesso!</p>}
            </div>
          )}

          {/* Aviso de pagamento vencido */}
          {isPastDue && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-xs sm:text-sm text-destructive font-medium">
              <strong>Pagamento vencido!</strong> Regularize em{" "}
              {daysUntil(subscriptionInfo.gracePeriodEnd)} dia(s) para manter os recursos liberados.
            </div>
          )}

          {/* Ação de Cancelar */}
          {(isActive || isPastDue) && (
            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowCancelDialog(true)}
                className="text-xs font-semibold text-muted-foreground hover:text-destructive transition-colors"
              >
                Cancelar assinatura do plano
              </button>
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* 2. CONSUMO DE RECURSOS (USO DO PLANO)                               */}
      {/* ------------------------------------------------------------------- */}
      <div className="glass-panel rounded-2xl p-6 sm:p-7 border border-white/10 bg-zinc-950/70 backdrop-blur-xl shadow-xl space-y-6">
        <div className="flex items-center gap-3 border-b border-white/10 pb-4">
          <div className="h-9 w-9 rounded-xl bg-primary/15 border border-primary/25 text-primary flex items-center justify-center">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground">
              Consumo de Recursos
            </h3>
            <p className="text-xs text-muted-foreground">
              Acompanhe os limites de utilização da sua conta no plano atual.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: "Campanhas Ativas", stat: usage.campaigns, icon: Layers },
            { label: "Grupos Vinculados", stat: usage.groups, icon: Users },
            { label: "Leads Capturados", stat: usage.leads, icon: Send },
          ].map(({ label, stat, icon: Icon }) => {
            const isUnlimited = stat.max === -1;
            const percentage = isUnlimited ? 0 : Math.round((stat.current / stat.max) * 100);
            const isNearLimit = percentage >= 80;

            return (
              <div
                key={label}
                className="p-4 rounded-xl border border-white/10 bg-white/[0.02] space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                    <Icon className="w-3.5 h-3.5 text-primary" />
                    {label}
                  </span>
                  <span className="text-xs font-bold text-foreground font-mono">
                    {stat.current.toLocaleString("pt-BR")} / {isUnlimited ? "∞" : stat.max.toLocaleString("pt-BR")}
                  </span>
                </div>

                <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isNearLimit ? "bg-destructive" : "bg-primary"
                    }`}
                    style={{ width: `${isUnlimited ? 0 : Math.min(percentage, 100)}%` }}
                  />
                </div>

                {isNearLimit && !isUnlimited && currentPlan === "FREE" && (
                  <p className="text-[10px] text-destructive font-medium">
                    Próximo do limite gratuito. Faça upgrade para continuar capturando.
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ------------------------------------------------------------------- */}
      {/* 3. DADOS DE COBRANÇA & FATURAMENTO                                  */}
      {/* ------------------------------------------------------------------- */}
      <div className="glass-panel rounded-2xl p-6 sm:p-7 border border-white/10 bg-zinc-950/70 backdrop-blur-xl shadow-xl space-y-6">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-primary/15 border border-primary/25 text-primary flex items-center justify-center">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">
                Dados de Cobrança
              </h3>
              <p className="text-xs text-muted-foreground">
                Informações fiscais para emissão de notas e pagamentos.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowBillingModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-foreground transition-all active:scale-95"
          >
            <Edit className="w-3.5 h-3.5 text-muted-foreground" />
            <span>Editar Dados</span>
          </button>
        </div>

        {billingInfo && (billingInfo.billingCpfCnpj || billingInfo.billingBusinessName || billingInfo.billingAddress) ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Tipo de Pessoa */}
            {billingInfo.billingPersonType && (
              <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3.5">
                <span className="text-[11px] uppercase tracking-wider font-bold text-muted-foreground block">
                  Tipo de Titular
                </span>
                <p className="text-xs font-semibold text-foreground mt-1">
                  {billingInfo.billingPersonType === "FISICA" ? "Pessoa Física (CPF)" : "Pessoa Jurídica (CNPJ)"}
                </p>
              </div>
            )}

            {/* CPF/CNPJ */}
            {billingInfo.billingCpfCnpj && (
              <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3.5">
                <span className="text-[11px] uppercase tracking-wider font-bold text-muted-foreground block">
                  Documento Fiscal
                </span>
                <p className="text-xs font-semibold text-foreground font-mono mt-1">
                  {billingInfo.billingCpfCnpj}
                </p>
              </div>
            )}

            {/* Razão Social */}
            {billingInfo.billingBusinessName && (
              <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3.5 sm:col-span-2">
                <span className="text-[11px] uppercase tracking-wider font-bold text-muted-foreground block">
                  Razão Social / Nome Completo
                </span>
                <p className="text-xs font-semibold text-foreground mt-1">
                  {billingInfo.billingBusinessName}
                </p>
              </div>
            )}

            {/* Telefone */}
            {billingInfo.billingPhone && (
              <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3.5">
                <span className="text-[11px] uppercase tracking-wider font-bold text-muted-foreground block">
                  Telefone de Cobrança
                </span>
                <p className="text-xs font-semibold text-foreground font-mono mt-1">
                  {billingInfo.billingPhone}
                </p>
              </div>
            )}

            {/* Endereço */}
            {billingInfo.billingAddress && (
              <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3.5 sm:col-span-2">
                <span className="text-[11px] uppercase tracking-wider font-bold text-muted-foreground block">
                  Endereço Cadastrado
                </span>
                <p className="text-xs font-medium text-foreground mt-1 leading-relaxed">
                  {[
                    billingInfo.billingAddress.street,
                    billingInfo.billingAddress.number ? `Nº ${billingInfo.billingAddress.number}` : null,
                    billingInfo.billingAddress.complement,
                    billingInfo.billingAddress.neighborhood,
                    `${billingInfo.billingAddress.city} - ${billingInfo.billingAddress.state}`,
                    billingInfo.billingAddress.zipCode,
                  ].filter(Boolean).join(", ")}
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-xs text-amber-400 font-medium">
            Seus dados de cobrança ainda não foram preenchidos. Clique em <strong>Editar Dados</strong> para configurar antes de assinar um plano pago.
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------------- */}
      {/* 4. ESCOLHER / MUDAR DE PLANO (TABELA DE PREÇOS)                     */}
      {/* ------------------------------------------------------------------- */}
      <div className="glass-panel rounded-2xl p-6 sm:p-7 border border-white/10 bg-zinc-950/70 backdrop-blur-xl shadow-xl space-y-6">
        <div className="border-b border-white/10 pb-4">
          <h3 className="text-base font-bold text-foreground">
            Planos Disponíveis
          </h3>
          <p className="text-xs text-muted-foreground">
            Evolua sua conta com mais capacidade de campanhas, leads e automação.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {PLANS.map((plan) => {
            const isActivePlan = plan.id === currentPlan;
            const isUpgrade = plan.priceValue > (PLANS.find(p => p.id === currentPlan)?.priceValue || 0);
            const isDowngrade = plan.priceValue < (PLANS.find(p => p.id === currentPlan)?.priceValue || 0);
            const isPendingThisPlan = subscriptionInfo.pendingPlan === plan.id;
            const PlanIcon = plan.icon;

            return (
              <div
                key={plan.id}
                className={`relative flex flex-col rounded-2xl border p-6 transition-all duration-300 ${
                  isActivePlan
                    ? "border-primary bg-primary/10 shadow-xl shadow-primary/10 ring-1 ring-primary/40"
                    : plan.highlight
                    ? "border-primary/50 bg-white/[0.02] shadow-lg hover:border-primary"
                    : isPendingThisPlan
                    ? "border-blue-500/50 bg-blue-500/5 ring-1 ring-blue-500/20"
                    : "border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]"
                }`}
              >
                {/* Badge Superior */}
                {isActivePlan && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center rounded-full bg-primary px-3.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary-foreground shadow-md shadow-primary/30 whitespace-nowrap">
                    Seu Plano Atual
                  </div>
                )}
                {plan.highlight && !isActivePlan && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center rounded-full bg-gradient-to-r from-primary to-accent px-3.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-md whitespace-nowrap">
                    Mais Escolhido
                  </div>
                )}
                {isPendingThisPlan && !isActivePlan && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center rounded-full bg-blue-500 px-3.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">
                    Aguardando Pagamento
                  </div>
                )}

                <div className="mb-5">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-8 w-8 rounded-xl bg-primary/15 border border-primary/25 text-primary flex items-center justify-center">
                      <PlanIcon className="h-4 w-4" />
                    </div>
                    <h4 className="text-lg font-bold text-foreground">
                      {plan.name}
                    </h4>
                  </div>

                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold text-foreground tracking-tight">
                      {plan.price}
                    </span>
                    {plan.period && (
                      <span className="text-xs text-muted-foreground font-semibold">
                        {plan.period}
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                    {plan.description}
                  </p>
                </div>

                <ul className="mb-6 flex-1 space-y-2.5 pt-2 border-t border-white/5">
                  {plan.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-2 text-xs text-foreground/80 leading-relaxed"
                    >
                      <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-primary" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* Botão de Ação */}
                {isActivePlan ? (
                  <div className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-bold text-muted-foreground cursor-default">
                    Plano Ativo
                  </div>
                ) : isCanceling && plan.id === "FREE" ? (
                  <div className="inline-flex items-center justify-center rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-xs font-semibold text-amber-400">
                    Cancelamento em {formatDate(subscriptionInfo.cancelAt)}
                  </div>
                ) : isDowngrade && isPaid ? (
                  <div className="inline-flex items-center justify-center rounded-xl border border-white/5 bg-white/[0.02] px-4 py-2.5 text-xs font-semibold text-muted-foreground/60 cursor-not-allowed">
                    Indisponível
                  </div>
                ) : (
                  <form action={formAction} onSubmit={() => setPendingPlan(plan.id)}>
                    <input type="hidden" name="plan" value={plan.id} />
                    <button
                      type="submit"
                      disabled={pending || isCanceling}
                      className={`inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
                        isUpgrade || plan.highlight
                          ? "bg-primary hover:bg-primary/90 text-primary-foreground shadow-primary/20"
                          : "border border-white/10 bg-white/5 hover:bg-white/10 text-foreground"
                      }`}
                    >
                      {pending ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : isUpgrade ? (
                        <>
                          Fazer Upgrade
                          <ArrowRight className="h-3.5 w-3.5" />
                        </>
                      ) : (
                        <>
                          Assinar {plan.name}
                          <ArrowRight className="h-3.5 w-3.5" />
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>
            );
          })}
        </div>

        {/* Error / Success feedback */}
        {state?.error && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-xs text-destructive font-semibold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{state.error}</span>
          </div>
        )}
      </div>

      {/* Cancel Dialog */}
      <CancelDialog
        open={showCancelDialog}
        onClose={() => setShowCancelDialog(false)}
        currentPlan={currentPlan}
        currentPeriodEnd={subscriptionInfo.currentPeriodEnd}
      />

      {/* Billing Modal */}
      <BillingModal
        open={showBillingModal}
        onClose={() => setShowBillingModal(false)}
        onComplete={() => {
          setShowBillingModal(false);
          if (pendingPlan) {
            const formData = new FormData();
            formData.append("plan", pendingPlan);
            formAction(formData);
            setPendingPlan(null);
          } else {
            router.replace("/admin/settings?tab=subscription");
          }
        }}
        currentData={billingInfo as any}
      />
    </div>
  );
}