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
} from "lucide-react";
import { changePlanCheckoutAction, cancelSubscriptionAction, reactivateSubscriptionAction, verifyPaymentAction } from "./actions";
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
    billingPhone: string | null;
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
    description: "Para testar e validar sua ideia.",
    icon: Zap,
    features: [
      "1 campanha ativa",
      "Até 100 leads/mês",
      "3 grupos de WhatsApp",
      "Formulário dinâmico",
      "Marca Vórtex+",
    ],
  },
  {
    id: "PRO" as Plan,
    name: "Pro",
    price: "R$ 97",
    priceValue: 97,
    period: "/mês",
    description: "Para lançamentos e campanhas sérias.",
    highlight: true,
    icon: Crown,
    features: [
      "10 campanhas ativas",
      "Até 10.000 leads/mês",
      "50 grupos de WhatsApp",
      "Domínio personalizado",
      "Sem marca Vórtex+",
      "Suporte prioritário (chat)",
    ],
  },
  {
    id: "ULTRA" as Plan,
    name: "Ultra",
    price: "R$ 157",
    priceValue: 157,
    period: "/mês",
    description: "Para agências e alto volume.",
    icon: Sparkles,
    features: [
      "Campanhas ilimitadas",
      "Leads ilimitados",
      "Grupos ilimitados",
      "Domínio personalizado",
      "Sem marca Vórtex+",
      "Suporte dedicado 24h",
      "SLA de uptime",
    ],
  },
];

const STATUS_LABELS: Record<string, { label: string; color: string; icon: typeof CheckCircle2 }> = {
  ACTIVE: { label: "Ativo", color: "text-emerald-600 bg-emerald-500/10 border-emerald-500/30", icon: CheckCircle2 },
  PAST_DUE: { label: "Pagamento vencido", color: "text-destructive bg-destructive/10 border-destructive/30", icon: AlertTriangle },
  CANCELING: { label: "Cancelamento agendado", color: "text-yellow-600 bg-yellow-500/10 border-yellow-500/30", icon: Clock },
  CANCELED: { label: "Cancelada", color: "text-muted-foreground bg-muted/50 border-border", icon: XCircle },
  PENDING_PAYMENT: { label: "Aguardando pagamento", color: "text-blue-600 bg-blue-500/10 border-blue-500/30", icon: Clock },
  TRIAL: { label: "Gratuito", color: "text-muted-foreground bg-muted/50 border-border", icon: Zap },
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
  const formRef = useRef<HTMLFormElement>(null);

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
      // Evita loops
      if (redirectingRef.current) return;
      
      const formData = new FormData();
      formData.append("plan", checkoutPlanParam);
      
      // Remove the parameter from URL without refreshing so we don't re-trigger it
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete("checkout_plan");
      router.replace(newUrl.pathname + newUrl.search);

      // Trigger action
      formAction(formData);
    }
  }, [checkoutPlanParam, pending, state, formAction]);

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
    <div className="space-y-6">
      {/* ================================================================ */}
      {/* SEÇÃO 1: Status da Assinatura */}
      {/* ================================================================ */}
      {isPaid && (
        <div className="glass-panel rounded-xl p-6 shadow-sm relative overflow-hidden">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-card-foreground mb-1">
                Sua Assinatura
              </h2>
              <p className="text-sm text-muted-foreground">
                Plano {currentPlan} — R$ {PLANS.find(p => p.id === currentPlan)?.priceValue || 0},00/mês
              </p>
            </div>
            <div className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${statusInfo.color}`}>
              <StatusIcon className="h-3 w-3" />
              {statusInfo.label}
            </div>
          </div>

          {/* Barra de progresso do ciclo */}
          {subscriptionInfo.currentPeriodEnd && (isActive || isCanceling) && (
            <div className="mb-4">
              <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                <span>Ciclo atual</span>
                <span>
                  {daysLeft !== null
                    ? `${daysLeft} dia${daysLeft !== 1 ? "s" : ""} restante${daysLeft !== 1 ? "s" : ""}`
                    : "—"}
                </span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isCanceling ? "bg-yellow-500" : "bg-primary"
                  }`}
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-muted-foreground/70 mt-1">
                <span>Início do ciclo</span>
                <span>Vencimento: {formatDate(subscriptionInfo.currentPeriodEnd)}</span>
              </div>
            </div>
          )}

          {/* Aviso de cancelamento agendado + botão reativar */}
          {isCanceling && subscriptionInfo.cancelAt && (
            <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/5 px-4 py-3 text-sm text-yellow-700 dark:text-yellow-400">
              <strong>Cancelamento agendado:</strong> Seu plano será rebaixado para Free em{" "}
              {formatDate(subscriptionInfo.cancelAt)}.
              Você mantém acesso completo até essa data.
            </div>
          )}

          {/* Botão reativar assinatura (quando em cancelamento) */}
          {isCanceling && (
            <div className="mt-4 pt-4 border-t border-border/50">
              <button
                onClick={handleReactivate}
                disabled={reactivating}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-emerald-500 active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {reactivating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                {reactivating ? "Reativando..." : "Reativar assinatura"}
              </button>
              {reactivateError && (
                <p className="mt-2 text-sm text-destructive">{reactivateError}</p>
              )}
            </div>
          )}

          {/* Aviso de pagamento pendente + botão verificar */}
          {isPendingPayment && subscriptionInfo.pendingPlan && (
            <div className="rounded-lg border border-blue-500/30 bg-blue-500/5 px-4 py-3 text-sm text-blue-700 dark:text-blue-400">
              <p className="mb-3">
                <strong>Aguardando pagamento</strong> para o plano {subscriptionInfo.pendingPlan}.
                Complete o pagamento para ativar.
              </p>
              <button
                onClick={handleVerifyPayment}
                disabled={verifyingPayment}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white transition-all hover:bg-blue-500 active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {verifyingPayment ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="h-3.5 w-3.5" />
                )}
                {verifyingPayment ? "Verificando..." : "Já paguei — Verificar agora"}
              </button>
              {verifyError && (
                <p className="mt-2 text-xs text-red-400">{verifyError}</p>
              )}
              {verifySuccess && (
                <p className="mt-2 text-xs text-emerald-400">✅ Pagamento confirmado! Ativando plano...</p>
              )}
            </div>
          )}

          {/* Aviso de pagamento vencido */}
          {isPastDue && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              <strong>Pagamento vencido!</strong> Regularize em{" "}
              {daysUntil(subscriptionInfo.gracePeriodEnd)} dia(s)
              para manter seu plano.
            </div>
          )}

          {/* Botão cancelar (apenas se ativo ou past_due) */}
          {(isActive || isPastDue) && (
            <div className="mt-4 pt-4 border-t border-border/50">
              <button
                onClick={() => setShowCancelDialog(true)}
                className="text-sm text-muted-foreground hover:text-destructive transition-colors"
              >
                Cancelar assinatura
              </button>
            </div>
          )}
        </div>
      )}

      {/* ================================================================ */}
      {/* SEÇÃO 2: Uso do Plano */}
      {/* ================================================================ */}
      <div className="glass-panel rounded-xl p-6 shadow-sm relative overflow-hidden">
        <h2 className="text-lg font-semibold text-card-foreground mb-1">
          Uso do Plano
        </h2>
        <p className="text-sm text-muted-foreground mb-6">
          Acompanhe o consumo dos recursos da sua conta.
        </p>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          {[
            { label: "Campanhas", stat: usage.campaigns },
            { label: "Grupos", stat: usage.groups },
            { label: "Leads", stat: usage.leads },
          ].map(({ label, stat }) => {
            const isUnlimited = stat.max === -1;
            const percentage = isUnlimited
              ? 0
              : Math.round((stat.current / stat.max) * 100);
            const isNearLimit = percentage >= 80;

            return (
              <div key={label}>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="font-medium text-foreground/80">
                    {stat.current} / {isUnlimited ? "∞" : stat.max.toLocaleString("pt-BR")}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isNearLimit ? "bg-destructive" : "bg-primary"
                    }`}
                    style={{ width: `${isUnlimited ? 0 : Math.min(percentage, 100)}%` }}
                  />
                </div>
                {isNearLimit && !isUnlimited && currentPlan === "FREE" && (
                  <p className="mt-2 text-[10px] text-destructive">
                    Quase no limite. Faça upgrade para mais recursos.
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ================================================================ */}
      {/* SEÇÃO 3: Escolher Plano */}
      {/* ================================================================ */}
      <div className="glass-panel rounded-xl p-6 shadow-sm relative overflow-hidden">
        <h2 className="text-lg font-semibold text-card-foreground mb-1">
          Escolher Plano
        </h2>
        <p className="text-sm text-muted-foreground mb-6">
          Selecione o plano ideal para o seu negócio.
        </p>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {PLANS.map((plan) => {
            const isActivePlan = plan.id === currentPlan;
            const isUpgrade = plan.priceValue > (PLANS.find(p => p.id === currentPlan)?.priceValue || 0);
            const isDowngrade = plan.priceValue < (PLANS.find(p => p.id === currentPlan)?.priceValue || 0);
            const isPendingThisPlan = subscriptionInfo.pendingPlan === plan.id;
            const PlanIcon = plan.icon;

            return (
              <div
                key={plan.id}
                className={`relative flex flex-col rounded-xl border p-5 transition-all duration-200 ${
                  isActivePlan
                    ? "border-primary/50 bg-primary/5 shadow-md shadow-primary/5 ring-1 ring-primary/20"
                    : isPendingThisPlan
                    ? "border-blue-500/50 bg-blue-500/5 ring-1 ring-blue-500/20"
                    : "border-border bg-card shadow-sm hover:shadow-md hover:-translate-y-0.5"
                }`}
              >
                {isActivePlan && (
                  <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 inline-flex items-center rounded-full bg-primary px-3 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary-foreground whitespace-nowrap">
                    Seu plano
                  </div>
                )}
                {isPendingThisPlan && !isActivePlan && (
                  <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 inline-flex items-center rounded-full bg-blue-500 px-3 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white whitespace-nowrap">
                    Aguardando pagamento
                  </div>
                )}

                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-1">
                    <PlanIcon className="h-4 w-4 text-primary" />
                    <h3 className="text-base font-bold text-card-foreground">
                      {plan.name}
                    </h3>
                  </div>
                  <div className="mt-1 flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-card-foreground">
                      {plan.price}
                    </span>
                    {plan.period && (
                      <span className="text-xs text-muted-foreground">
                        {plan.period}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {plan.description}
                  </p>
                </div>

                <ul className="mb-5 flex-1 space-y-2">
                  {plan.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-1.5 text-xs text-muted-foreground"
                    >
                      <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-primary" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* Botão contextual */}
                {isActivePlan ? (
                  <div className="inline-flex items-center justify-center rounded-lg border border-border bg-muted/50 px-4 py-2.5 text-xs font-semibold text-muted-foreground cursor-default">
                    Plano atual
                  </div>
                ) : isCanceling && plan.id === "FREE" ? (
                  <div className="inline-flex items-center justify-center rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-4 py-2.5 text-xs font-semibold text-yellow-600">
                    Cancelamento em {formatDate(subscriptionInfo.cancelAt)}
                  </div>
                ) : isDowngrade && isPaid ? (
                  // Downgrade não é mais permitido — mostrar como indisponível
                  <div className="inline-flex items-center justify-center rounded-lg border border-border bg-muted/30 px-4 py-2.5 text-xs font-semibold text-muted-foreground cursor-not-allowed">
                    Indisponível
                  </div>
                ) : (
                  <form action={formAction} onSubmit={() => setPendingPlan(plan.id)}>
                    <input type="hidden" name="plan" value={plan.id} />
                    <button
                      type="submit"
                      disabled={pending || isCanceling}
                      className={`inline-flex w-full items-center justify-center gap-1.5 rounded-lg border px-4 py-2.5 text-xs font-semibold transition-all duration-150 active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed ${
                        isUpgrade
                          ? "border-primary bg-primary text-primary-foreground hover:bg-primary/90"
                          : "border-border bg-background text-card-foreground hover:bg-accent hover:text-accent-foreground"
                      }`}
                    >
                      {pending ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : isUpgrade ? (
                        <>
                          Fazer upgrade
                          <ArrowRight className="h-3.5 w-3.5" />
                        </>
                      ) : (
                        <>
                          Mudar para {plan.name}
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

        {/* Error feedback */}
        {state?.error && (
          <div className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {state.error}
            {state.needsBilling && (
              <span className="block mt-1 text-xs">
                Vá até a aba <strong>Perfil</strong> e preencha seus dados de cobrança.
              </span>
            )}
          </div>
        )}

        {state?.success && (
          <div className="mt-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-600">
            Plano atualizado com sucesso! As alterações serão refletidas em breve.
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

      {/* Billing Modal — abre quando precisa preencher dados pra assinar */}
      <BillingModal
        open={showBillingModal}
        onClose={() => setShowBillingModal(false)}
        onComplete={() => {
          setShowBillingModal(false);
          if (pendingPlan) {
            const formData = new FormData();
            formData.append("plan", pendingPlan);
            formAction(formData);
            setPendingPlan(null); // Clear after submission
          } else {
            router.replace("/admin/settings?tab=subscription");
          }
        }}
        currentData={billingInfo as any}
      />
    </div>
  );
}