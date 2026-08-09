<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://cdn.jsdelivr.net/gh/yuriluisz/vortex/public/Vortex%20Padr%C3%A3o.svg">
    <img src="https://cdn.jsdelivr.net/gh/yuriluisz/vortex/public/Vortex%20Padr%C3%A3o.svg" alt="Vórtex+" height="64">
  </picture>
</p>

<h1 align="center">
  Vórtex+ 🌪️
</h1>

<p align="center">
  <b>A plataforma definitiva para validação de ofertas e hospedagem de landing pages.</b><br>
  Hospede seu código, faça vendas, capture leads e <b>nunca perca dinheiro</b> com infraestrutura complexa.
</p>

<br>

<p align="center">
  <a href="#-funcionalidades">Funcionalidades</a> •
  <a href="#-stack">Stack</a> •
  <a href="#-pra-quem">Pra Quem</a> •
  <a href="#-planos">Planos</a> •
  <a href="#%EF%B8%8F-como-funciona">Como Funciona</a> •
  <a href="#-início-rápido">Início Rápido</a>
</p>

<p align="center">
  <a href="https://github.com/yuriluisz/vortex/actions">
    <img src="https://img.shields.io/badge/status-em%20produ%C3%A7%C3%A3o-22c55e?style=flat-square" alt="Status">
  </a>
  <a href="https://nextjs.org/">
    <img src="https://img.shields.io/badge/powered%20by-Next.js%2016-000?style=flat-square&logo=next.js" alt="Next.js 16">
  </a>
  <a href="https://www.postgresql.org/">
    <img src="https://img.shields.io/badge/database-PostgreSQL-4169E1?style=flat-square&logo=postgresql&logoColor=white" alt="PostgreSQL">
  </a>
  <a href="https://redis.io/">
    <img src="https://img.shields.io/badge/cache-Redis-DC382D?style=flat-square&logo=redis&logoColor=white" alt="Redis">
  </a>
  <a href="LICENSE">
    <img src="https://img.shields.io/badge/license-MIT-6b7280?style=flat-square" alt="License">
  </a>
</p>

<br>

---

<br>

## 🔥 O PROBLEMA

> Você gasta dias (e milhares de reais) construindo um site inteiro,
> configurando banco de dados, servidores, SSL e plugins complexos...
> Só para descobrir que **a oferta não converte**.
> **Você perdeu tempo e dinheiro.**

**A infraestrutura não deve ser um obstáculo para testar ideias.**

Validar uma oferta precisa ser rápido. Você precisa de uma landing page no ar em segundos, capturando leads ou fazendo vendas diretas, com métricas precisas e proteção contra curiosos. Sem configurar servidores.

---

## 💰 O GANHO

<p align="center">
  <b>Com o Vórtex+, você hospeda seu código, insere checkouts ou captura leads em segundos.</b><br>
  <b>Valide rápido, escale depois.</b>
</p>

| Cenário | Tempo | Infraestrutura | Risco |
|---------|-------|----------------|-------|
| **Modelo Tradicional** 🚫 | Dias / Semanas | Hospedagem, SSL, Banco, Plugins | Alto |
| **Vórtex+** ✅ | 1 Minuto | Zero (Nós cuidamos de tudo) | Quase Zero |

Em vez de gastar dias configurando tudo, você foca 100% no tráfego e na copy.

**O Vórtex+ acelera sua validação.**

---

## ⚡ COMO FUNCIONA

### 1. 📄 Cole seu HTML
Exporte o HTML da sua página de ferramentas como Webflow, Figma, Framer, IAs (v0/Bolt) ou código puro. Nós hospedamos com performance de ponta.

### 2. 🔌 Adicione Vídeos, Checkouts ou Formulários
- Embede VSLs facilmente via `<iframe>` (Vturb, YouTube, Vimeo).
- Crie botões de vendas usando links normais para Hotmart/Kiwify.
- Se preferir capturar leads, injete nosso formulário super rápido adicionando a tag `{{FORM_SLOT}}`.

### 3. 🚀 Valide a Oferta (e Escale se Funcionar)
Com a página no ar, analise os resultados em tempo real. Se der bom, use nossos recursos Ultra: ative a rotação inteligente de grupos de WhatsApp, envie disparos em massa e conecte um domínio próprio.

---

## 🚀 FUNCIONALIDADES

| Recurso | O que faz | Impacto no seu lucro |
|---------|-----------|---------------------|
| **Rotação automática** | Distribui leads entre N grupos sem você mexer um dedo | 🟢 **Perda zero de leads** |
| **Formulário dinâmico** | Schema configurável sem código (texto, select, checkbox…) | 🟢 **Zero dependência de dev** |
| **Domínio personalizado** | Sua marca no lugar da nossa (planos Pro+) | 🟢 **Autoridade + conversão** |
| **Cofre de leads** | Base de dados completa com metadata (IP, device, localização) | 🟢 **Base própria, remailings futuros** |
| **Dashboard em tempo real** | Contagem de leads, grupos ativos, campanhas | 🟢 **ROI visível em segundos** |
| **Pixel/Facebook Ads** | Dispare seu pixel nas páginas de captura | 🟢 **Remarketing pra quem não converteu** |
| **2FA + JWT** | OTP por email, sessão criptografada, cookie httpOnly | 🟢 **Segurança enterprise** |
| **Multi-tenant isolado** | Cada cliente com seu banco lógico separado | 🟢 **Dados nunca se misturam** |

---

## 🛡️ STACK TÉCNICA

Infraestrutura de **enterprise**, preço de **café**.

```
Frontend    Next.js 16 (App Router, Server Components, Server Actions)
Database    PostgreSQL 16 + Prisma ORM + adapter-pg
Cache       Redis 7 (rate limiting, sessão, rotacionador)
Auth        JWT (HS256, jose) + OTP por e-mail (Resend)
Auth 2FA    Código de 6 dígitos via Redis (5 minutos, 3 tentativas)
Rate Limit  Sliding window via Redis (login 5/min, OTP 3/5min, criação 1/h)
Isolamento  Multi-tenant com tenantId em todas as tabelas
Audit Log   Toda ação crítica registrada com IP, userId, tenantId
Deploy      Docker + PostgreSQL + Redis (qualquer VPS / Railway / Fly.io)
```

> **Segurança de ponta a ponta:**  
> ✅ Rate limiting contra brute force  
> ✅ Timing attack prevention na validação de credenciais  
> ✅ Session fixation prevention na troca de tenant  
> ✅ Proteção de rotas via middleware (proxy.ts)  
> ✅ Role-based access (SUPER_ADMIN / ADMIN / MEMBER)  
> ✅ Tenant inativo bloqueia login automaticamente  
> ✅ Todos os recursos verificam `requireTenantOwnership` antes de operar

---

## 👥 PRA QUEM É

| Perfil | O Vórtex+ resolve |
|--------|-------------------|
| **Copywriter / Validador de Ofertas** | Precisa colocar uma VSL no ar rápido sem depender de devs |
| **Infoprodutor** | Hospeda a landing page e, se validar, usa nossos grupos de WhatsApp para escala |
| **Agência de marketing** | Gerencia campanhas e testes A/B de vários clientes num painel só |
| **Coach / Mentor** | Venda direta ou captação de leads para eventos High-Ticket |
| **Qualquer um que testa ideias** | Não quer gastar dinheiro e tempo com infraestrutura antes de saber se o produto vende |

---

## 💰 PLANOS

| | **Starter** | **Validador Pro** | **Scale / Ultra** |
|---|---|---|---|
| **Preço** | **R\$ 0** | **R\$ 97/mês** | **R\$ 157/mês** |
| Campanhas | 1 | 10 | Ilimitadas |
| Leads/mês | 100 | 10.000 | Ilimitados |
| Grupos | 3 | 50 | Ilimitados |
| Automação WhatsApp | ❌ | ❌ | ✅ |
| Domínio próprio | ❌ | ✅ | ✅ |
| Marca Vórtex+ | ✅ | ❌ | ❌ |
| Suporte | — | Prioritário | Dedicado 24h |
| | [Começar grátis](https://app.vortex.app) | [Assinar Pro](https://app.vortex.app) | [Assinar Ultra](https://app.vortex.app) |

---

## 🏁 INÍCIO RÁPIDO

```bash
# 1. Clone
git clone https://github.com/yuriluisz/vortex.git
cd vortex

# 2. Instale
npm install

# 3. Configure as variáveis de ambiente
cp .env.example .env
# Edite .env com seus dados:
#   DATABASE_URL, REDIS_URL, JWT_SECRET, RESEND_API_KEY

# 4. Rode as migrations e seed
npx prisma migrate dev
npx prisma db seed

# 5. Inicie o dev server
npm run dev
```

### Variáveis de ambiente

| Variável | Obrigatória | Descrição |
|----------|-------------|-----------|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `REDIS_URL` | ✅ | Redis connection string |
| `JWT_SECRET` | ✅ | Chave para assinar JWTs (`openssl rand -base64 32`) |
| `RESEND_API_KEY` | ✅ | API key do Resend para envio de OTP |
| `RESEND_FROM_EMAIL` | ❌ | Email remetente (default: onboarding@resend.dev) |
| `ADMIN_EMAIL` | ❌ | Email do super admin (seed automático) |
| `ADMIN_PASSWORD_HASH` | ❌ | Hash bcrypt do super admin |

### Acessos padrão (seed)

```
Super Admin: admin@vortex.app / Admin123!
Demo User:   demo@vortex.app / Teste123!
Tenant:      default.vortex.app
```

---

## 📂 Estrutura do projeto

```
src/
├── app/
│   ├── [slug]/          # Páginas de captura (públicas)
│   ├── admin/           # Painel administrativo
│   │   ├── campaigns/   # CRUD de campanhas
│   │   ├── login/       # Autenticação OTP
│   │   ├── settings/    # Perfil, email, plano
│   │   └── super/       # Super admin (global)
│   └── docs/            # Documentação interna
├── components/
│   ├── admin/           # Componentes do painel
│   └── landing/         # Componentes da landing page
├── lib/
│   ├── auth.ts          # OTP, tenant lookup
│   ├── session.ts       # JWT, cookies
│   ├── audit.ts         # Audit logging
│   ├── plans.ts         # Plan limits enforcement
│   ├── rate-limit.ts    # Redis sliding window
│   ├── rotator.ts       # Rotacionador de grupos
│   └── tenant-guard.ts  # Isolamento multi-tenant
├── proxy.ts             # Middleware (proteção de rotas)
└── prisma/
    └── schema.prisma    # Modelo de dados
```

---

## 🧪 Testes

```bash
# Type-check
npx tsc --noEmit

# Lint
npm run lint
```

---

## 🤝 Contribuição

Pull requests são bem-vindos.  
Para mudanças grandes, abra uma issue primeiro.

---

## 📄 Licença

MIT &copy; 2026 — [Vórtex+](https://github.com/yuriluisz/vortex)

---

<p align="center">
  <img src="https://cdn.jsdelivr.net/gh/yuriluisz/vortex/public/Vortex%20Logo%20Only.svg" height="32" alt="Vórtex+">
  <br>
  <sub>Feito com 💜 pra nunca mais deixar um lead escapar.</sub>
</p>