#!/usr/bin/env node

/**
 * Script de verificação e healthcheck do Easypanel
 * Consulta a API tRPC do Easypanel para acompanhar o deployment
 * e em seguida valida a disponibilidade HTTP da aplicação.
 */

import { pathToFileURL } from 'url';

export async function getLatestDeployment({ baseUrl, apiKey, projectName, serviceName }) {
  const cleanBaseUrl = baseUrl.replace(/\/$/, '');
  const inputParam = encodeURIComponent(JSON.stringify({ json: { limit: 20 } }));
  const url = `${cleanBaseUrl}/api/trpc/actions.listActions?input=${inputParam}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Falha ao consultar API do Easypanel (HTTP ${response.status}): ${text}`);
  }

  const data = await response.json();
  const actions = data?.json || [];

  return actions.find(
    (action) =>
      action.projectName === projectName &&
      action.serviceName === serviceName &&
      action.type === 'deployment'
  );
}

export async function pollDeployment({
  baseUrl,
  apiKey,
  projectName,
  serviceName,
  maxWaitMs = 360000, // 6 minutos
  pollIntervalMs = 10000, // 10 segundos
  onProgress = () => {},
}) {
  const startTime = Date.now();

  while (Date.now() - startTime < maxWaitMs) {
    const deployment = await getLatestDeployment({ baseUrl, apiKey, projectName, serviceName });

    if (deployment) {
      onProgress(deployment);

      if (deployment.status === 'done') {
        return deployment;
      }

      if (deployment.status === 'error') {
        throw new Error(
          `Deployment failed on Easypanel with status 'error' (Action ID: ${deployment.id})`
        );
      }
    }

    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
  }

  throw new Error(`Timeout de ${Math.round(maxWaitMs / 1000)}s aguardando conclusão do build no Easypanel.`);
}

export async function pollHealthcheck({
  appUrl,
  maxWaitMs = 60000, // 1 minuto
  pollIntervalMs = 5000, // 5 segundos
  onProgress = () => {},
}) {
  const startTime = Date.now();
  let lastError = null;

  while (Date.now() - startTime < maxWaitMs) {
    try {
      const response = await fetch(appUrl, {
        method: 'GET',
        headers: { 'User-Agent': 'CI-CD-Deploy-Verifier/1.0' },
      });

      onProgress(response.status);

      if (response.status >= 200 && response.status < 400) {
        return true;
      }
      lastError = new Error(`HTTP Status ${response.status}`);
    } catch (err) {
      lastError = err;
      onProgress(err.message || 'Erro de conexão');
    }

    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
  }

  throw new Error(`Healthcheck falhou após ${Math.round(maxWaitMs / 1000)}s na URL ${appUrl}: ${lastError?.message || 'Timeout'}`);
}

export async function verifyDeployment(options) {
  const {
    baseUrl,
    apiKey,
    projectName,
    serviceName,
    appUrl,
    maxWaitMs = 360000,
    pollIntervalMs = 10000,
    onProgress = (msg) => console.log(msg),
  } = options;

  onProgress(`🔍 [1/2] Monitorando build no Easypanel (${projectName}/${serviceName})...`);
  const deployment = await pollDeployment({
    baseUrl,
    apiKey,
    projectName,
    serviceName,
    maxWaitMs,
    pollIntervalMs,
    onProgress: (dep) => {
      onProgress(`  ⏳ Status: ${dep.status} | ID: ${dep.id} | Criado: ${dep.createdAt}`);
    },
  });

  onProgress(`✅ Build do Easypanel finalizado com sucesso! (ID: ${deployment.id})`);

  if (appUrl) {
    onProgress(`🔍 [2/2] Validando disponibilidade HTTP da aplicação (${appUrl})...`);
    await pollHealthcheck({
      appUrl,
      maxWaitMs: 60000,
      pollIntervalMs: Math.min(pollIntervalMs, 5000),
      onProgress: (status) => {
        onProgress(`  🌐 Tentativa Healthcheck: ${status}`);
      },
    });
    onProgress(`🚀 Aplicação online e respondendo HTTP 200 com sucesso!`);
  }

  return true;
}

// Execução direta como script de linha de comando
const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isMain) {
  const baseUrl = process.env.EASYPANEL_BASE_URL;
  const apiKey = process.env.EASYPANEL_API_KEY;
  const projectName = process.env.EASYPANEL_PROJECT_NAME;
  const serviceName = process.env.EASYPANEL_SERVICE_NAME;
  const appUrl = process.env.APP_URL;

  if (!baseUrl || !apiKey || !projectName || !serviceName) {
    console.error('❌ Erro: Variáveis de ambiente obrigatórias não configuradas.');
    console.error('Certifique-se de definir EASYPANEL_BASE_URL, EASYPANEL_API_KEY, EASYPANEL_PROJECT_NAME e EASYPANEL_SERVICE_NAME.');
    process.exit(1);
  }

  verifyDeployment({
    baseUrl,
    apiKey,
    projectName,
    serviceName,
    appUrl,
  })
    .then(() => {
      console.log('🎉 Deploy verificado e aprovado com sucesso!');
      process.exit(0);
    })
    .catch((error) => {
      console.error(`💥 Falha na validação do deploy: ${error.message}`);
      process.exit(1);
    });
}
