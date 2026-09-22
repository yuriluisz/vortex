# Replays de Sessão e Heatmap Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Corrigir os 4 bugs críticos na tela de gravações e mapa de calor: posicionamento do modal via portal, preservação de gravação completa (evitando vídeos de 1s e tela preta), importação dos estilos CSS do rrweb e alinhamento do mapa de calor com a página real.

**Architecture:** O modal de replay usa `createPortal` anexado ao `document.body` com estilos oficiais do `rrweb`. O `SessionTracker` mantém o buffer cumulativo da sessão para que os uploads ao R2 contenham sempre o `FullSnapshot` e todo o tempo decorrido. O `HeatmapView` carrega a rota real `/${campaignSlug}?preview=true` para que as dimensões batam 1:1 com os cliques dos visitantes.

**Tech Stack:** Next.js 16, React 19, rrweb 2.1.1, Cloudflare R2, Prisma, Vitest.

## Global Constraints

- Manter a compatibilidade com todos os navegadores modernos (mobile e desktop).
- Não introduzir novas dependências externas pesadas (usar `createPortal` nativo do React e `rrweb/dist/style.css` já instalado).
- Todos os testes da aplicação (`npm test`) devem continuar 100% passando.

---

### Task 1: Corrigir Posicionamento e Estilos do ReplayPlayerModal

**Files:**
- Modify: `src/components/admin/recordings/ReplayPlayerModal.tsx`

**Interfaces:**
- Consumes: `sessionId`, `onClose`
- Produces: Portal render no `document.body` com `z-[9999]`, bloqueio de scroll e CSS do `rrweb`.

- [ ] **Step 1: Importar `createPortal` de `react-dom` e `rrweb/dist/style.css`**
- [ ] **Step 2: Implementar bloqueio de scroll do `body` e handler de tecla ESC**
- [ ] **Step 3: Envolver o JSX retornado em `createPortal(content, document.body)`**
- [ ] **Step 4: Executar testes de regressão do projeto**

---

### Task 2: Corrigir Gravação Cumulativa e Eliminar Tela Preta no SessionTracker

**Files:**
- Modify: `src/components/analytics/SessionTracker.tsx`
- Modify: `src/tests/session-recordings.test.ts`

**Interfaces:**
- Consumes: `campaignId`, `enabled`
- Produces: Envio de payload completo com `FullSnapshot` mantido ao longo de toda a sessão.

- [ ] **Step 1: Alterar `eventsQueue` para `allEvents` cumulativo com teto de 2.500 eventos**
- [ ] **Step 2: Não limpar os eventos da sessão no `flush()`, garantindo que uploads para o R2 contenham sempre o histórico completo**
- [ ] **Step 3: Atualizar e rodar os testes em `src/tests/session-recordings.test.ts`**

---

### Task 3: Corrigir Alinhamento e Renderização Fiel no HeatmapView

**Files:**
- Modify: `src/components/admin/recordings/HeatmapView.tsx`
- Modify: `src/tests/heatmap-view.test.ts`

**Interfaces:**
- Consumes: `campaignId`, `campaignSlug`, `rawHtml`
- Produces: Visualização fiel via preview real `/${campaignSlug}?preview=true`.

- [ ] **Step 1: Atualizar o iframe do `HeatmapView` para carregar a página real da campanha com segurança**
- [ ] **Step 2: Ajustar a renderização do canvas térmico sobre o documento real**
- [ ] **Step 3: Atualizar e executar os testes em `src/tests/heatmap-view.test.ts`**

---

### Task 4: Validação Geral e Commit

- [ ] **Step 1: Rodar a suíte completa de testes (`npm test`)**
- [ ] **Step 2: Verificar status do Git e commitar alterações**
