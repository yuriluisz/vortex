---
name: project-sanitation
description: Run an automated codebase sanitation pass to inventory, clean up dead code, remove unused variables/imports, and verify zero regressions against quality gates.
---

# Project Sanitation & Dead Code Removal Skill

Esta skill aplica o protocolo de **Sanitização de Código** e **Warning Burndown** do Vibe Coding Toolkit para manter a base de código enxuta e livre de resíduos.

---

## 🧹 Protocolo em 4 Etapas

### 1. Linha de Base Factual (Medir antes de agir)
Execute a medição real — nunca confie em estimativas:
```powershell
npx tsc --noEmit
npm run lint
npm test
npm run build
```

### 2. Inventário de Resíduos (Sem alterar código ainda)
- **Imports Órfãos:** Módulos e ícones importados que não são mais referenciados no JSX/TS.
- **Variáveis / Parâmetros Não Utilizados:** Identificados pelo linter ou pelo TypeScript. Se forem parâmetros obrigatórios por interface, prefixar com `_` (ex: `_req`, `_error`).
- **Funções / Arquivos Não Utilizados:** Código legado abandonado após refatorações.
- **TODOs / FIXMEs Obsoletos:** Comentários deixados para trás em tarefas já entregues.

### 3. Limpeza Cirúrgica em Ondas
- Agrupar arquivos em conjuntos disjuntos.
- Fazer alterações pontuais sem alterar comportamento nem adicionar abstrações.
- Remover blocos mortos em vez de comentar código.

### 4. Verificação de Portões
- Re-executar `npm run lint`, `npx tsc --noEmit` e `npm test`.
- Garantir 0 erros e redução progressiva de avisos.
