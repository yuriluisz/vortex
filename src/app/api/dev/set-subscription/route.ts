import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Rota de desenvolvimento para simular alterações no status de assinatura
 * sem precisar chamar a API do Asaas.
 *
 * Uso: POST /api/dev/set-subscription
 * Body: { tenantSlug: string, subscriptionStatus: "TRIAL"|"ACTIVE"|"PAST_DUE"|"CANCELED", plan?: "FREE"|"PRO"|"ULTRA" }
 *
 * Só funciona em NODE_ENV=development.
 */
export async function POST(req: Request) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not available in production" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { tenantSlug, subscriptionStatus, plan } = body;

    if (!tenantSlug || !subscriptionStatus) {
      return NextResponse.json(
        { error: "tenantSlug e subscriptionStatus são obrigatórios." },
        { status: 400 }
      );
    }

    const validStatuses = ["TRIAL", "ACTIVE", "PAST_DUE", "CANCELED"];
    if (!validStatuses.includes(subscriptionStatus)) {
      return NextResponse.json(
        { error: `subscriptionStatus deve ser um de: ${validStatuses.join(", ")}` },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = { subscriptionStatus };

    if (plan) {
      const validPlans = ["FREE", "PRO", "ULTRA"];
      if (!validPlans.includes(plan)) {
        return NextResponse.json(
          { error: `plan deve ser um de: ${validPlans.join(", ")}` },
          { status: 400 }
        );
      }
      updateData.plan = plan;
    }

    // Se for ACTIVE, seta currentPeriodEnd para 30 dias
    if (subscriptionStatus === "ACTIVE") {
      const currentPeriodEnd = new Date();
      currentPeriodEnd.setDate(currentPeriodEnd.getDate() + 30);
      updateData.currentPeriodEnd = currentPeriodEnd;
    }

    const tenant = await prisma.tenant.update({
      where: { slug: tenantSlug },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      tenant: {
        slug: tenant.slug,
        plan: tenant.plan,
        subscriptionStatus: tenant.subscriptionStatus,
        currentPeriodEnd: tenant.currentPeriodEnd,
      },
    });
  } catch (error) {
    console.error("[Dev API Error]", error);
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}