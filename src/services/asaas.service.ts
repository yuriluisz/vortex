import { env } from "process";

const ASAAS_API_URL = process.env.ASAAS_API_URL || "https://sandbox.asaas.com/api/v3";
const ASAAS_API_KEY = process.env.ASAAS_API_KEY || "";

const HEADERS = {
  "Content-Type": "application/json",
  "access_token": ASAAS_API_KEY,
};

// Planos fixos para exemplo (você pode mover isso para o banco de dados depois)
export const PLAN_PRICES = {
  FREE: 0,
  PRO: 97.00,
  ULTRA: 197.00,
};

/**
 * Utilitário para fazer requisições à API do Asaas
 */
async function asaasFetch(endpoint: string, options: RequestInit = {}) {
  const url = `${ASAAS_API_URL}${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      ...HEADERS,
      ...options.headers,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    console.error(`[Asaas API Error] ${options.method || 'GET'} ${endpoint}:`, data);
    throw new Error(data.errors?.[0]?.description || "Erro na integração com Asaas");
  }

  return data;
}

/**
 * Cria um cliente no Asaas.
 * Mesmo sem CPF/CNPJ, o Asaas permite criar e exige que o cliente preencha ao abrir o link de pagamento.
 */
export async function createCustomer(name: string, email: string) {
  const data = await asaasFetch("/customers", {
    method: "POST",
    body: JSON.stringify({
      name,
      email,
      // cpfCnpj: "..." // Omitido intencionalmente para preenchimento no checkout do Asaas
    }),
  });
  return data; // { id: 'cus_...', ... }
}

/**
 * Cria uma assinatura (recorrência mensal) para um cliente.
 */
export async function createSubscription(customerId: string, plan: keyof typeof PLAN_PRICES) {
  const value = PLAN_PRICES[plan];
  
  if (value <= 0) {
    throw new Error("Não é possível criar assinatura para plano gratuito.");
  }

  // Data de vencimento = hoje (para cobrar imediatamente)
  const nextDueDate = new Date().toISOString().split("T")[0];

  const data = await asaasFetch("/subscriptions", {
    method: "POST",
    body: JSON.stringify({
      customer: customerId,
      billingType: "UNDEFINED", // Permite o usuário escolher entre PIX, Cartão ou Boleto no link
      value: value,
      nextDueDate,
      cycle: "MONTHLY",
      description: `Assinatura Plano ${plan} - Vórtex+`,
    }),
  });

  // O Asaas retorna o ID da assinatura. Precisamos pegar o link da fatura gerada.
  // Muitas vezes a URL de pagamento vem em `invoiceUrl` da primeira cobrança ou podemos buscar os payments da subscription.
  
  // Vamos buscar a cobrança recém gerada por essa assinatura para pegar o link
  const paymentsResponse = await asaasFetch(`/payments?subscription=${data.id}`);
  const firstPayment = paymentsResponse.data[0];

  return {
    subscriptionId: data.id,
    invoiceUrl: firstPayment?.invoiceUrl || null,
  };
}

/**
 * Recupera uma assinatura do Asaas
 */
export async function getSubscription(subscriptionId: string) {
  return asaasFetch(`/subscriptions/${subscriptionId}`);
}

/**
 * Faz o upgrade/downgrade de uma assinatura com Prorate.
 * 
 * Lógica:
 * 1. Pega os detalhes do plano antigo.
 * 2. Calcula dias restantes até o `currentPeriodEnd`.
 * 3. Calcula o crédito não utilizado e subtrai do valor do novo plano.
 * 4. Gera uma cobrança avulsa com o valor da diferença.
 * 5. Atualiza o valor da assinatura base para os próximos meses.
 */
export async function upgradeSubscription(
  customerId: string, 
  subscriptionId: string, 
  currentPeriodEnd: Date, 
  oldPlan: keyof typeof PLAN_PRICES,
  newPlan: keyof typeof PLAN_PRICES
) {
  const oldPrice = PLAN_PRICES[oldPlan];
  const newPrice = PLAN_PRICES[newPlan];

  if (newPrice <= oldPrice) {
    throw new Error("Downgrades devem ser tratados de outra forma ou apenar aguardar o fim do ciclo.");
  }

  const today = new Date();
  const diffTime = currentPeriodEnd.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  // Se já venceu, não tem prorate, só cobra o valor novo
  let proratedDifference = newPrice;
  
  if (diffDays > 0 && diffDays <= 31) {
    const dailyOldPrice = oldPrice / 30;
    const dailyNewPrice = newPrice / 30;
    const remainingOldValue = diffDays * dailyOldPrice;
    const remainingNewValue = diffDays * dailyNewPrice;
    
    proratedDifference = remainingNewValue - remainingOldValue;
  }

  // 1. Atualiza a assinatura original para cobrar o novo valor apenas no próximo mês
  await asaasFetch(`/subscriptions/${subscriptionId}`, {
    method: "POST", // A API do Asaas usa POST para update
    body: JSON.stringify({
      value: newPrice,
      updatePendingPayments: false, // Não altera as faturas já geradas/vencidas
    }),
  });

  // 2. Se tiver diferença a pagar, gera uma cobrança avulsa para hoje
  if (proratedDifference > 1) { // Só cobra se a diferença for maior que 1 real para evitar erros
    const nextDueDate = today.toISOString().split("T")[0];
    const payment = await asaasFetch("/payments", {
      method: "POST",
      body: JSON.stringify({
        customer: customerId,
        billingType: "UNDEFINED",
        value: Number(proratedDifference.toFixed(2)),
        dueDate: nextDueDate,
        description: `Upgrade de Plano (Prorate de ${diffDays} dias)`,
      }),
    });

    return {
      success: true,
      invoiceUrl: payment.invoiceUrl, // Manda o cliente pagar a diferença
      proratedAmount: proratedDifference
    };
  }

  return {
    success: true,
    invoiceUrl: null, // Não precisa pagar nada agora
    proratedAmount: 0
  };
}
