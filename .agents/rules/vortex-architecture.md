# Vortex Architecture & Stack Conventions

## 🏗️ 1. Next.js 16 & React 19 Conventions

- **Server vs Client Components:**
  - Por padrão, todos os componentes são **Server Components**.
  - Adicione `'use client'` apenas quando o componente precisar de hooks de estado (`useState`, `useReducer`), hooks de ciclo de vida (`useEffect`), event listeners de DOM (`onClick`, `onChange`), ou APIs exclusivas de browser (`window`, `localStorage`).
  - Mantenha os Client Components o mais "folha" possível na árvore de componentes.
- **Server Actions:**
  - Devem ser declaradas em arquivos dedicados (`actions.ts`) ou com `'use server'`.
  - Sempre valide os inputs com schemas **Zod** antes de realizar mutações no banco.
  - Trate erros retornando objetos padronizados (ex: `{ success: false, error: "mensagem" }`) ou disparando exceções capturáveis.
- **Server-Only Boundaries:**
  - Serviços de banco (`prisma`), chaves de API secretas (Asaas, Resend, JWT secrets) e conexão Redis devem usar `import 'server-only'` para garantir que nunca vazem para o bundle do cliente.

---

## 🗄️ 2. Prisma & Banco de Dados (PostgreSQL)

- **Instância do Prisma Client:**
  - Sempre importe a instância singleton do Prisma de [`src/lib/prisma.ts`](file:///src/lib/prisma.ts) (que utiliza `@prisma/adapter-pg`). Nunca instancie `new PrismaClient()` diretamente em rotas.
- **Transações:**
  - Mutações interdependentes (ex: criar lead + atualizar contadores + agendar job de notificação) devem utilizar `prisma.$transaction(...)`.
- **Schema & Migrations:**
  - Modificações de schema são feitas em `prisma/schema.prisma`.
  - Sempre execute `npx prisma generate` após alterar o schema.

---

## 📬 3. Filas & Background Workers (BullMQ + Redis)

- **Estrutura de Filas:**
  - Definição de filas e conexão Redis centralizadas em `src/lib/redis.ts` ou `src/lib/queue.ts`.
  - Processadores de jobs ficam localizados em `src/workers/`.
  - O script principal do worker é executado via `npm run worker` (`src/workers/index.ts`).
- **Idempotência & Retentativas:**
  - Todo worker deve ser idempotente: processar o mesmo job duas vezes não pode duplicar cobranças, mensagens de WhatsApp ou e-mails.
  - Configure backoff exponencial e limite de retentativas para chamadas a APIs externas instáveis.

---

## 🎨 4. Design System & Styling (Tailwind v4)

- Utilize classes utilitárias do Tailwind v4 (`@tailwindcss/postcss`).
- Utilize **Lucide React** para ícones consistentes.
- Animações e transições de entrada/saída são gerenciadas pelo **Framer Motion**.
