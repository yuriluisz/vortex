# Vortex Quality Gates Protocol

## 🎯 Política de Qualidade: Zero Warnings & Zero Regressões

No projeto Vortex, avisos (*warnings*) de lint ou de tipos são tratados com o mesmo rigor que erros. Nenhum código deve ser considerado concluído ou pronto para merge enquanto existirem avisos pendentes nos arquivos tocados.

---

## 🚦 Os 4 Portões de Qualidade (Gates)

Antes de concluir qualquer tarefa ou criar um commit/PR, os 4 portões abaixo devem ser validados com sucesso:

### Gate 1: Typecheck Estrito (TypeScript 5)
- **Comando:** `npx tsc --noEmit`
- **Critério:** 0 erros de compilação.
- **Regras:**
  - Não utilizar `any` sem justificativa crítica em comentário.
  - Tipagem estrita em parâmetros de Server Actions e API routes.
  - Retornos de funções assíncronas devidamente tipados.

### Gate 2: ESLint (Next.js 16 + React 19)
- **Comando:** `npm run lint`
- **Critério:** 0 erros e 0 warnings.
- **Regras:**
  - Sem variáveis ou imports não utilizados.
  - Regras de Hooks do React 19 rigorosamente respeitadas (sem dependências omitidas em `useEffect`/`useCallback`).
  - Sem manipulação direta de DOM fora de `useEffect` ou refs.

### Gate 3: Testes Automatizados (Vitest 4)
- **Comando:** `npm test`
- **Critério:** Todos os testes unitários e de integração passando 100%.
- **Regras:**
  - Todo novo serviço (`src/services/`) ou utilitário crítico deve vir acompanhado de teste unitário correspondente (`src/tests/`).
  - Correções de bugs devem incluir um teste que reproduza o cenário original.

### Gate 4: Build de Produção do Next.js
- **Comando:** `npm run build`
- **Critério:** Compilação do Next.js concluída sem erros de rotas estáticas ou tipagem em Server Components.

---

## 🛠️ Resolução Sistemática de Falhas

Se um Quality Gate falhar:
1. **Não use workarounds especulativos:** Não insira `// @ts-ignore` ou `eslint-disable` sem entender a causa raiz.
2. **Isole o problema:** Use a skill `systematic-debugging` para rastrear o erro exato na linha indicada.
3. **Corrija na fonte:** Ajuste o tipo, o schema Zod ou o hook React conforme a convenção do projeto.
4. **Re-valide:** Execute novamente o comando do portão afetado até obter saída limpa.
