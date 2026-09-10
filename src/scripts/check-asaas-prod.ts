import "dotenv/config";

const ASAAS_API_URL = process.env.ASAAS_API_URL || "https://api.asaas.com/v3";
const ASAAS_API_KEY = process.env.ASAAS_API_KEY || "";
const ASAAS_WEBHOOK_SECRET = process.env.ASAAS_WEBHOOK_SECRET || "";

async function checkAsaasProd() {
  console.log("=== VERIFICAÇÃO ASAAS EM PRODUÇÃO ===");
  console.log("URL:", ASAAS_API_URL);
  console.log("API Key configurada:", ASAAS_API_KEY ? `Sim (termina em ...${ASAAS_API_KEY.slice(-6)})` : "Não");
  console.log("Webhook Secret configurado:", ASAAS_WEBHOOK_SECRET ? "Sim" : "Não");

  if (!ASAAS_API_KEY) {
    console.error("❌ ASAAS_API_KEY não encontrada no .env");
    process.exit(1);
  }

  let cleanKey = ASAAS_API_KEY.trim();
  if (cleanKey.startsWith("\\$")) {
    console.log("⚠️ Detectada barra invertida ('\\') escapando o '$' no início da chave! Removendo...");
    cleanKey = cleanKey.slice(1);
  }

  const headers = {
    "Content-Type": "application/json",
    "access_token": cleanKey,
  };

  // 1. Testar autenticação na URL configurada (Produção)
  console.log(`\n1. Testando autenticação na URL configurada (${ASAAS_API_URL}/webhooks)...`);
  try {
    const res = await fetch(`${ASAAS_API_URL}/webhooks`, { headers });
    console.log(`Status HTTP: ${res.status} ${res.statusText}`);
    const data = await res.json();
    if (res.ok) {
      console.log("✅ Autenticação em Produção bem-sucedida!");
    } else {
      console.error("❌ Resposta:", data);
    }
  } catch (err: any) {
    console.error("❌ Erro:", err.message);
  }

  // 1b. Testar se por acaso a chave pertence ao ambiente de Sandbox
  console.log("\n1b. Testando a mesma chave no Sandbox (https://sandbox.asaas.com/api/v3/webhooks)...");
  try {
    const res = await fetch("https://sandbox.asaas.com/api/v3/webhooks", { headers });
    console.log(`Status HTTP no Sandbox: ${res.status} ${res.statusText}`);
    const data = await res.json();
    if (res.ok) {
      console.log("⚠️ ATENÇÃO: A chave configurada no .env é válida no SANDBOX, mas a ASAAS_API_URL está apontando para PRODUÇÃO!");
    } else {
      console.log("❌ Chave também rejeitada no Sandbox:", data?.errors?.[0]?.description || res.statusText);
    }
  } catch (err: any) {
    console.error("❌ Erro:", err.message);
  }

  // 2. Testar busca de clientes existentes (read-only)
  console.log("\n2. Testando consulta read-only de clientes (/customers?limit=1)...");
  try {
    const res = await fetch(`${ASAAS_API_URL}/customers?limit=1`, { headers });
    console.log(`Status HTTP: ${res.status} ${res.statusText}`);
    const data = await res.json();
    if (res.ok) {
      console.log("✅ Consulta de clientes OK! Total de registros disponíveis no Asaas:", data.totalCount ?? data.data?.length ?? 0);
    } else {
      console.error("❌ Erro ao consultar clientes:", data);
    }
  } catch (err: any) {
    console.error("❌ Erro de conexão:", err.message);
  }

  // 3. Testar consulta de saldo/conta (/finance/balance)
  console.log("\n3. Testando consulta de conta/saldo (/finance/balance)...");
  try {
    const res = await fetch(`${ASAAS_API_URL}/finance/balance`, { headers });
    console.log(`Status HTTP: ${res.status} ${res.statusText}`);
    const data = await res.json();
    if (res.ok) {
      console.log("✅ Conexão financeira OK! Saldo disponível recuperado com sucesso.");
    } else {
      console.log("ℹ️ Endpoint de saldo retornou:", data?.errors?.[0]?.description || res.statusText);
    }
  } catch (err: any) {
    console.error("❌ Erro:", err.message);
  }

  // 4. Testar endpoint local do webhook (/api/webhooks/asaas health-check)
  console.log("\n4. Testando health-check do webhook local (http://localhost:3000/api/webhooks/asaas)...");
  try {
    const res = await fetch("http://localhost:3000/api/webhooks/asaas");
    console.log(`Status HTTP: ${res.status}`);
    const data = await res.json();
    console.log("Resposta:", data);
    if (res.ok && data.status === "ok") {
      console.log("✅ Webhook health check respondeu com sucesso!");
    } else {
      console.warn("⚠️ Resposta inesperada do webhook local.");
    }
  } catch (err: any) {
    console.warn("⚠️ Servidor local pode não estar respondendo em http://localhost:3000:", err.message);
  }
}

checkAsaasProd();
