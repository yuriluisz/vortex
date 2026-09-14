# Easypanel CI/CD Pipeline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Configurar e testar um pipeline de CI/CD com GitHub Actions integrado ao Easypanel que roda os testes da aplicação, dispara o deploy no Easypanel via webhook e valida a conclusão do build na API do Easypanel e o healthcheck HTTP na URL pública.

**Architecture:** O GitHub Actions roda os testes (`npm test`). Ao passarem, envia um `POST` no webhook de deploy do Easypanel e em seguida executa `scripts/verify-deploy.mjs`, que monitora a ação no Easypanel até `done` e valida o HTTP 200 no domínio público.

**Tech Stack:** GitHub Actions, Node.js 20 (ESM nativo, `fetch`), Easypanel tRPC API, Vitest.

## Global Constraints

- O script de verificação não deve ter dependências externas (usar `fetch` nativo do Node 20).
- Nenhuma secret em texto puro hardcoded nos arquivos versionados do repositório (usar variáveis de ambiente).
- Timeout de build no Easypanel de no máximo 6 minutos; timeout de healthcheck HTTP de até 60 segundos.

---

### Task 1: Script de Verificação de Deploy (`scripts/verify-deploy.mjs`) e Teste Unitário

**Files:**
- Create: `scripts/verify-deploy.mjs`
- Create: `src/__tests__/verify-deploy.test.ts`

**Interfaces:**
- Consumes: Environment variables (`EASYPANEL_BASE_URL`, `EASYPANEL_API_KEY`, `EASYPANEL_PROJECT_NAME`, `EASYPANEL_SERVICE_NAME`, `APP_URL`).
- Produces: `verifyDeployment({ baseUrl, apiKey, projectName, serviceName, appUrl, maxWaitMs, pollIntervalMs }) => Promise<boolean>`

- [ ] **Step 1: Escrever teste unitário para o script de verificação com mocks do fetch**
- [ ] **Step 2: Executar teste com `npx vitest run src/__tests__/verify-deploy.test.ts` e verificar falha inicial**
- [ ] **Step 3: Implementar o script `scripts/verify-deploy.mjs`**
- [ ] **Step 4: Executar teste com `npx vitest run src/__tests__/verify-deploy.test.ts` e verificar aprovação**
- [ ] **Step 5: Commit das alterações**

---

### Task 2: Criar Workflow do GitHub Actions (`.github/workflows/deploy.yml`)

**Files:**
- Create: `.github/workflows/deploy.yml`

**Interfaces:**
- Consumes: GitHub Secrets (`EASYPANEL_DEPLOY_WEBHOOK_URL`, `EASYPANEL_BASE_URL`, `EASYPANEL_API_KEY`, `EASYPANEL_PROJECT_NAME`, `EASYPANEL_SERVICE_NAME`, `APP_URL`).
- Produces: GitHub Actions workflow triggers on push to `main` and `workflow_dispatch`.

- [ ] **Step 1: Criar o arquivo `.github/workflows/deploy.yml` com as etapas completas de test, webhook e verificação**
- [ ] **Step 2: Validar sintaxe do YAML**
- [ ] **Step 3: Commit das alterações**

---

### Task 3: Teste Real do Deploy no Easypanel e Validação ao Vivo

**Files:**
- Test target: Easypanel server (`137.131.189.41:3000`) and live URL (`https://vortexpages.online`)

- [ ] **Step 1: Executar o gatilho de deploy no Easypanel via webhook**
- [ ] **Step 2: Executar `node scripts/verify-deploy.mjs` com as credenciais reais ao vivo para acompanhar o build em tempo real**
- [ ] **Step 3: Confirmar se o build foi concluído com sucesso e se a URL respondeu 200 OK**
