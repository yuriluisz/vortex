import { prisma } from "../lib/prisma";

async function main() {
  console.log("🧹 Iniciando limpeza dos dados de faturamento (Asaas) dos Tenants...");

  const result = await prisma.tenant.updateMany({
    data: {
      plan: "FREE",
      subscriptionStatus: "TRIAL",
      asaasCustomerId: null,
      asaasSubscriptionId: null,
      cancelAt: null,
      gracePeriodEnd: null,
      pendingPlan: null,
      currentPeriodEnd: null,
      downgradeReason: null,
      lastPaymentId: null,
      maxCampaigns: 1,
      maxGroups: 3,
      maxLeads: 100,
    },
  });

  console.log(`✅ Sucesso! ${result.count} contas (Tenants) foram resetadas para o plano FREE e desvinculadas do Asaas.`);
}

main()
  .catch((e) => {
    console.error("❌ Erro ao resetar faturamento:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
