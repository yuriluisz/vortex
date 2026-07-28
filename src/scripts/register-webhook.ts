/**
 * Script para registrar/atualizar o webhook do ASAAS.
 * 
 * Uso: npx tsx src/scripts/register-webhook.ts
 * 
 * O script:
 * 1. Lista webhooks existentes
 * 2. Se já existe um, atualiza a URL
 * 3. Se não existe, cria um novo
 * 
 * Requer as variáveis de ambiente:
 * - ASAAS_API_URL
 * - ASAAS_API_KEY
 * - ASAAS_WEBHOOK_SECRET
 * - NEXT_PUBLIC_APP_URL (URL do tunnel/domínio)
 */

import "dotenv/config";

const ASAAS_API_URL = process.env.ASAAS_API_URL || "https://sandbox.asaas.com/api/v3";
const ASAAS_API_KEY = process.env.ASAAS_API_KEY || "";
const WEBHOOK_SECRET = process.env.ASAAS_WEBHOOK_SECRET || "";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "";

if (!ASAAS_API_KEY) {
  console.error("❌ ASAAS_API_KEY não configurada no .env");
  process.exit(1);
}

if (!APP_URL) {
  console.error("❌ NEXT_PUBLIC_APP_URL não configurada no .env");
  console.error("   Configure com a URL do seu tunnel Cloudflare ou domínio de produção.");
  process.exit(1);
}

const WEBHOOK_URL = `${APP_URL}/api/webhooks/asaas`;
const HEADERS = {
  "Content-Type": "application/json",
  "access_token": ASAAS_API_KEY,
};

async function main() {
  console.log("🔗 Configurando webhook ASAAS...");
  console.log(`   API URL: ${ASAAS_API_URL}`);
  console.log(`   Webhook URL: ${WEBHOOK_URL}`);
  console.log(`   Auth Token: ${WEBHOOK_SECRET ? "✅ Configurado" : "⚠️ Não configurado"}`);
  console.log();

  // 1. Listar webhooks existentes
  console.log("📋 Buscando webhooks existentes...");
  const listResponse = await fetch(`${ASAAS_API_URL}/webhooks`, {
    headers: HEADERS,
  });

  if (!listResponse.ok) {
    const error = await listResponse.text();
    console.error(`❌ Erro ao listar webhooks: ${listResponse.status}`);
    console.error(error);
    process.exit(1);
  }

  const listData = await listResponse.json();
  const existingWebhooks = listData.data || [];

  console.log(`   Encontrados: ${existingWebhooks.length} webhook(s)`);

  if (existingWebhooks.length > 0) {
    for (const wh of existingWebhooks) {
      console.log(`   - ID: ${wh.id} | URL: ${wh.url} | Enabled: ${wh.enabled}`);
    }
  }

  // 2. Verificar se já existe webhook com a mesma URL base
  const existingWebhook = existingWebhooks.find((wh: any) =>
    wh.url.includes("/api/webhooks/asaas")
  );

  if (existingWebhook) {
    // Atualizar webhook existente
    console.log();
    console.log(`🔄 Atualizando webhook existente (${existingWebhook.id})...`);

    const updateBody: Record<string, any> = {
      url: WEBHOOK_URL,
      enabled: true,
      interrupted: false,
      apiVersion: 3,
    };

    if (WEBHOOK_SECRET) {
      updateBody.authToken = WEBHOOK_SECRET;
    }

    const updateResponse = await fetch(`${ASAAS_API_URL}/webhooks/${existingWebhook.id}`, {
      method: "POST",
      headers: HEADERS,
      body: JSON.stringify(updateBody),
    });

    if (!updateResponse.ok) {
      const error = await updateResponse.text();
      console.error(`❌ Erro ao atualizar webhook: ${updateResponse.status}`);
      console.error(error);
      process.exit(1);
    }

    const updatedWebhook = await updateResponse.json();
    console.log(`✅ Webhook atualizado com sucesso!`);
    console.log(`   ID: ${updatedWebhook.id}`);
    console.log(`   URL: ${updatedWebhook.url}`);
    console.log(`   Enabled: ${updatedWebhook.enabled}`);
  } else {
    // Criar novo webhook
    console.log();
    console.log("🆕 Criando novo webhook...");

    const createBody: Record<string, any> = {
      url: WEBHOOK_URL,
      email: "admin@vortex.app",
      enabled: true,
      interrupted: false,
      apiVersion: 3,
    };

    if (WEBHOOK_SECRET) {
      createBody.authToken = WEBHOOK_SECRET;
    }

    const createResponse = await fetch(`${ASAAS_API_URL}/webhooks`, {
      method: "POST",
      headers: HEADERS,
      body: JSON.stringify(createBody),
    });

    if (!createResponse.ok) {
      const error = await createResponse.text();
      console.error(`❌ Erro ao criar webhook: ${createResponse.status}`);
      console.error(error);
      process.exit(1);
    }

    const newWebhook = await createResponse.json();
    console.log(`✅ Webhook criado com sucesso!`);
    console.log(`   ID: ${newWebhook.id}`);
    console.log(`   URL: ${newWebhook.url}`);
    console.log(`   Enabled: ${newWebhook.enabled}`);
  }

  // 3. Testar health check
  console.log();
  console.log("🏥 Testando health check...");
  try {
    const healthResponse = await fetch(WEBHOOK_URL, {
      method: "GET",
      headers: { "User-Agent": "Asaas-Webhook-Test" },
    });
    const healthData = await healthResponse.json();
    console.log(`   Status: ${healthResponse.status}`);
    console.log(`   Response: ${JSON.stringify(healthData)}`);

    if (healthResponse.ok) {
      console.log("✅ Health check OK!");
    } else {
      console.warn("⚠️ Health check falhou — verifique se o servidor está rodando.");
    }
  } catch (error) {
    console.warn("⚠️ Não foi possível acessar o webhook — verifique se o tunnel está ativo.");
    console.warn(`   URL: ${WEBHOOK_URL}`);
  }

  console.log();
  console.log("🎉 Configuração concluída!");
  console.log();
  console.log("📌 Lembrete: Se você usar Cloudflare Tunnel, a URL muda a cada reinício.");
  console.log("   Execute este script novamente após reiniciar o tunnel.");
}

main().catch((error) => {
  console.error("❌ Erro fatal:", error);
  process.exit(1);
});
