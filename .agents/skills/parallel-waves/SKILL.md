---
name: parallel-waves
description: Use when planning or orchestrating complex multi-step tasks across multiple files to organize work into safe, parallel execution waves without file collisions.
---

# Parallel Waves Orchestration Skill

Esta skill guia o planejamento e execução de tarefas em **ondas paralelas seguras**, eliminando colisões de arquivos e disputas de commit.

---

## 🌊 Como Montar o Plano de Ondas

Ao criar um plano de implementação para uma tarefa com 2+ passos independentes:

### Passo 1: Tagging de Cada Tarefa
Para cada item do plano, declare obrigatoriamente:
- `Files:` Os arquivos exatos (caminhos completos ou relativos ao workspace) que a tarefa vai criar ou modificar.
- `Depends-on:` Os IDs das tarefas que precisam estar concluídas antes desta começar (ou `none`).

### Passo 2: Particionamento em Ondas
- **Onda 1 (Fundação):** Tarefas sem dependências que definem contratos, schemas Prisma ou tipos base.
- **Onda N (Paralela):** Agrupe tarefas cujos `Files:` sejam completamente **disjuntos** e cujas dependências já foram resolvidas em ondas anteriores.
- **Onda Final (Integração & Verificação):** Conexão das partes, rotas de API, testes ponta a ponta e build.

---

## ⚡ Regras de Execução Durante a Onda

1. **Sem Commits por Implementadores Individuais:** Implementadores apenas editam os arquivos e rodam verificações locais.
2. **Commit Centralizado pelo Orquestrador:** Ao término de cada onda, o orquestrador roda os quality gates rápidos e realiza o commit atômico das alterações daquela onda.
3. **Fail-Safe:** Se uma tarefa precisar tocar num arquivo não previsto no planejamento, o orquestrador interrompe a onda paralela e converte o passo para execução serial.
