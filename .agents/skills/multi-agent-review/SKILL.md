---
name: multi-agent-review
description: Perform a multi-perspective code review covering security, TypeScript correctness, React 19 / Next.js 16 conventions, performance, and Ponytail simplification.
---

# Multi-Agent Code Review Skill

Esta skill aplica um protocolo de revisão de código a partir de 5 lentes especializadas antes de finalizar qualquer branch ou PR no Vortex.

---

## 🔍 As 5 Lentes de Revisão

### 1. 🛡️ Segurança (`security-auditor`)
- [ ] Chaves de API e segredos nunca são expostos no cliente (`server-only`).
- [ ] Inputs de rotas e Server Actions validados estritamente com Zod.
- [ ] Sanitização de HTML com DOMPurify antes de renderizar conteúdo externo.
- [ ] Proteção contra CSRF / IDOR / SQL Injection (garantindo que queries Prisma filtrem pelo `tenantId` / `userId` da sessão).

### 2. 📘 TypeScript & Corretude (`typescript-reviewer`)
- [ ] Zero tipagens como `any`.
- [ ] Tratamento explícito de `null` e `undefined`.
- [ ] Promises tratadas com `await` ou `Promise.all` sem rejeições silenciosas.
- [ ] Retornos de Server Actions fortemente tipados.

### 3. ⚛️ React 19 & Next.js 16 (`react-reviewer`)
- [ ] Uso correto de Server Components por padrão.
- [ ] `'use client'` apenas em componentes folha que realmente precisam de interatividade.
- [ ] Array de dependências de hooks (`useEffect`, `useCallback`, `useMemo`) 100% completo e correto.
- [ ] Ausência de hydration mismatch (evitar timestamps ou dados não determinísticos no primeiro render).

### 4. ⚡ Performance & Background (`performance-optimizer` & `worker-specialist`)
- [ ] Tarefas pesadas (envio de e-mail em lote, webhooks, disparos de mensagens) delegadas para filas BullMQ em vez de bloquear a requisição HTTP.
- [ ] Queries Prisma com `select` explícito para evitar transferir colunas desnecessárias.
- [ ] Índices adequados no PostgreSQL para campos frequentemente filtrados.

### 5. 🦥 Simplificação Ponytail (`ponytail-simplifier`)
- [ ] O código resolve o problema com o menor volume possível de linhas?
- [ ] Existe alguma biblioteca de terceiros que foi adicionada quando o Node.js stdlib ou React nativo resolveriam?
- [ ] Existem abstrações especulativas que podem ser removidas?

---

## 📝 Formato do Relatório de Revisão

```markdown
### 📋 Relatório de Revisão Multi-Agente

| Lente | Status | Observações / Ações necessárias |
|---|---|---|
| 🛡️ Segurança | ✅ Aprovado | Inputs validados com Zod |
| 📘 TypeScript | ✅ Aprovado | Tipagem estrita mantida |
| ⚛️ React 19 / Next 16 | ✅ Aprovado | Server Component boundary preservado |
| ⚡ Performance | ✅ Aprovado | Jobs pesados enviados para fila |
| 🦥 Simplificação | ✅ Aprovado | Zero over-engineering |
```
