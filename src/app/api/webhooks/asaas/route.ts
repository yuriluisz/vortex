import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const token = req.headers.get("asaas-access-token");
    const webhookSecret = process.env.ASAAS_WEBHOOK_SECRET;

    if (webhookSecret && token !== webhookSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await req.json();
    const event = payload.event;
    const payment = payload.payment;

    if (!payment?.customer) {
      return NextResponse.json({ error: "Missing customer data" }, { status: 400 });
    }

    const tenant = await prisma.tenant.findFirst({
      where: { asaasCustomerId: payment.customer }
    });

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found for customer" }, { status: 404 });
    }

    if (event === "PAYMENT_RECEIVED" || event === "PAYMENT_CONFIRMED") {
      // Pagamento confirmado!
      const currentPeriodEnd = new Date();
      currentPeriodEnd.setDate(currentPeriodEnd.getDate() + 30); // Estende o prazo em 30 dias (ciclo mensal)
      
      await prisma.tenant.update({
        where: { id: tenant.id },
        data: {
          subscriptionStatus: "ACTIVE",
          currentPeriodEnd,
        }
      });
      console.log(`[Asaas Webhook] Pagamento recebido para o tenant ${tenant.slug}`);
    } 
    else if (event === "PAYMENT_OVERDUE") {
      // Inadimplência
      await prisma.tenant.update({
        where: { id: tenant.id },
        data: {
          subscriptionStatus: "PAST_DUE",
        }
      });
      console.log(`[Asaas Webhook] Pagamento atrasado para o tenant ${tenant.slug}`);
    }
    else if (event === "PAYMENT_DELETED" || event === "PAYMENT_REFUNDED") {
      // Cancelado ou estornado
      await prisma.tenant.update({
        where: { id: tenant.id },
        data: {
          subscriptionStatus: "CANCELED",
        }
      });
      console.log(`[Asaas Webhook] Pagamento estornado/deletado para o tenant ${tenant.slug}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[Asaas Webhook Error]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
