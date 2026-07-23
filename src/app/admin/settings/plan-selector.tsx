"use client";

import { useActionState } from "react";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { changePlanCheckoutAction } from "./actions";
import type { Plan } from "@prisma/client";

interface PlanSelectorProps {
  currentPlan: Plan;
}

const PLANS = [
  {
    id: "FREE" as Plan,
    name: "Free",
    price: "Grátis",
    period: "",
    description: "Para testar e validar sua ideia.",
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
    period: "/mês",
    description: "Para lançamentos e campanhas sérias.",
    highlight: true,
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
    period: "/mês",
    description: "Para agências e alto volume.",
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

export function PlanSelector({ currentPlan }: PlanSelectorProps) {
  const [state, formAction, pending] = useActionState(
    changePlanCheckoutAction,
    undefined
  );

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-card-foreground mb-1">
        Plano
      </h2>
      <p className="text-sm text-muted-foreground mb-6">
        Escolha o plano ideal para o seu negócio. Você pode mudar quando quiser.
      </p>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {PLANS.map((plan) => {
          const isActive = plan.id === currentPlan;

          return (
            <div
              key={plan.id}
              className={`relative flex flex-col rounded-xl border p-5 transition-all duration-200 ${
                isActive
                  ? "border-primary/50 bg-primary/5 shadow-md shadow-primary/5 ring-1 ring-primary/20"
                  : "border-border bg-card shadow-sm hover:shadow-md hover:-translate-y-0.5"
              }`}
            >
              {isActive && (
                <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 inline-flex items-center rounded-full bg-primary px-3 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary-foreground whitespace-nowrap">
                  Seu plano
                </div>
              )}

              <div className="mb-4">
                <h3 className="text-base font-bold text-card-foreground">
                  {plan.name}
                </h3>
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

              {isActive ? (
                <div className="inline-flex items-center justify-center rounded-lg border border-border bg-muted/50 px-4 py-2.5 text-xs font-semibold text-muted-foreground cursor-default">
                  Plano atual
                </div>
              ) : (
                <form action={formAction}>
                  <input type="hidden" name="plan" value={plan.id} />
                  <button
                    type="submit"
                    disabled={pending}
                    className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-border bg-background px-4 py-2.5 text-xs font-semibold text-card-foreground transition-all duration-150 hover:bg-accent hover:text-accent-foreground active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Mudar para {plan.name}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </form>
              )}
            </div>
          );
        })}
      </div>

      {state?.error && (
        <div className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {state.error}
        </div>
      )}
    </div>
  );
}