# Parallel Subagent-Driven Development Protocol

## 🎯 Objetivo

Executar tarefas independentes em paralelo (ou em ondas estruturadas) sem correr o risco de:
1. **Colisão de arquivos:** Dois agentes editando o mesmo arquivo simultaneamente e sobrescrevendo alterações.
2. **Disputa de Git Commits:** Dois agentes competindo por commits com HEAD desatualizado ou misturando alterações desconexas.

---

## 🛡️ As Duas Regras Estruturais

A execução paralela é 100% segura quando ambas as regras são seguidas:

1. **Conjuntos de Arquivos Disjuntos:** Uma onda paralela só pode conter tarefas cujos conjuntos de arquivos declarados sejam estritamente disjuntos (nenhum arquivo compartilhado entre tarefas da mesma onda).
2. **Commit Centralizado:** Subagentes e executores de tarefas individuais **nunca** realizam commit diretamente. Eles deixam as modificações na árvore de trabalho (`working tree`). O agente orquestrador/controlador valida e executa os commits sequencialmente após a conclusão da onda.

---

## 📋 Tagging Obrigatório de Tarefas no Planejamento

Ao planejar uma implementação com múltiplos passos, toda tarefa deve conter obrigatoriamente duas tags:

- **`Files:`** Lista explícita de arquivos e caminhos que a tarefa vai criar ou modificar.
- **`Depends-on:`** IDs das tarefas das quais esta depende (ou `none`).

> [!WARNING]
> **Regra de Fail-Safe:** Se houver dúvida ou indefinição sobre quais arquivos uma tarefa toca, trate a tarefa como dependente de todas as anteriores (execução serial). Nunca chute um escopo menor do que o real.

---

## 🌊 Formação de Ondas (Waves)

Duas tarefas pertencem à mesma **Onda (Wave)** se, e somente se:
1. Nenhuma depende da outra direta ou transitivamente (`Depends-on`).
2. Os conjuntos de arquivos (`Files:`) não possuem nenhuma interseção.

### Exemplo de Estrutura de Ondas:

```markdown
### Onda 1 (Fundações e Contratos — Serial ou Isolada)
- [Task 1.1] Schema do Prisma & Migrations
  - Files: `prisma/schema.prisma`
  - Depends-on: none

### Onda 2 (Implementações Paralelas — Arquivos Disjuntos)
- [Task 2.1] Service de Integração Asaas
  - Files: `src/services/asaas.service.ts`, `src/tests/asaas.test.ts`
  - Depends-on: Task 1.1
- [Task 2.2] Componente UI de Badge de Plano
  - Files: `src/components/admin/plan-badge.tsx`
  - Depends-on: none
- [Task 2.3] Worker de Notificação BullMQ
  - Files: `src/workers/notification.worker.ts`
  - Depends-on: Task 1.1

### Onda 3 (Integração & Rotas — Consome as anteriores)
- [Task 3.1] API Route de Checkout
  - Files: `src/app/api/checkout/route.ts`
  - Depends-on: Task 2.1, Task 2.2, Task 2.3
```

---

## 🔄 Ciclo de Execução do Orquestrador

1. **Despacho da Onda:** Dispara as tarefas da onda atual.
2. **Aguardar Conclusão:** Espera todas as tarefas da onda reportarem conclusão.
3. **Verificação Integrada:** Executa typecheck / testes rápidos na árvore de trabalho.
4. **Commit Sequencial:** O orquestrador realiza o commit atômico das alterações da onda.
5. **Avanço:** Inicia a próxima onda.
