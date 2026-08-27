const ASAAS_API_URL = process.env.ASAAS_API_URL || "https://sandbox.asaas.com/api/v3";
const ASAAS_API_KEY = process.env.ASAAS_API_KEY || "";

const HEADERS = {
  "Content-Type": "application/json",
  "access_token": ASAAS_API_KEY,
};

// Planos fixos
export const PLAN_PRICES: Record<string, number> = {
  FREE: 0,
  PRO: 97.00,
  ULTRA: 157.00,
};

// ============================================================================
// LOGGING
// ============================================================================

function logAsaas(level: "info" | "warn" | "error", message: string, data?: unknown) {
  const prefix = `[Asaas Service]`;

  if (level === "error") {
    console.error(`${prefix} ❌ ${message}`, data ? JSON.stringify(data, null, 2) : "");
  } else if (level === "warn") {
    console.warn(`${prefix} ⚠️ ${message}`, data ? JSON.stringify(data, null, 2) : "");
  } else {
    console.log(`${prefix} ℹ️ ${message}`, data ? JSON.stringify(data, null, 2) : "");
  }
}

// ============================================================================
// CORE: Validação e Fetch
// ============================================================================

function validateConfig(): void {
  if (!ASAAS_API_KEY) {
    throw new Error("ASAAS_API_KEY não configurada. Verifique o arquivo .env");
  }
  if (!ASAAS_API_URL) {
    throw new Error("ASAAS_API_URL não configurada. Verifique o arquivo .env");
  }
}

async function asaasFetch<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  validateConfig();

  const url = `${ASAAS_API_URL}${endpoint}`;
  const method = options.method || "GET";

  logAsaas("info", `Requisição: ${method} ${url}`, {
    bodyPreview: options.body ? JSON.stringify(JSON.parse(options.body as string), null, 2) : null,
  });

  const response = await fetch(url, {
    ...options,
    headers: {
      ...HEADERS,
      ...options.headers,
    },
  });

  let data: any;
  try {
    data = await response.json();
  } catch {
    logAsaas("error", `Resposta não-JSON da API (status ${response.status})`);
    throw new Error(`Resposta inválida da API ASAAS (status ${response.status})`);
  }

  if (!response.ok) {
    logAsaas("error", `Erro na API ASAAS: ${method} ${endpoint}`, {
      status: response.status,
      statusText: response.statusText,
      errors: data?.errors,
    });

    const errorMessages = data?.errors?.map((e: { description?: string }) => e.description).filter(Boolean).join(" | ") || "";
    throw new Error(
      errorMessages
        ? `ASAAS: ${errorMessages}`
        : `Erro na API ASAAS (status ${response.status})`
    );
  }

  logAsaas("info", `Resposta OK: ${method} ${endpoint}`, {
    status: response.status,
    responseKeys: data ? Object.keys(data) : [],
  });

  return data as T;
}

// ============================================================================
// CUSTOMERS
// ============================================================================

/**
 * Cria um cliente no Asaas.
 * Aceita CPF/CNPJ, phone e endereço.
 */
export async function createCustomer(
  name: string,
  email: string,
  billingData?: {
    cpfCnpj?: string;
    personType?: string;
    phone?: string;
    address?: {
      street?: string;
      number?: string;
      complement?: string;
      neighborhood?: string;
      city?: string;
      state?: string;
      zipCode?: string;
    };
  }
) {
  logAsaas("info", "Criando customer", { name, email, hasBillingData: !!billingData });

  const body: Record<string, unknown> = { name, email };

  if (billingData?.cpfCnpj) {
    body.cpfCnpj = billingData.cpfCnpj;
    body.personType = billingData.personType === "JURIDICA" ? "JURIDICA" : "FISICA";
  }

  if (billingData?.phone) {
    body.phone = billingData.phone;
    body.mobilePhone = billingData.phone;
  }

  if (billingData?.address) {
    if (billingData.address.street) body.address = billingData.address.street;
    if (billingData.address.number) body.addressNumber = billingData.address.number;
    if (billingData.address.complement) body.complement = billingData.address.complement;
    if (billingData.address.neighborhood) body.province = billingData.address.neighborhood;
    if (billingData.address.city) body.city = billingData.address.city;
    if (billingData.address.state) body.state = billingData.address.state;
    if (billingData.address.zipCode) body.postalCode = billingData.address.zipCode;
  }

  const data = await asaasFetch("/customers", {
    method: "POST",
    body: JSON.stringify(body),
  });

  logAsaas("info", "Customer criado com sucesso", { id: data.id, name: data.name });
  return data;
}

/**
 * Atualiza os dados de um cliente existente no Asaas.
 */
export async function updateCustomer(
  customerId: string,
  billingData: {
    cpfCnpj: string;
    personType: string;
    phone: string;
    address?: {
      street?: string;
      number?: string;
      complement?: string;
      neighborhood?: string;
      city?: string;
      state?: string;
      zipCode?: string;
    };
  }
) {
  logAsaas("info", "Atualizando customer", { customerId });

  const body: Record<string, unknown> = {
    cpfCnpj: billingData.cpfCnpj,
    personType: billingData.personType === "JURIDICA" ? "JURIDICA" : "FISICA",
  };

  if (billingData.phone) {
    body.phone = billingData.phone;
    body.mobilePhone = billingData.phone;
  }

  if (billingData.address) {
    if (billingData.address.street) body.address = billingData.address.street;
    if (billingData.address.number) body.addressNumber = billingData.address.number;
    if (billingData.address.complement) body.complement = billingData.address.complement;
    if (billingData.address.neighborhood) body.province = billingData.address.neighborhood;
    if (billingData.address.city) body.city = billingData.address.city;
    if (billingData.address.state) body.state = billingData.address.state;
    if (billingData.address.zipCode) body.postalCode = billingData.address.zipCode;
  }

  const data = await asaasFetch(`/customers/${customerId}`, {
    method: "POST",
    body: JSON.stringify(body),
  });

  logAsaas("info", "Customer atualizado com sucesso", { id: data.id, cpfCnpj: data.cpfCnpj });
  return data;
}

// ============================================================================
// SUBSCRIPTIONS
// ============================================================================

/**
 * Cria uma assinatura (recorrência mensal) para um cliente.
 * Retorna o subscriptionId e a invoiceUrl do primeiro pagamento.
 */
export async function createSubscription(customerId: string, plan: string) {
  const value = PLAN_PRICES[plan];

  if (!value || value <= 0) {
    throw new Error("Não é possível criar assinatura para plano gratuito.");
  }

  logAsaas("info", `Criando assinatura ${plan}`, { customerId, value });

  const nextDueDate = new Date().toISOString().split("T")[0];

  const rawAppUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const appUrl = rawAppUrl.endsWith('/') ? rawAppUrl.slice(0, -1) : rawAppUrl;

  const data = await asaasFetch("/subscriptions", {
    method: "POST",
    body: JSON.stringify({
      customer: customerId,
      billingType: "UNDEFINED", // Checkout ASAAS permite escolher
      value,
      nextDueDate,
      cycle: "MONTHLY",
      description: `Assinatura Plano ${plan} - Vórtex+`,
      maxPayments: null,
      callback: {
        successUrl: `${appUrl}/admin/settings/checkout?status=success`,
      },
    }),
  });

  logAsaas("info", "Assinatura criada", {
    subscriptionId: data.id,
    status: data.status,
  });

  // Buscar primeiro pagamento para pegar invoiceUrl
  let invoiceUrl: string | null = null;
  try {
    const paymentsResponse = await asaasFetch(`/payments?subscription=${data.id}`);
    const firstPayment = paymentsResponse.data?.[0];

    logAsaas("info", "Payments da subscription", {
      total: paymentsResponse.data?.length || 0,
      hasInvoiceUrl: !!firstPayment?.invoiceUrl,
      firstPaymentId: firstPayment?.id,
    });

    invoiceUrl = firstPayment?.invoiceUrl || null;
  } catch (error) {
    logAsaas("warn", "Não foi possível buscar o link de pagamento", { error: String(error) });
  }

  return {
    subscriptionId: data.id,
    invoiceUrl,
  };
}

/**
 * Recupera uma assinatura do Asaas.
 */
export async function getSubscription(subscriptionId: string) {
  logAsaas("info", `Buscando subscription: ${subscriptionId}`);
  return asaasFetch(`/subscriptions/${subscriptionId}`);
}

/**
 * Lista os pagamentos de uma assinatura.
 */
export async function getSubscriptionPayments(subscriptionId: string) {
  logAsaas("info", `Buscando payments da subscription: ${subscriptionId}`);
  return asaasFetch(`/payments?subscription=${subscriptionId}`);
}

/**
 * Busca detalhes de um pagamento específico.
 */
export async function getPaymentById(paymentId: string) {
  logAsaas("info", `Buscando payment: ${paymentId}`);
  return asaasFetch(`/payments/${paymentId}`);
}

/**
 * Atualiza o valor de uma assinatura para os próximos ciclos.
 * Não altera pagamentos já gerados.
 */
export async function updateSubscriptionValue(subscriptionId: string, newValue: number) {
  logAsaas("info", "Atualizando valor da subscription", { subscriptionId, newValue });

  const data = await asaasFetch(`/subscriptions/${subscriptionId}`, {
    method: "POST",
    body: JSON.stringify({
      value: newValue,
      updatePendingPayments: false,
    }),
  });

  logAsaas("info", "Subscription atualizada", { id: data.id, value: data.value });
  return data;
}

/**
 * Cria uma assinatura com data de vencimento personalizada (para reativação).
 * Usada quando o usuário reativa uma assinatura em cancelamento,
 * para não cobrar duas vezes no mesmo ciclo.
 */
export async function createSubscriptionWithDate(
  customerId: string,
  plan: string,
  nextDueDate: string
) {
  const value = PLAN_PRICES[plan];

  if (!value || value <= 0) {
    throw new Error("Não é possível criar assinatura para plano gratuito.");
  }

  logAsaas("info", `Criando assinatura ${plan} com data personalizada`, { customerId, value, nextDueDate });

  const rawAppUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const appUrl = rawAppUrl.endsWith('/') ? rawAppUrl.slice(0, -1) : rawAppUrl;

  const data = await asaasFetch("/subscriptions", {
    method: "POST",
    body: JSON.stringify({
      customer: customerId,
      billingType: "UNDEFINED",
      value,
      nextDueDate,
      cycle: "MONTHLY",
      description: `Assinatura Plano ${plan} - Vórtex+`,
      maxPayments: null,
      callback: {
        successUrl: `${appUrl}/admin/settings/checkout?status=success`,
      },
    }),
  });

  logAsaas("info", "Assinatura criada com data personalizada", {
    subscriptionId: data.id,
    status: data.status,
  });

  return {
    subscriptionId: data.id,
  };
}

/**
 * Cancela uma assinatura no Asaas.
 * A assinatura deixa de gerar novas cobranças.
 */
export async function cancelSubscription(subscriptionId: string) {
  logAsaas("info", `Cancelando subscription: ${subscriptionId}`);

  const data = await asaasFetch(`/subscriptions/${subscriptionId}`, {
    method: "DELETE",
  });

  logAsaas("info", "Subscription cancelada", { id: subscriptionId });
  return data;
}

// ============================================================================
// UPGRADE / DOWNGRADE
// ============================================================================

/**
 * Faz o upgrade de uma assinatura com prorate.
 *
 * 1. Calcula dias restantes até o currentPeriodEnd
 * 2. Calcula crédito do plano antigo vs custo do novo
 * 3. Gera cobrança avulsa com a diferença
 * 4. Atualiza o valor da assinatura para os próximos ciclos
 */
export async function upgradeSubscription(
  customerId: string,
  subscriptionId: string,
  currentPeriodEnd: Date,
  oldPlan: string,
  newPlan: string
) {
  const oldPrice = PLAN_PRICES[oldPlan] || 0;
  const newPrice = PLAN_PRICES[newPlan] || 0;

  logAsaas("info", "Iniciando upgrade de subscription", {
    customerId, subscriptionId, oldPlan, newPlan, oldPrice, newPrice,
    currentPeriodEnd: currentPeriodEnd.toISOString(),
  });

  if (newPrice <= oldPrice) {
    throw new Error("Use scheduleDowngrade() para downgrades.");
  }

  // Atualizar a assinatura para o novo valor
  await updateSubscriptionValue(subscriptionId, newPrice);

  // Calcular prorate
  const today = new Date();
  const diffTime = currentPeriodEnd.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  let proratedDifference = newPrice;

  if (diffDays > 0 && diffDays <= 31) {
    const dailyOldPrice = oldPrice / 30;
    const dailyNewPrice = newPrice / 30;
    const remainingOldValue = diffDays * dailyOldPrice;
    const remainingNewValue = diffDays * dailyNewPrice;
    proratedDifference = remainingNewValue - remainingOldValue;

    logAsaas("info", "Cálculo de prorate", {
      diffDays, dailyOldPrice, dailyNewPrice, proratedDifference,
    });
  }

  // Se a diferença é significativa, gerar cobrança avulsa
  if (proratedDifference > 1) {
    const dueDate = today.toISOString().split("T")[0];
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const payment = await asaasFetch("/payments", {
      method: "POST",
      body: JSON.stringify({
        customer: customerId,
        billingType: "UNDEFINED",
        value: Number(proratedDifference.toFixed(2)),
        dueDate,
        description: `Upgrade ${oldPlan} → ${newPlan} (prorate de ${diffDays} dias)`,
        callback: {
          successUrl: `${appUrl}/admin/settings/checkout?status=success`,
        },
      }),
    });

    logAsaas("info", "Cobrança avulsa de prorate gerada", {
      paymentId: payment.id,
      invoiceUrl: payment.invoiceUrl,
    });

    return {
      success: true,
      invoiceUrl: payment.invoiceUrl,
      proratedAmount: proratedDifference,
    };
  }

  logAsaas("info", "Upgrade concluído sem cobrança adicional");
  return {
    success: true,
    invoiceUrl: null,
    proratedAmount: 0,
  };
}

/**
 * Agenda um downgrade de plano.
 * Atualiza o valor da assinatura para o novo plano no próximo ciclo.
 * Não cancela a assinatura — apenas muda o valor futuro.
 * O plano efetivo será trocado via webhook no próximo ciclo.
 */
export async function scheduleDowngrade(subscriptionId: string, newPlan: string) {
  const newPrice = PLAN_PRICES[newPlan] || 0;

  if (newPrice <= 0) {
    throw new Error("Para downgrade para FREE, use cancelSubscription().");
  }

  logAsaas("info", "Agendando downgrade", { subscriptionId, newPlan, newPrice });

  await updateSubscriptionValue(subscriptionId, newPrice);

  logAsaas("info", "Downgrade agendado com sucesso");
  return { success: true };
}

// ============================================================================
// WEBHOOKS (Configuração)
// ============================================================================

/**
 * Lista webhooks configurados na conta ASAAS.
 */
export async function listWebhooks() {
  logAsaas("info", "Listando webhooks");
  return asaasFetch("/webhooks");
}

/**
 * Registra ou atualiza um webhook no ASAAS.
 */
export async function registerWebhook(url: string, authToken: string) {
  logAsaas("info", "Registrando webhook", { url });

  const data = await asaasFetch("/webhooks", {
    method: "POST",
    body: JSON.stringify({
      url,
      email: "admin@vortex.app",
      enabled: true,
      interrupted: false,
      apiVersion: 3,
      authToken,
    }),
  });

  logAsaas("info", "Webhook registrado", { id: data.id, url: data.url });
  return data;
}