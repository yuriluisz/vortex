"use server";

import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { createCustomer, createSubscription, upgradeSubscription, PLAN_PRICES } from "@/services/asaas.service";
import type { Plan } from "@prisma/client";

export async function processCheckoutAction(planId: string) {
  const session = await getSession();
  if (!session?.email || !session.tenantId) {
    throw new Error("Não autorizado");
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: session.tenantId },
    include: { users: true }
  });

  if (!tenant) throw new Error("Tenant não encontrado");

  let asaasCustomerId = tenant.asaasCustomerId;

  // 1. Criar Customer no Asaas se não existir
  if (!asaasCustomerId) {
    // Pegar o primeiro user como admin para nome/email
    const adminUser = tenant.users.find(u => u.role === "SUPER_ADMIN" || u.role === "ADMIN") || tenant.users[0];
    const customer = await createCustomer(tenant.name, adminUser.email);
    asaasCustomerId = customer.id;
    await prisma.tenant.update({
      where: { id: tenant.id },
      data: { asaasCustomerId }
    });
  }

  if (!asaasCustomerId) throw new Error("Falha ao criar/identificar cliente no Asaas");

  let invoiceUrl: string | null = null;

  // 2. Verificar se já existe uma assinatura ativa (Upgrade/Downgrade)
  if (tenant.asaasSubscriptionId && tenant.currentPeriodEnd) {
    const result = await upgradeSubscription(
      asaasCustomerId,
      tenant.asaasSubscriptionId,
      tenant.currentPeriodEnd,
      tenant.plan as keyof typeof PLAN_PRICES,
      planId as keyof typeof PLAN_PRICES
    );
    
    // Atualiza o plano no nosso banco logo em seguida para refletir o upgrade
    await prisma.tenant.update({
      where: { id: tenant.id },
      data: { plan: planId as Plan }
    });

    if (result.invoiceUrl) {
      invoiceUrl = result.invoiceUrl;
    } else {
      // Se não gerou cobrança de diferença, volta para painel
      redirect("/admin/settings");
    }
  } else {
    // 3. Criar nova assinatura
    const subResult = await createSubscription(asaasCustomerId, planId as keyof typeof PLAN_PRICES);
    
    await prisma.tenant.update({
      where: { id: tenant.id },
      data: { 
        asaasSubscriptionId: subResult.subscriptionId,
        plan: planId as Plan
      }
    });

    invoiceUrl = subResult.invoiceUrl;
  }

  // 4. Redirecionar para o Checkout do Asaas
  if (invoiceUrl) {
    redirect(invoiceUrl);
  } else {
    redirect("/admin/settings");
  }
}
