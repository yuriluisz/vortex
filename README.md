<p align="center">
  <img src="https://prod-minio.aifsu7.easypanel.host/img/Vortex%20Padr%C3%A3o.svg" alt="Vórtex+" height="64">
</p>

<p align="center">
  <b>A infraestrutura blindada para validação de ofertas, captação de leads e escala no WhatsApp.</b><br>
  Hospede landing pages de alta conversão, injete formulários com <code>{{FORM_SLOT}}</code>, rotacione grupos de WhatsApp automaticamente e escale operações de tráfego direto.
</p>

<br>

<p align="center">
  <a href="#-a-nova-proposta">A Proposta</a> •
  <a href="#-por-que-o-vórtex-é-diferente">Diferenciais</a> •
  <a href="#-principais-recursos">Recursos</a> •
  <a href="#-arquitetura--stack-técnica">Stack</a> •
  <a href="#-planos--limites">Planos</a> •
  <a href="#-início-rápido">Início Rápido</a> •
  <a href="#-documentação">Docs</a>
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

## 🎯 A NOVA PROPOSTA

> **Não somos apenas um hospedador de páginas nem um construtor genérico de sites.**  
> O **Vórtex+** é uma **estação completa de validação e escala para tráfego direto**.

Quem roda tráfego pago precisa de **velocidade máxima**, **nota 100 no Google Lighthouse (Core Web Vitals)**, **blindagem contra curiosos/scraping** e **automação instantânea de grupos de WhatsApp**.

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│  1. Cole HTML   │  ──>  │ 2. {{FORM_SLOT}}│  ──>  │ 3. Rotação ZAP  │  ──>  │ 4. Métricas &   │
│ Webflow / IA /  │       │ Form dinâmico + │       │ Encheu grupo?   │       │ Broadcast em    │
│ Código puro     │       │ Meta Pixel nativo│      │ Próximo da fila │       │ massa em 1 click│
└─────────────────┘       └─────────────────┘       └─────────────────┘       └─────────────────┘
```

---

## ⚡ POR QUE O VÓRTEX+ É DIFERENTE?

| Desafio Tradicional | Como o Vórtex+ Resolve |
|---------------------|------------------------|
| **Construtores pesados (Elementor, Divi)** geram código sujo e páginas lentas que derrubam o tráfego. | **HTML/CSS/JS estático puro**, sem overhead. O servidor não renderiza divs desnecessárias, garantindo velocidade máxima. |
| **Grupos de WhatsApp lotam no meio da madrugada** e você perde centenas de reais em cliques do Meta Ads. | **Rotacionador Inteligente**: assim que um grupo atinge a lotação (ex: 1000 membros), o tráfego é redirecionado em milissegundos para o próximo. |
| **Concorrentes espionam sua oferta e copiam seu funil** pelo slug público. | **Blindagem de Campanha**: URLs protegidas por UUIDs únicos e **Domínio Customizado** que desativa os links genéricos da plataforma. |
| **Dificuldade para criar formulários e testar campos novos**. | **Injeção Dinâmica via `{{FORM_SLOT}}`**: configure campos, obrigatoriedade e ordem direto pelo painel visual sem encostar em código. |

---

## 🚀 PRINCIPAIS RECURSOS

### 1. 🖥️ Editor Visual Split-Pane com Monaco
- Editor de código profissional (o mesmo do VS Code) com syntax highlighting e autocompletar.
- **Preview em tempo real**: edite o código e veja a página renderizada ao lado.
- Modos de visualização flexíveis: **Código**, **Preview** ou **Split**.
- Seletor de templates integrado para trocar o design com 1 clique.

### 2. 🧩 Injeção Inteligente de Formulários (`{{FORM_SLOT}}`)
- Insira a tag `{{FORM_SLOT}}` onde quiser dentro do seu HTML.
- O Vórtex+ renderiza o formulário responsivo, validado e integrado à esteira de leads.
- Suporta campos de texto, email, telefone/WhatsApp e número, com estilização via CSS nativo (`.vortex-form`).

### 3. 🎨 Identidade Visual & SEO de Links (OpenGraph)
- Personalize **Meta Título**, **Meta Descrição**, **Imagem de Capa (1200×630)** e **Favicon** para cada campanha.
- Preview do card social em tempo real dentro do painel para garantir links atraentes no WhatsApp e redes sociais.

### 4. 🌐 Domínios Customizados com Isolamento Total (Ultra)
- Use seu próprio subdomínio ou domínio via CNAME (ex: `campanha.meudominio.com.br`).
- **Segurança reforçada**: ao ativar o domínio customizado, os links padrões da Vórtex são desativados para evitar vazamentos da sua oferta.

### 5. 🏪 Ecossistema da Comunidade & Loja de Templates
- Publique seus melhores designs na **Loja de Templates** da comunidade.
- Sistema de curadoria e revisão: `PENDING_REVIEW` → `PUBLISHED` / `REJECTED`.
- Métricas sociais: contador de visualizações, curtidas e número de usos por outros membros.
- Perfil público de autor com bio, handle (`@seu-nome`) e links sociais.

### 6. 📱 Automação Profissional de WhatsApp (Plano Ultra)
- **Conexão via QR Code ou Código de Confirmação** com renovação automática.
- **Auto-Criação de Grupos**: provisione novos grupos automaticamente com foto, descrição e administradores pré-configurados.
- **Disparos em Massa (Broadcast)**: envie mensagens para múltiplos grupos de uma só vez, com relatórios de entrega e histórico de logs.
- **Sincronização de Membros**: verificação em tempo real de quais leads realmente entraram no grupo.

---

## 🛡️ ARQUITETURA & STACK TÉCNICA

Infraestrutura moderna e resiliente construída para alta concorrência:

```
src/
├── app/
│   ├── [slug]/                  # Renderizador público de landing pages (HTML estático + form)
│   ├── admin/                   # Painel Administrativo multi-tenant
│   │   ├── campaigns/           # Gestão de campanhas & grupos
│   │   ├── templates/           # Publicação, edição e métricas de templates
│   │   ├── whatsapp/            # Conexão, disparos em massa e logs
│   │   ├── settings/            # Perfil, cobrança (Asaas), conta e planos
│   │   └── docs/                # Documentação interna no AdminShell
│   ├── docs/                    # Documentação oficial pública (sem shell admin)
│   ├── templates/               # Loja pública de templates da comunidade
│   ├── community/               # Perfis públicos dos criadores de templates
│   └── privacy/                 # Política de Privacidade (LGPD, cookies, retenção)
├── components/
│   ├── admin/                   # Monaco Editor, CampaignSettingsModal, FieldTooltip, HelpFAB
│   ├── landing/                 # Componentes visuais da landing page (Aurora, Bento Grid)
│   └── templates/               # Cards de templates, likes, template picker
├── lib/
│   ├── auth.ts                  # Autenticação passwordless por código OTP
│   ├── session.ts               # Sessão criptografada JWT (jose) em cookie httpOnly
│   ├── rotator.ts               # Algoritmo de rotação de grupos via Redis
│   ├── template-sanitizer.ts    # Sanitização DOMPurify contra ataques XSS
│   ├── audit.ts                 # Trilha de auditoria administrativa
│   └── prisma.ts                # Conexão singleton Prisma com PostgreSQL
└── proxy.ts                     # Middleware de roteamento e segurança de domínios
```

### Tecnologias-Chave:
- **Core**: Next.js 16 (App Router, Server Components & Server Actions), TypeScript
- **Banco de Dados**: PostgreSQL 16 com Prisma ORM
- **Cache & Rate Limiting**: Redis (Upstash / ioredis) para rotacionador e OTPs
- **Editor**: `@monaco-editor/react` (Monaco Editor)
- **Segurança**: DOMPurify, Rate Limiting por IP, JWT HS256, Cloudflare Worker Proxy
- **Pagamentos**: Gateway Asaas (Assinaturas, PIX, Cartão)
- **Email Transacional**: Resend API

---

## 💰 PLANOS & LIMITES

| Recurso | **Starter (Grátis)** | **Validador Pro** | **Scale / Ultra** |
|---|:---:|:---:|:---:|
| **Investimento** | **R\$ 0** | **R\$ 97/mês** | **R\$ 157/mês** |
| Campanhas Ativas | 1 | 10 | **Ilimitadas** |
| Capacidade de Leads | 100 / mês | 10.000 / mês | **Ilimitados** |
| Grupos de WhatsApp | 3 | 50 | **Ilimitados** |
| Injeção `{{FORM_SLOT}}` | ✅ | ✅ | ✅ |
| SEO & OpenGraph Personalizado | ❌ | ✅ | ✅ |
| Domínio Customizado (CNAME) | ❌ | ✅ | ✅ |
| Automação & Rotação WhatsApp | ❌ | ❌ | ✅ |
| Disparos em Massa (Broadcast) | ❌ | ❌ | ✅ |
| Auto-Criação de Grupos | ❌ | ❌ | ✅ |
| Sem Marca Vórtex+ | ❌ | ✅ | ✅ |
| Suporte | Comunidade | Prioritário | Dedicado 24h |

---

## 🏁 INÍCIO RÁPIDO

### Pré-requisitos
- Node.js 20+
- Instância PostgreSQL ativa
- Instância Redis ativa

### Instalação

```bash
# 1. Clone o repositório
git clone https://github.com/yuriluisz/vortex.git
cd vortex

# 2. Instale as dependências
npm install

# 3. Configure as variáveis de ambiente
cp .env.example .env
# Preencha DATABASE_URL, REDIS_URL, JWT_SECRET, RESEND_API_KEY, etc.

# 4. Execute as migrations do Prisma
npx prisma migrate dev

# 5. Inicie o servidor de desenvolvimento
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000) para ver a landing page ou [http://localhost:3000/admin](http://localhost:3000/admin) para o painel.

---

## 📖 DOCUMENTAÇÃO

A plataforma conta com documentação completa em 18 capítulos:
- **Pública**: Acesse `/docs` para visualizar a documentação oficial da plataforma.
- **Painel**: Acesse `/admin/docs` dentro do painel para navegar com atalhos contextuais.
- **Ajuda Rápida**: Use o botão flutuante **HelpFAB** no canto inferior direito do painel ou os ícones de ajuda `(?)` ao lado de cada campo de formulário.

---

## 📄 LICENÇA

Distribuído sob a licença MIT. Consulte `LICENSE` para obter mais informações.

<br>

<p align="center">
  <img src="https://cdn.jsdelivr.net/gh/yuriluisz/vortex/public/Vortex%20Logo%20Only.svg" height="28" alt="Vórtex+">
  <br>
  <sub><b>Vórtex+</b> — Feito para validar rápido e escalar sem limites.</sub>
</p>
