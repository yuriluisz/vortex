<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Vortex — AI Agent Guidelines & Architecture

> Project instructions and orchestration protocol for Antigravity & AI agents working on Vortex.

## 🎯 Behavioral Guidelines

1. **Think before coding** — Explicitly state assumptions. If multiple valid interpretations exist, present options rather than guessing silently. If a requirement is ambiguous, stop and clarify.
2. **Simplicity first (Ponytail discipline)** — Write the absolute minimum code that solves the problem. No speculative abstractions, no unrequested configurability, no over-engineered helper layers. Check stdlib and existing utilities before writing new code.
3. **Surgical changes** — Touch only files and lines strictly necessary for the task. Preserve surrounding code style, comments, and architecture. Never reformat or "clean up" unrelated lines.
4. **Goal-driven execution** — Convert every task into verifiable criteria (e.g. "fix bug" ➔ write reproducing test ➔ make it pass ➔ verify with typecheck and lint).
5. **Orchestrator, not implementer** — For complex multi-file features, plan and coordinate first. Decompose tasks into isolated subtasks, dispatching them cleanly or executing them in structured waves without collisions.

---

## 🛠️ Tech Stack

- **Framework:** Next.js 16 (App Router, Server Components & Server Actions, React 19)
- **Language:** TypeScript 5 (Strict mode)
- **Database & ORM:** PostgreSQL + Prisma 7 (`@prisma/adapter-pg`)
- **Queue / Background Jobs:** BullMQ + Redis (`ioredis`) + Worker script (`src/workers/index.ts`)
- **Styling:** TailwindCSS v4 + Framer Motion + Lucide React
- **Testing:** Vitest 4 (`npm test`)
- **Validation & Auth:** Zod, Jose, Bcryptjs
- **Integrations:** Resend (Email), Asaas (Payments), Google ReCAPTCHA

---

## ⚡ Canonical Commands

Always use the exact commands listed below — do not invent or guess alternatives:

- **Install dependencies:** `npm install`
- **Generate Prisma Client:** `npx prisma generate`
- **Lint code:** `npm run lint`
- **Typecheck:** `npx tsc --noEmit`
- **Run unit tests:** `npm test`
- **Run tests with watch:** `npm run test:watch`
- **Build production bundle:** `npm run build`
- **Run development server:** `npm run dev`
- **Run background worker:** `npm run worker`

---

## 🤖 Specialist Agent Routing Table

When approaching complex or delegable tasks, adopt the dedicated specialist role and checklist:

| Specialist | When to use & Core checklist |
|---|---|
| `orchestrator` | Coordinates work spanning multiple layers (e.g., DB migration + API route + UI). Decomposes tasks, validates dependencies, tags files, and manages execution waves. |
| `backend-specialist` | API routes (`src/app/api/...`), Server Actions, service layers (`src/services/...`), external API integrations (Asaas, Resend), business logic. |
| `database-architect` | Prisma schema changes (`prisma/schema.prisma`), migrations, query optimization, relation indexing, transaction safety. |
| `frontend-specialist` | UI components (`src/components/...`), page layouts, Tailwind v4 styling, animations with Framer Motion, accessibility. |
| `react-reviewer` | Verifies React 19 / Next.js 16 conventions: Server vs Client Component boundaries (`'use client'`, `'use server'`), hooks rules, hydration safety. |
| `worker-specialist` | BullMQ queues, job processors (`src/workers/...`), Redis concurrency, retry backoff strategies, idempotency. |
| `security-auditor` | OWASP top 10 checks, auth tokens (Jose/JWT), password hashing, webhook validation, SQL injection prevention, input sanitation (Zod, DOMPurify). |
| `test-engineer` | Writes unit and integration tests with Vitest (`src/tests/...`), test-first development (TDD), edge case & regression coverage. |
| `debugger` | Root cause analysis of bugs, crashes, or flaky tests before writing fixes. Formulates hypothesis ➔ verifies evidence ➔ implements minimal fix. |
| `code-reviewer` | Reviews PRs and diffs for bugs, edge cases, error handling, type safety, and ensures zero new lint/type warnings. |
| `ponytail-simplifier` | Eliminates accidental complexity, redundant abstractions, and enforces standard library / native platform solutions. |

---

## 🌊 Parallel Waves & Quality Gates

Detailed rules and skills are located in `.agents/`:
- **Parallel Subagents:** See [`.agents/rules/parallel-subagents.md`](file:///.agents/rules/parallel-subagents.md)
- **Quality Gates:** See [`.agents/rules/quality-gates.md`](file:///.agents/rules/quality-gates.md)
- **Caveman Conciseness:** See [`.agents/rules/caveman-conciseness.md`](file:///.agents/rules/caveman-conciseness.md)
- **Vortex Architecture:** See [`.agents/rules/vortex-architecture.md`](file:///.agents/rules/vortex-architecture.md)
