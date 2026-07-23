import Link from "next/link";
import { ArrowLeft, CreditCard } from "lucide-react";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";

interface CheckoutPageProps {
  searchParams: Promise<{ plan?: string }>;
}

const PLAN_LABELS: Record<string, { name: string; price: string }> = {
  FREE: { name: "Free", price: "Grátis" },
  PRO: { name: "Pro", price: "R$ 97/mês" },
  ULTRA: { name: "Ultra", price: "R$ 157/mês" },
};

export default async function CheckoutPage({
  searchParams,
}: CheckoutPageProps) {
  const session = await getSession();
  if (!session?.email || !session.tenantId) {
    redirect("/admin/login");
  }

  const params = await searchParams;
  const planId = params.plan || "PRO";
  const plan = PLAN_LABELS[planId] || PLAN_LABELS.PRO;

  return (
    <div className="mx-auto max-w-lg">
      <div className="mb-8">
        <Link
          href="/admin/settings"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors duration-150"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para Configurações
        </Link>
      </div>

      <div className="rounded-xl border border-border bg-card p-8 shadow-sm text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 mb-6">
          <CreditCard className="h-8 w-8 text-primary" />
        </div>

        <h1 className="text-2xl font-bold tracking-tight text-card-foreground mb-2">
          {plan.name}
        </h1>
        <p className="text-4xl font-bold text-card-foreground mb-2">
          {plan.price}
        </p>
        <p className="text-sm text-muted-foreground mb-8">
          Você selecionou o plano <strong>{plan.name}</strong>. Complete o
          checkout para ativar.
        </p>

        <div className="rounded-lg border border-dashed border-border bg-muted/30 px-6 py-8 mb-6">
          <p className="text-sm text-muted-foreground">
            Integração com pagamentos em breve.
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            O Asaas Pay será integrado futuramente para gerenciar assinaturas e
            cobranças.
          </p>
        </div>

        <Link
          href="/admin/settings"
          className="inline-flex items-center justify-center rounded-lg border border-border bg-background px-6 py-2.5 text-sm font-semibold text-card-foreground transition-all duration-150 hover:bg-accent hover:text-accent-foreground active:scale-[0.97]"
        >
          Voltar para Configurações
        </Link>
      </div>
    </div>
  );
}