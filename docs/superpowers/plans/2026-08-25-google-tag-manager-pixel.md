# Google Tag Manager (GTM) Pixel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar o suporte completo ao Google Tag Manager (GTM) por campanha no Vórtex, incluindo modelo de dados, validação, tela de configurações no Admin, injeção de script/noscript em páginas públicas e disparo de eventos padrão no `dataLayer`.

**Architecture:** O campo `gtmId` é armazenado no model `Campaign` do Prisma e configurado via `CampaignSettingsModal`. No runtime público, o componente `GoogleTagManager` (`src/components/GoogleTagManager.tsx`) injeta o contêiner GTM via `next/script` e `<noscript>`, disparando eventos `generate_lead` na submissão de formulários e `join_group` na página de redirecionamento.

**Tech Stack:** Next.js 16 (App Router, Server Actions), React 19, TypeScript 5, Prisma 7, Zod, TailwindCSS v4, Vitest 4.

## Global Constraints

- Seguir estritamente a disciplina **Ponytail**: código mínimo, reaproveitamento de padrões existentes (`MetaPixel.tsx`), sem dependências extras.
- Não quebrar ou alterar o comportamento do Meta Pixel existente (`pixelId`).
- Todos os arquivos editados devem passar em `npx tsc --noEmit`, `npm run lint` e `npm test`.

---

### Task 1: Prisma Schema & Migration

**Files:**
- Modify: `prisma/schema.prisma`
- Test: `npx prisma generate`

**Interfaces:**
- Produces: `Campaign.gtmId` (`String?`) no Prisma Client gerado.

- [ ] **Step 1: Adicionar campo `gtmId` no model `Campaign`**

No arquivo `prisma/schema.prisma`:
```prisma
model Campaign {
  id         String   @id @default(uuid())
  tenantId   String
  slug       String
  name       String
  rawHtml    String   @db.Text
  formSchema Json
  pixelId    String?
  gtmId      String?
  active     Boolean  @default(true)
  views      Int      @default(0)
  ...
```

- [ ] **Step 2: Executar geração do Prisma Client**

Executar: `npx prisma generate`  
Esperado: Sucesso gerando os tipos do Prisma Client com `gtmId`.

- [ ] **Step 3: Commit**

```bash
git add prisma/schema.prisma
git commit -m "feat(db): add gtmId to Campaign model"
```

---

### Task 2: Validação Zod e Server Actions

**Files:**
- Modify: `src/app/admin/actions.ts`
- Modify: `src/app/admin/super/actions.ts`
- Modify: `src/app/api/admin/campaign-detail/route.ts`
- Test: `src/tests/gtm-validation.test.ts`

**Interfaces:**
- Consumes: `Campaign.gtmId` do Prisma Client.
- Produces: `CampaignSchema` com validação e sanitização de `gtmId`, Server Actions salvando `gtmId`.

- [ ] **Step 1: Escrever teste de validação do GTM ID (TDD)**

Criar `src/tests/gtm-validation.test.ts`:
```ts
import { describe, it, expect } from "vitest";

function validateGtmId(id: string | null | undefined): string | null {
  if (!id) return null;
  const trimmed = id.trim().toUpperCase();
  if (!/^GTM-[A-Z0-9]+$/.test(trimmed)) {
    throw new Error("Invalid GTM ID format");
  }
  return trimmed;
}

describe("GTM ID Validation", () => {
  it("accepts valid GTM IDs", () => {
    expect(validateGtmId("GTM-ABC1234")).toBe("GTM-ABC1234");
    expect(validateGtmId("gtm-xyz999")).toBe("GTM-XYZ999");
    expect(validateGtmId(" GTM-K893J4  ")).toBe("GTM-K893J4");
  });

  it("handles null or undefined or empty string", () => {
    expect(validateGtmId(null)).toBeNull();
    expect(validateGtmId(undefined)).toBeNull();
    expect(validateGtmId("")).toBeNull();
  });

  it("rejects invalid GTM IDs", () => {
    expect(() => validateGtmId("123456")).toThrow();
    expect(() => validateGtmId("<script>alert(1)</script>")).toThrow();
    expect(() => validateGtmId("GTM-")).toThrow();
    expect(() => validateGtmId("GTM-abc!@#")).toThrow();
  });
});
```

- [ ] **Step 2: Executar teste para verificar aprovação dos casos**

Executar: `npm test src/tests/gtm-validation.test.ts`  
Esperado: PASS.

- [ ] **Step 3: Atualizar `CampaignSchema` e Server Actions**

Em `src/app/admin/actions.ts`:
- Adicionar `gtmId: z.string().trim().toUpperCase().regex(/^GTM-[A-Z0-9]+$/, "Formato de Google Tag Manager ID inválido (deve ser GTM-XXXXXXX)").optional().or(z.literal("")).nullable().transform((v) => v || undefined)` ao `CampaignSchema`.
- Em `createCampaignAction`: extrair `gtmId: formData.get("gtmId") || undefined` e passar para `prisma.campaign.create`.
- Em `updateCampaignAction`: extrair `gtmId: formData.get("gtmId") || undefined` e passar para `prisma.campaign.update`.
- Em `saveCampaignSettingsAction`: incluir `gtmId` nos campos atualizados.

Em `src/app/admin/super/actions.ts`:
- Incluir `gtmId` no `SuperCampaignSchema` e na mutação de campanha.

Em `src/app/api/admin/campaign-detail/route.ts`:
- Incluir `gtmId: true` no `select` do Prisma.

- [ ] **Step 4: Verificar typecheck**

Executar: `npx tsc --noEmit`  
Esperado: PASS com 0 erros de tipagem.

- [ ] **Step 5: Commit**

```bash
git add src/app/admin/actions.ts src/app/admin/super/actions.ts src/app/api/admin/campaign-detail/route.ts src/tests/gtm-validation.test.ts
git commit -m "feat(backend): add gtmId validation and server actions support"
```

---

### Task 3: Componente `GoogleTagManager`

**Files:**
- Create: `src/components/GoogleTagManager.tsx`
- Test: `src/tests/GoogleTagManager.test.tsx`

**Interfaces:**
- Produces: `<GoogleTagManager gtmId={string | null | undefined} trackEvent={...} redirectUrl={...} />`

- [ ] **Step 1: Escrever teste de renderização do componente GoogleTagManager**

Criar `src/tests/GoogleTagManager.test.tsx`:
```tsx
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import GoogleTagManager from "@/components/GoogleTagManager";

describe("GoogleTagManager Component", () => {
  it("renders nothing when gtmId is null or empty", () => {
    const { container } = render(<GoogleTagManager gtmId={null} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders noscript iframe when gtmId is valid", () => {
    const { container } = render(<GoogleTagManager gtmId="GTM-TEST123" />);
    const iframe = container.querySelector("noscript iframe");
    expect(iframe).not.toBeNull();
    expect(iframe?.getAttribute("src")).toContain("id=GTM-TEST123");
  });
});
```

- [ ] **Step 2: Implementar `src/components/GoogleTagManager.tsx`**

```tsx
"use client";

import Script from "next/script";
import { useEffect, useRef } from "react";

interface GoogleTagManagerProps {
  gtmId: string | null | undefined;
  trackEvent?: "generate_lead" | "join_group" | "page_view";
  eventParams?: Record<string, unknown>;
  redirectUrl?: string;
}

export default function GoogleTagManager({
  gtmId,
  trackEvent,
  eventParams,
  redirectUrl,
}: GoogleTagManagerProps) {
  const eventFired = useRef(false);

  const cleanId = gtmId ? gtmId.trim().toUpperCase() : null;
  const isValid = Boolean(cleanId && /^GTM-[A-Z0-9]+$/.test(cleanId));

  useEffect(() => {
    if (!isValid || eventFired.current) return;
    if (!trackEvent && !redirectUrl) return;

    eventFired.current = true;

    const run = () => {
      const w = window as unknown as { dataLayer?: Array<Record<string, unknown>> };
      w.dataLayer = w.dataLayer || [];

      if (trackEvent) {
        w.dataLayer.push({
          event: trackEvent,
          ...eventParams,
        });
      }

      if (redirectUrl) {
        setTimeout(() => {
          window.location.href = redirectUrl;
        }, 300);
      }
    };

    run();
  }, [isValid, trackEvent, eventParams, redirectUrl]);

  if (!isValid || !cleanId) {
    return null;
  }

  return (
    <>
      <Script
        id="google-tag-manager"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','${cleanId}');
          `,
        }}
      />
      <noscript>
        <iframe
          src={`https://www.googletagmanager.com/ns.html?id=${cleanId}`}
          height="0"
          width="0"
          style={{ display: "none", visibility: "hidden" }}
        />
      </noscript>
    </>
  );
}
```

- [ ] **Step 3: Executar teste do componente**

Executar: `npm test src/tests/GoogleTagManager.test.tsx`  
Esperado: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/components/GoogleTagManager.tsx src/tests/GoogleTagManager.test.tsx
git commit -m "feat(tracking): create GoogleTagManager injection component"
```

---

### Task 4: Telas de Configuração no Admin UI

**Files:**
- Modify: `src/components/admin/campaign-settings-modal.tsx`
- Modify: `src/components/admin/campaign-editor.tsx`
- Modify: `src/app/admin/super/TenantCard.tsx`
- Modify: `src/app/docs/page.tsx`
- Modify: `src/app/admin/docs/page.tsx`

**Interfaces:**
- Consumes: `CampaignSettings.gtmId`
- Produces: UI para inserir e salvar o GTM ID no painel do usuário e super admin.

- [ ] **Step 1: Atualizar `CampaignSettingsModal`**

- Adicionar `gtmId: string;` na interface `CampaignSettings`.
- Na aba `renderGeneral`, adicionar o campo de input para Google Tag Manager ID ao lado do Meta Pixel ID com `FieldTooltip` e âncora `docsAnchor="campo-gtm"`.

- [ ] **Step 2: Atualizar `CampaignEditor`**

- Incluir `gtmId: campaign?.gtmId || ""` no estado inicial e nos payloads de salvamento.

- [ ] **Step 3: Atualizar `TenantCard` (Super Admin)**

- Incluir campo de input para `gtmId` no formulário de edição rápida de campanha.

- [ ] **Step 4: Atualizar Documentação do Usuário**

- Em `src/app/docs/page.tsx` e `src/app/admin/docs/page.tsx`: adicionar documentação do campo `#campo-gtm` explicando o funcionamento e os eventos enviados (`generate_lead`, `join_group`).

- [ ] **Step 5: Executar typecheck e lint**

Executar: `npx tsc --noEmit && npm run lint`  
Esperado: 0 erros e 0 warnings.

- [ ] **Step 6: Commit**

```bash
git add src/components/admin/campaign-settings-modal.tsx src/components/admin/campaign-editor.tsx src/app/admin/super/TenantCard.tsx src/app/docs/page.tsx src/app/admin/docs/page.tsx
git commit -m "feat(ui): add Google Tag Manager ID input to campaign settings and docs"
```

---

### Task 5: Injeção de Runtime e Disparo de Eventos no `dataLayer`

**Files:**
- Modify: `src/app/[slug]/page.tsx`
- Modify: `src/app/[slug]/redirect/page.tsx`
- Modify: `src/app/c/[code]/page.tsx`
- Modify: `src/app/c/[code]/redirect/page.tsx`
- Modify: `src/app/custom-domain/[hostname]/page.tsx`
- Modify: `src/app/custom-domain/[hostname]/redirect/page.tsx`
- Modify: `src/app/[slug]/DynamicForm.tsx`
- Modify: `src/app/[slug]/HtmlRenderer.tsx`

**Interfaces:**
- Consumes: `<GoogleTagManager gtmId={campaign.gtmId} />`
- Produces: Injeção do contêiner nas páginas e disparo de `generate_lead` no formulário.

- [ ] **Step 1: Injetar nas páginas de captura padrão e protegidas**

- Em `src/app/[slug]/page.tsx`, `src/app/c/[code]/page.tsx`, `src/app/custom-domain/[hostname]/page.tsx`:
  - Incluir `gtmId` no `select`/`findFirst` da query do Prisma.
  - Renderizar `<GoogleTagManager gtmId={campaign.gtmId} />` ao lado do `<MetaPixel />`.

- [ ] **Step 2: Injetar nas páginas de redirecionamento**

- Em `src/app/[slug]/redirect/page.tsx`, `src/app/c/[code]/redirect/page.tsx`, `src/app/custom-domain/[hostname]/redirect/page.tsx`:
  - Incluir `gtmId` no `select` do Prisma.
  - Renderizar `<GoogleTagManager gtmId={campaign.gtmId} trackEvent="join_group" redirectUrl={group?.url} />`.

- [ ] **Step 3: Disparar evento `generate_lead` nos formulários**

- Em `src/app/[slug]/DynamicForm.tsx` e `src/app/[slug]/HtmlRenderer.tsx` (`CustomForm`):
  - No `handleSubmit`, adicionar o disparo seguro para o `dataLayer`:
    ```ts
    try {
      const w = window as unknown as { dataLayer?: Array<Record<string, unknown>> };
      w.dataLayer = w.dataLayer || [];
      w.dataLayer.push({
        event: "generate_lead",
        campaign_id: campaignId,
        campaign_slug: slug,
      });
    } catch {}
    ```

- [ ] **Step 4: Executar typecheck e lint**

Executar: `npx tsc --noEmit && npm run lint`  
Esperado: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/[slug]/page.tsx src/app/[slug]/redirect/page.tsx src/app/c/[code]/page.tsx src/app/c/[code]/redirect/page.tsx src/app/custom-domain/[hostname]/page.tsx src/app/custom-domain/[hostname]/redirect/page.tsx src/app/[slug]/DynamicForm.tsx src/app/[slug]/HtmlRenderer.tsx
git commit -m "feat(tracking): integrate GTM runtime and dataLayer event dispatching"
```

---

### Task 6: Bateria de Verificação de Qualidade (Quality Gate)

**Files:**
- Test: All tests in `src/tests/`

- [ ] **Step 1: Executar suíte de testes unitários**

Executar: `npm test`  
Esperado: Todos os testes passando com 100% de sucesso.

- [ ] **Step 2: Executar validação de tipos TypeScript**

Executar: `npx tsc --noEmit`  
Esperado: 0 erros de tipagem.

- [ ] **Step 3: Executar ESLint**

Executar: `npm run lint`  
Esperado: 0 erros ou warnings de lint.

- [ ] **Step 4: Executar Build de Produção do Next.js**

Executar: `npm run build`  
Esperado: Build concluído com sucesso gerando todas as rotas estáticas e dinâmicas.

- [ ] **Step 5: Commit final**

```bash
git commit --allow-empty -m "chore: quality gates verified for google tag manager integration"
```
