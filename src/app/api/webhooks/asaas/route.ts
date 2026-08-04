import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PLAN_LIMITS } from "@/lib/plans";
import type { Plan } from "@/lib/prisma-types";

// Grace period: 5 dias
const GRACE_PERIOD_DAYS = 5;

/**
 * GET — Health-check / validação do webhook pelo ASAAS.
 */
export async function GET() {
  console.log("[Asaas Webhook] GET health-check recebido");
  return NextResponse.json({ status: "ok", message: "Webhook do Asaas está ativo." });
}

/**
 * POST — Processa eventos de pagamento/assinatura do ASAAS.
 * 
 * ESTE É O PONTO DE VERDADE para ativação de planos.
 * A action de checkout NÃO muda o plano — o webhook é quem confirma.
 */
export async function POST(req: Request) {
  try {
    // ================================================================
    // LOG de requisição recebida
    // ================================================================
    console.log("[Asaas Webhook] POST recebido");

    // ================================================================
    // AUTENTICAÇÃO via asaas-access-token
    // O ASAAS envia o authToken definido na configuração do webhook
    // ================================================================
    const webhookSecret = (process.env.ASAAS_WEBHOOK_SECRET || "").trim();
    const receivedToken = (req.headers.get("asaas-access-token") || "").trim();

    if (!webhookSecret) {
      console.error("[Asaas Webhook] ❌ ASAAS_WEBHOOK_SECRET não configurado!");
      return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
    }

    if (!receivedToken || receivedToken !== webhookSecret) {
      console.warn("[Asaas Webhook] ❌ Token inválido — rejeitando");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ================================================================
    // PARSE DO PAYLOAD
    // ================================================================
    const rawBody = await req.text();

    let payload: any;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      console.error("[Asaas Webhook] ❌ JSON inválido");
      return NextResponse.json({ received: true });
    }



    const event: string = payload.event;
    console.log(`[Asaas Webhook] Evento: ${event}`);

    // ================================================================
    // EXTRAIR DADOS
    // ================================================================
    let customerId: string | null = null;
    let paymentId: string | null = null;
    let subscriptionId: string | null = null;

    // Eventos de pagamento
    if (payload.payment) {
      customerId = payload.payment.customer;
      paymentId = payload.payment.id;
      subscriptionId = payload.payment.subscription || null;
    }

    // Eventos de assinatura
    if (payload.subscription) {
      customerId = payload.subscription.customer;
      subscriptionId = payload.subscription.id;
    }

    if (!customerId) {
      console.warn(`[Asaas Webhook] ⚠️ Sem customer — evento ignorado: ${event}`);
      return NextResponse.json({ received: true });
    }

    console.log(`[Asaas Webhook] customer=${customerId}, payment=${paymentId}, subscription=${subscriptionId}`);

    // ================================================================
    // BUSCAR TENANT
    // ================================================================
    const tenant = await prisma.tenant.findFirst({
      where: { asaasCustomerId: customerId },
    });

    if (!tenant) {
      console.warn(`[Asaas Webhook] ⚠️ Tenant não encontrado para customer: ${customerId}`);
      return NextResponse.json({ received: true });
    }

    console.log(`[Asaas Webhook] ✅ Tenant: ${tenant.slug} (${tenant.id})`);

    // ================================================================
    // IDEMPOTÊNCIA: Verificar se já processamos este payment
    // ================================================================
    if (paymentId && tenant.lastPaymentId === paymentId) {
      console.log(`[Asaas Webhook] ⏭️ Payment já processado (idempotência): ${paymentId}`);
      return NextResponse.json({ received: true });
    }

    // ================================================================
    // PROCESSAR EVENTOS
    // ================================================================

    // ----- PAGAMENTO CONFIRMADO (ATIVAR PLANO) -----
    if (event === "PAYMENT_RECEIVED" || event === "PAYMENT_CONFIRMED") {
      console.log(`[Asaas Webhook] 💰 ${event} para ${tenant.slug}`);

      // Determinar qual plano ativar
      const planToActivate = tenant.pendingPlan || tenant.plan;
      const planLimits = PLAN_LIMITS[planToActivate as Plan];

      const updateData: Record<string, any> = {
        plan: planToActivate,
        subscriptionStatus: "ACTIVE",
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // +30 dias
        pendingPlan: null, // Limpar plano pendente
        cancelAt: null, // Limpar cancelamento agendado
        gracePeriodEnd: null, // Limpar grace period
        lastPaymentId: paymentId,
      };

      // Atualizar limites de acordo com o plano
      if (planLimits) {
        updateData.maxCampaigns = planLimits.maxCampaigns;
        updateData.maxGroups = planLimits.maxGroups;
        updateData.maxLeads = planLimits.maxLeads;
      }

      // Atualizar subscriptionId se veio no payment
      if (subscriptionId) {
        updateData.asaasSubscriptionId = subscriptionId;
      }

      await prisma.tenant.update({
        where: { id: tenant.id },
        data: updateData,
      });

      console.log(`[Asaas Webhook] ✅ ${tenant.slug} → plan=${planToActivate}, status=ACTIVE, periodEnd=${updateData.currentPeriodEnd}`);
    }

    // ----- PAGAMENTO VENCIDO (INICIAR GRACE PERIOD) -----
    else if (event === "PAYMENT_OVERDUE") {
      console.log(`[Asaas Webhook] ⚠️ PAYMENT_OVERDUE para ${tenant.slug}`);

      const gracePeriodEnd = new Date(Date.now() + GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000);

      await prisma.tenant.update({
        where: { id: tenant.id },
        data: {
          subscriptionStatus: "PAST_DUE",
          gracePeriodEnd,
          lastPaymentId: paymentId,
        },
      });

      console.log(`[Asaas Webhook] ⚠️ ${tenant.slug} → PAST_DUE, grace period até ${gracePeriodEnd.toISOString()}`);
    }

    // ----- PAGAMENTO CANCELADO/ESTORNADO -----
    else if (event === "PAYMENT_DELETED" || event === "PAYMENT_REFUNDED" || event === "PAYMENT_CANCELED") {
      console.log(`[Asaas Webhook] ❌ ${event} para ${tenant.slug}`);

      // Não rebaixar imediatamente se ainda dentro do período pago
      if (tenant.currentPeriodEnd && new Date() < tenant.currentPeriodEnd) {
        // Ainda dentro do ciclo pago — agendar cancelamento no fim do período
        await prisma.tenant.update({
          where: { id: tenant.id },
          data: {
            subscriptionStatus: "CANCELING",
            cancelAt: tenant.currentPeriodEnd,
            lastPaymentId: paymentId,
          },
        });
        console.log(`[Asaas Webhook] ⚠️ ${tenant.slug} → CANCELING (mantém acesso até ${tenant.currentPeriodEnd.toISOString()})`);
      } else {
        // Sem período pago ativo — rebaixar para FREE
        const freeLimits = PLAN_LIMITS["FREE"];
        await prisma.tenant.update({
          where: { id: tenant.id },
          data: {
            plan: "FREE",
            subscriptionStatus: "CANCELED",
            pendingPlan: null,
            cancelAt: null,
            gracePeriodEnd: null,
            currentPeriodEnd: null,
            lastPaymentId: paymentId,
            maxCampaigns: freeLimits.maxCampaigns,
            maxGroups: freeLimits.maxGroups,
            maxLeads: freeLimits.maxLeads,
          },
        });
        console.log(`[Asaas Webhook] ❌ ${tenant.slug} → FREE, CANCELED`);
      }
    }

    // ----- ASSINATURA CANCELADA -----
    else if (event === "SUBSCRIPTION_CANCELED") {
      console.log(`[Asaas Webhook] ❌ SUBSCRIPTION_CANCELED para ${tenant.slug}`);

      if (tenant.currentPeriodEnd && new Date() < tenant.currentPeriodEnd) {
        await prisma.tenant.update({
          where: { id: tenant.id },
          data: {
            subscriptionStatus: "CANCELING",
            cancelAt: tenant.currentPeriodEnd,
          },
        });
        console.log(`[Asaas Webhook] ⚠️ ${tenant.slug} → CANCELING até ${tenant.currentPeriodEnd.toISOString()}`);
      } else {
        const freeLimits = PLAN_LIMITS["FREE"];
        await prisma.tenant.update({
          where: { id: tenant.id },
          data: {
            plan: "FREE",
            subscriptionStatus: "CANCELED",
            asaasSubscriptionId: null,
            pendingPlan: null,
            cancelAt: null,
            gracePeriodEnd: null,
            currentPeriodEnd: null,
            maxCampaigns: freeLimits.maxCampaigns,
            maxGroups: freeLimits.maxGroups,
            maxLeads: freeLimits.maxLeads,
          },
        });
        console.log(`[Asaas Webhook] ❌ ${tenant.slug} → FREE, CANCELED`);
      }
    }

    // ----- PAGAMENTO RESTAURADO -----
    else if (event === "PAYMENT_RESTORED") {
      console.log(`[Asaas Webhook] 🔄 PAYMENT_RESTORED para ${tenant.slug}`);

      await prisma.tenant.update({
        where: { id: tenant.id },
        data: {
          subscriptionStatus: "ACTIVE",
          gracePeriodEnd: null,
          cancelAt: null,
          lastPaymentId: paymentId,
        },
      });

      console.log(`[Asaas Webhook] ✅ ${tenant.slug} → ACTIVE (restaurado)`);
    }

    // ----- SUBSCRIPTION ATUALIZADA (info) -----
    else if (event === "SUBSCRIPTION_UPDATED") {
      console.log(`[Asaas Webhook] 🔄 SUBSCRIPTION_UPDATED para ${tenant.slug} (info only)`);
    }

    // ----- EVENTO NÃO MAPEADO -----
    else {
      console.log(`[Asaas Webhook] ℹ️ Evento não mapeado: ${event}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[Asaas Webhook] ❌ ERRO:", error);
    if (error instanceof Error) {
      console.error("[Asaas Webhook] Stack:", error.stack);
    }
    // Retornar 200 para evitar que o ASAAS reenvie indefinidamente
    return NextResponse.json({ received: true, error: "Internal error logged" });
  }
}