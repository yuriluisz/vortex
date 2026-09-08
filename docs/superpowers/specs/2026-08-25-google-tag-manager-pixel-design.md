# Design Doc — Google Tag Manager (GTM) Pixel Tracking

> **Status:** Approved  
> **Date:** 2026-08-25  
> **Author:** Antigravity (Ponytail Senior Architecture)  
> **Feature:** Google Tag Manager container injection & standard event tracking per campaign

---

## 1. Overview & Business Value

O Vórtex atualmente oferece rastreamento nativo através do Meta Pixel ID (`pixelId`), permitindo aos clientes mensurarem conversões e pageviews em anúncios no Facebook/Instagram.

Esta especificação define a adição do **Google Tag Manager (GTM)** por campanha, permitindo aos usuários do Vórtex:
- Injetar seu container GTM (`GTM-XXXXXXX`) nas páginas de captura públicas e páginas de redirecionamento para grupos.
- Enviar eventos estruturados padrão para o `window.dataLayer` (`pageview`, `generate_lead`, `join_group`).
- Centralizar o disparo de tags de Google Ads, Google Analytics 4 (GA4), TikTok Ads, Pinterest Ads e scripts personalizados através de um único contêiner GTM sem mexer no código do Vórtex.

---

## 2. Architecture & Data Flow

```mermaid
flowchart TD
    Admin[Admin / Criador da Campanha] -->|Configura GTM-XXXXXXX| Modal[Campaign Settings Modal]
    Modal -->|Salva gtmId| DB[(PostgreSQL / Prisma Campaign)]

    Visitor[Visitante] -->|Acessa Página de Captura| CapturePage[Página de Captura / [slug]]
    CapturePage -->|Injeta Script & Noscript| GTMComponent[GoogleTagManager Component]
    GTMComponent -->|Inicializa| DataLayer[window.dataLayer]
    
    Visitor -->|Preenche & Envia Formulário| Form[DynamicForm / CustomForm]
    Form -->|Dispara Evento| LeadEvent[dataLayer.push generate_lead]
    Form -->|Redirect| RedirPage[Página de Redirecionamento /redirect]
    
    RedirPage -->|Dispara Evento| JoinEvent[dataLayer.push join_group]
    RedirPage -->|Redireciona| WhatsApp[Grupo de WhatsApp]
```

---

## 3. Data Model & Backend Changes

### 3.1 Prisma Schema (`prisma/schema.prisma`)
Adição do campo opcional `gtmId` no model `Campaign`:
```prisma
model Campaign {
  id         String   @id @default(uuid())
  tenantId   String
  slug       String
  name       String
  rawHtml    String   @db.Text
  formSchema Json
  pixelId    String?
  gtmId      String?  // Google Tag Manager Container ID (ex: "GTM-XXXXXXX")
  active     Boolean  @default(true)
  ...
}
```

### 3.2 Zod Validation & Server Actions (`src/app/admin/actions.ts` & `src/app/admin/super/actions.ts`)
- **Regra de Validação:**
  ```ts
  gtmId: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^GTM-[A-Z0-9]+$/, "Formato de Google Tag Manager ID inválido (deve ser GTM-XXXXXXX)")
    .optional()
    .or(z.literal(""))
    .nullable()
    .transform((val) => val || null)
  ```
- **Ações Atualizadas:**
  - `createCampaignAction`: Recebe `gtmId` e persiste no banco.
  - `updateCampaignAction`: Atualiza `gtmId` no banco.
  - `updateCampaignBySuperAction`: Permite Super Admin editar `gtmId`.
  - `GET /api/admin/campaign-detail`: Retorna `gtmId` na consulta detalhada da campanha.

---

## 4. Frontend & Admin UI

### 4.1 Modal de Configurações (`src/components/admin/campaign-settings-modal.tsx`)
- Interface `CampaignSettings` expandida com `gtmId: string`.
- Na aba **Geral**, o campo é renderizado no mesmo grid do `Meta Pixel ID`:
  - Rótulo: `Google Tag Manager ID`
  - Tooltip: `FieldTooltip` com ajuda contextual e âncora `docsAnchor="campo-gtm"`.
  - Placeholder: `Ex: GTM-XXXXXXX`.
  - Autoformatação para caixa alta e sem espaços em branco.

### 4.2 Editor de Campanhas (`src/components/admin/campaign-editor.tsx`)
- Estado inicial e payload de salvamento incluem `gtmId`.

### 4.3 Super Admin (`src/app/admin/super/TenantCard.tsx`)
- Campo `gtmId` adicionado no formulário de edição rápida de campanha.

### 4.4 Central de Ajuda & Documentação (`src/app/docs/page.tsx` e `src/app/admin/docs/page.tsx`)
- Adicionada seção documentando o `Google Tag Manager ID` com os eventos disparados (`generate_lead`, `join_group`).

---

## 5. Runtime & Event Tracking

### 5.1 Componente `src/components/GoogleTagManager.tsx`
- **Validação de ID:** Verifica se o `gtmId` é válido (`/^GTM-[A-Z0-9]+$/i`).
- **Injeção de Script:**
  Usa `next/script` com `strategy="afterInteractive"`.
- **Injeção de `<noscript>`:**
  ```html
  <noscript>
    <iframe src="https://www.googletagmanager.com/ns.html?id=${gtmId}" height="0" width="0" style="display:none;visibility:hidden"></iframe>
  </noscript>
  ```
- **Disparo de Eventos:**
  - Suporta `trackEvent` opcional ("generate_lead" | "join_group").
  - Suporta `redirectUrl` com timeout de segurança (300ms) para garantir o envio antes do redirecionamento.

### 5.2 Injeção nas Rotas Públicas
O `<GoogleTagManager gtmId={campaign.gtmId} />` é incluído em:
1. `src/app/[slug]/page.tsx`
2. `src/app/[slug]/redirect/page.tsx` (com `trackEvent="join_group"` e `redirectUrl={group?.url}`)
3. `src/app/c/[code]/page.tsx`
4. `src/app/c/[code]/redirect/page.tsx`
5. `src/app/custom-domain/[hostname]/page.tsx`
6. `src/app/custom-domain/[hostname]/redirect/page.tsx`

### 5.3 Evento de Conversão no Formulário (`DynamicForm.tsx` & `HtmlRenderer.tsx`)
Ao enviar o formulário, dispara no `dataLayer`:
```ts
try {
  const w = window as unknown as { dataLayer?: Array<Record<string, unknown>> };
  w.dataLayer = w.dataLayer || [];
  w.dataLayer.push({
    event: "generate_lead",
    campaign_id: campaignId,
    campaign_slug: slug,
  });
} catch {
  // silencioso
}
```

---

## 6. Verification & Quality Gates

- **Unit Tests:** `src/tests/gtm.test.ts` (validação de regex, sanitização de ID, renderização condicional do script).
- **TypeScript:** `npx tsc --noEmit`
- **ESLint:** `npm run lint`
- **Vitest:** `npm test`
- **Build:** `npm run build`
