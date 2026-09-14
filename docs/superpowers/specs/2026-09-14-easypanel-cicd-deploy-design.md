# Design Spec: Easypanel CI/CD Pipeline com Validação de Deploy

**Data:** 2026-09-14  
**Projeto:** Vortex (`vortexpages.online`)  
**Repositório:** `https://github.com/yuriluisz/vortex.git`  
**Destino de Deploy:** Easypanel (`http://137.131.189.41:3000`, projeto `prod`, serviço `vortex`)

---

## 1. Visão Geral e Objetivos

Estabelecer um pipeline automatizado de Integração Contínua e Entrega Contínua (CI/CD) via GitHub Actions que:
1. Executa a suíte de testes automatizados (`npm test` com Vitest) antes de qualquer ação de deploy.
2. Se qualquer teste falhar, aborta a execução impedindo que código quebrado seja implantado no servidor de produção.
3. Se todos os testes passarem, dispara o Deploy Webhook do Easypanel para clonar o commit mais recente e construir a imagem Docker.
4. Executa um script de verificação (`scripts/verify-deploy.mjs`) que:
   - Monitora a API tRPC do Easypanel até o status da ação de deployment mudar de `pending` para `done`.
   - Se o status for `error`, reporta o erro e falha o pipeline.
   - Faz polling HTTP na URL pública da aplicação (`https://vortexpages.online`) até responder `HTTP 200 OK`.

---

## 2. Arquitetura do Fluxo

```
[Desenvolvedor]
      │  git push origin main
      ▼
[GitHub Actions Runner]
  ├── 1. Checkout do código
  ├── 2. Setup Node.js (v20) e cache de npm
  ├── 3. Instalação de dependências: npm ci
  ├── 4. Execução de testes: npm test
  │      └── [Falhou?] ──► Aborta workflow (Vermelho no GitHub)
  │
  ├── 5. Disparo do Webhook Easypanel:
  │      POST http://137.131.189.41:3000/api/box/deploy/1964b5f63f4bd826bec91ef9d263b79c4f855299f3859e2b
  │
  └── 6. Execução do Script de Validação (scripts/verify-deploy.mjs):
         ├── A. Polling em /api/trpc/actions.listActions (Auth: Bearer Token)
         │      - Aguarda transição: pending -> done (timeout: 6 min)
         │      - Se status === 'error' -> Exit 1 com logs
         │
         └── B. Polling HTTP em https://vortexpages.online
                - Retries a cada 5s até HTTP 200 OK (timeout: 60s)
                - Exit 0 (Sucesso verde no GitHub)
```

---

## 3. Mapeamento de Secrets no GitHub

As seguintes variáveis sensíveis serão configuradas em `Settings > Secrets and variables > Actions > Repository secrets`:

| Nome da Secret | Descrição |
| :--- | :--- |
| `EASYPANEL_DEPLOY_WEBHOOK_URL` | URL de deploy: `http://137.131.189.41:3000/api/box/deploy/1964b5f63f4bd826bec91ef9d263b79c4f855299f3859e2b` |
| `EASYPANEL_BASE_URL` | URL base do Easypanel: `http://137.131.189.41:3000` |
| `EASYPANEL_API_KEY` | Token Bearer da API do Easypanel |
| `EASYPANEL_PROJECT_NAME` | Nome do projeto no Easypanel (`prod`) |
| `EASYPANEL_SERVICE_NAME` | Nome do serviço no Easypanel (`vortex`) |
| `APP_URL` | URL pública de validação (`https://vortexpages.online`) |

---

## 4. Componentes a Implementar

### 4.1. Workflow GitHub Actions: `.github/workflows/deploy.yml`
- Disparado em `push` na branch `main` e via `workflow_dispatch`.
- Variáveis de ambiente injetadas a partir dos secrets.
- Envio do POST ao webhook via `curl`.
- Execução do script `node scripts/verify-deploy.mjs`.

### 4.2. Script de Verificação: `scripts/verify-deploy.mjs`
- Escrito em ESM nativo (`.mjs`) usando `fetch` nativo do Node.js (sem dependências externas).
- Lê variáveis de ambiente:
  - `EASYPANEL_BASE_URL`
  - `EASYPANEL_API_KEY`
  - `EASYPANEL_PROJECT_NAME`
  - `EASYPANEL_SERVICE_NAME`
  - `APP_URL`
- Busca ações via `GET ${EASYPANEL_BASE_URL}/api/trpc/actions.listActions?input={"json":{"limit":10}}`.
- Identifica a ação mais recente correspondente ao projeto e serviço.
- Trata estados: `pending` (aguarda 10s), `error` (falha imediata), `done` (avança para healthcheck HTTP).
- Faz polling no `APP_URL` com retries a cada 5s até responder status 200..299.

---

## 5. Tratamento de Falhas e Casos de Borda

1. **Testes falham**: `npm test` sai com código diferente de zero; as etapas seguintes nunca executam.
2. **Build Docker falha no Easypanel**: A ação no Easypanel passa para `status: "error"`. O script detecta essa alteração, imprime o erro com ID da ação e finaliza com `process.exit(1)`.
3. **Timeout de compilação**: Se o build exceder 6 minutos, o script interrompe o polling com erro de timeout.
4. **App falha ao inicializar (Crash loop)**: Se o container subir mas o Next.js falhar (500 Internal Server Error ou 502 Bad Gateway), o polling HTTP detectará e encerrará com falha após o timeout.
