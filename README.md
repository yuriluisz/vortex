<p align="center">
  <img src="https://prod-minio.aifsu7.easypanel.host/img/Vortex%20Padr%C3%A3o.svg" alt="Vórtex+" height="68">
</p>

<p align="center">
  <b>Infraestrutura de alta conversão, injeção modular de formulários e rotação atômica de WhatsApp para operações de tráfego direto em escala.</b>
</p>

<p align="center">
  <a href="https://nextjs.org/"><img src="https://img.shields.io/badge/Next.js-16.2-black?style=flat-square&logo=next.js" alt="Next.js 16"></a>
  <a href="https://react.dev/"><img src="https://img.shields.io/badge/React-19.2-149eca?style=flat-square&logo=react" alt="React 19"></a>
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-5.0-3178c6?style=flat-square&logo=typescript" alt="TypeScript"></a>
  <a href="https://tailwindcss.com/"><img src="https://img.shields.io/badge/Tailwind-v4-38bdf8?style=flat-square&logo=tailwindcss" alt="Tailwind CSS"></a>
  <a href="https://www.postgresql.org/"><img src="https://img.shields.io/badge/PostgreSQL-16-4169e1?style=flat-square&logo=postgresql" alt="PostgreSQL"></a>
  <a href="https://redis.io/"><img src="https://img.shields.io/badge/Redis-ioredis-dc382d?style=flat-square&logo=redis" alt="Redis"></a>
  <a href="https://bullmq.io/"><img src="https://img.shields.io/badge/Queue-BullMQ-e11d48?style=flat-square" alt="BullMQ"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-gray?style=flat-square" alt="License"></a>
</p>

---

## ⚡ O Que é o Vórtex+?

O **Vórtex+** é uma estação de alta performance voltada para validação de ofertas, captação de leads e transbordo para grupos de WhatsApp. Projetado para suportar picos agressivos de tráfego pago sem quedas de conversão ou estouro de infraestrutura.

| Desafio Tradicional no Tráfego Direto | Solução de Engenharia da Vórtex+ |
| :--- | :--- |
| **Páginas pesadas (WordPress / Elementor)** com TTFB alto que queimam o orçamento de anúncios. | **Entrega estática pura** com Server Components, gerando páginas ultrarrápidas com nota máxima no Google Lighthouse. |
| **Grupos de WhatsApp lotam na madrugada**, causando perda de cliques e disparada no CPA. | **Rotacionador atômico em Redis**: transbordo em milissegundos para o próximo grupo assim que a capacidade é atingida. |
| **Operação manual para provisionar grupos** (criar link, subir imagem, configurar admins). | **Auto-provisionamento via Evolution API**: novos grupos são criados, configurados e ativados no fluxo automaticamente. |
| **Dificuldade para acoplar forms em designs prontos** feitos no Webflow ou IA. | **Tag `{{FORM_SLOT}}`**: injeção dinâmica de formulários customizados diretamente no HTML, sem necessidade de recompilação. |

---

## 🛠️ Arquitetura & Como Funciona

A plataforma opera sob um modelo desacoplado: as rotas públicas respondem instantaneamente ao usuário, enquanto tarefas com I/O de banco, analytics e integrações externas são despachadas para background workers gerenciados por Redis e BullMQ.

```text
                           ┌────────────────────────────────────────┐
                           │       Tráfego Pago / Orgânico          │
                           └──────────────────┬─────────────────────┘
                                              │ HTTP GET / POST
                                              ▼
                           ┌────────────────────────────────────────┐
                           │      Next.js 16 (App Router)           │
                           │   • Renderizador HTML estático         │
                           │   • Injeção de {{FORM_SLOT}}           │
                           │   • Proxy de CNAME Multi-tenant        │
                           └──────┬──────────────────────┬──────────┘
                                  │                      │
                   Ingestão       │                      │ Rotação Atômica
                   Assíncrona     ▼                      ▼
                   ┌────────────────────────────────────────┐
                   │             Redis / BullMQ             │
                   └──────────────────┬─────────────────────┘
                                      │ Jobs concorrentes
                                      ▼
                   ┌────────────────────────────────────────┐
                   │           Background Workers           │
                   ├────────────────────────────────────────┤
                   │  [leads-queue]    ──> Prisma 7 / PG    │
                   │  [views-queue]    ──> Incremento View  │
                   │  [groups-queue]   ──> Auto-Create Zap  │
                   │  [webhooks-queue] ──> Sync Membros     │
                   └──────────────────┬─────────────────────┘
                                      │
                                      ▼
                   ┌────────────────────────────────────────┐
                   │   Evolution API (WhatsApp Gateway)     │
                   └────────────────────────────────────────┘
```

### Pilares Técnicos

1. **Ingestão Assíncrona de Alta Concorrência:**  
   Submissões de formulários e contadores de visualização não competem por conexões HTTP nem travam requisições de página. O payload entra diretamente nas filas `leads-queue` e `views-queue` para persistência com backoff e retentativas automáticas.
2. **Auto-Provisionamento de Grupos:**  
   Quando o grupo atual atinge o limite (`groupMaxCapacity`), o worker aciona a Evolution API, cria o próximo grupo sequencial (ex: `Turma VIP 02`), promove os números de suporte a administradores, atualiza a foto e a descrição, e gera o novo convite sem intervenção humana.
3. **Segurança de Borda & Isolamento:**  
   - Sanitização de HTML com `DOMPurify` para neutralizar injeções de script (XSS).  
   - Guard contra ataques SSRF na ingestão de imagens remotas.  
   - Sessões seguras com cookies `httpOnly` assinados via JWT (`jose`).  
   - Suporte a domínios customizados via CNAME isolando o tráfego de cada tenant.

---

## 🚀 Principais Funcionalidades

- **Injeção Modular `{{FORM_SLOT}}`:** Adicione o placeholder em qualquer ponto do HTML da sua página. O sistema renderiza formulários reativos, validados via Zod e conectados ao funil.
- **Editor Split-Pane Monaco:** Edite o código fonte da landing page diretamente no painel administrativo com Monaco Editor (mesmo motor do VS Code) e preview em tempo real.
- **Rotacionador Inteligente de WhatsApp:** Roteamento de tráfego com tolerância a falhas, balanceamento de membros e monitoramento de saturação de grupos.
- **Disparos em Massa (Broadcast):** Disparo programado de mensagens e mídias para múltiplos grupos com rastreabilidade de entrega por fila dedicada.
- **Loja de Templates da Comunidade:** Compartilhamento e curadoria de páginas prontas com perfil público de criadores e estatísticas de uso.
- **Analytics & Sessão em Tempo Real:** Registro detalhado de métricas de conversão e suporte a replays de navegação (`rrweb`).

---

## 🧰 Stack Tecnológica

| Camada | Tecnologia | Propósito |
| :--- | :--- | :--- |
| **Framework** | Next.js 16.2 (React 19) | App Router, Server Actions, Server Components |
| **Estilização** | Tailwind CSS v4 | Estilização utilitária de alta performance |
| **Linguagem** | TypeScript 5 | Tipagem estática fim a fim |
| **Banco de Dados** | PostgreSQL 16 + Prisma 7 | Persistência relacional (`@prisma/adapter-pg`) |
| **Filas & Cache** | BullMQ + Redis (ioredis) | Concorrência assíncrona, workers e rate limit |
| **WhatsApp Engine**| Evolution API | Conexão multi-device, webhooks e automação de grupos |
| **Editor** | Monaco Editor | Interface profissional para edição de código |
| **Storage** | MinIO / AWS S3 SDK | Armazenamento de assets e imagens de campanhas |
| **Validação / Auth**| Zod 4 + Jose (JWT) | Schemas de validação e autenticação stateless |

---

## 🏁 Início Rápido

### Pré-requisitos
- **Node.js** >= 20
- **PostgreSQL** >= 15
- **Redis** >= 7

### Passo a Passo

```bash
# 1. Clone o repositório
git clone https://github.com/yuriluisz/vortex.git
cd vortex

# 2. Instale as dependências
npm install

# 3. Configure o ambiente
cp .env.example .env
# Preencha DATABASE_URL, REDIS_URL, JWT_SECRET, RESEND_API_KEY e EVOLUTION_*

# 4. Aplique as migrations do Prisma
npx prisma migrate dev

# 5. Inicie a aplicação web
npm run dev

# 6. Em um terminal separado, inicie os background workers
npm run worker
```

- Aplicação Web: [http://localhost:3000](http://localhost:3000)
- Painel Administrativo: [http://localhost:3000/admin](http://localhost:3000/admin)

---

## 📜 Scripts do Projeto

| Comando | Descrição |
| :--- | :--- |
| `npm run dev` | Inicia o servidor Next.js em modo de desenvolvimento |
| `npm run worker` | Inicia o processador de filas do BullMQ (`src/workers/index.ts`) |
| `npm run build` | Compila o projeto Next.js para produção |
| `npm run start` | Inicia o servidor de produção compilado |
| `npm run test` | Executa os testes automatizados via Vitest |
| `npm run lint` | Executa a validação de regras de código com ESLint |

---

## 📄 Licença

Distribuído sob a licença **MIT**. Consulte o arquivo [LICENSE](file:///C:/Users/yulus/Documents/GitHub/vortex/LICENSE) para mais detalhes.
