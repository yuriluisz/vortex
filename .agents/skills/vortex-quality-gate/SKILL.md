---
name: vortex-quality-gate
description: Run the full automated verification battery (ESLint, TypeScript strict typecheck, Vitest unit tests, Next.js build) and systematically resolve failures before completing work or merging.
---

# Vortex Quality Gate Skill

Esta skill executa a bateria completa de validação do projeto Vortex e guia a resolução sistemática de qualquer falha.

---

## 🚦 Bateria Canônica de Verificação

Execute os comandos na ordem abaixo:

```powershell
# 1. Typecheck estrito do TypeScript 5
npx tsc --noEmit

# 2. Linter do Next.js / ESLint 9
npm run lint

# 3. Testes unitários do Vitest
npm test

# 4. Compilação de Produção
npm run build
```

---

## 🔍 Diagnóstico e Resolução Sistemática

- **Se o Typecheck (`tsc`) falhar:**
  - Inspecione a linha do erro no arquivo TypeScript.
  - Verifique se os tipos de props de componentes React, schemas Zod ou retornos do Prisma coincidem.
  - Nunca use `any` ou `@ts-ignore` para mascarar o problema.

- **Se o Lint (`eslint`) falhar:**
  - Corrija imports não utilizados ou desestruturados em excesso.
  - Certifique-se de que nenhum hook React está violando o array de dependências.

- **Se os Testes (`vitest`) falharem:**
  - Isole o teste que falhou com `npx vitest run <caminho-do-teste>`.
  - Inspecione o valor esperado vs recebido.
  - Se for uma mudança intencional de comportamento, atualize a asserção do teste. Caso contrário, corrija o bug na implementação.

- **Se o Build (`next build`) falhar:**
  - Verifique se há código de servidor (`server-only`) importado em Client Components.
  - Verifique se rotas dinâmicas ou estáticas possuem exportações inválidas.
