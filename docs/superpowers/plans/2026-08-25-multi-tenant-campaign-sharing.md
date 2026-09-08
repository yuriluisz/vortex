# Multi-Tenant Workspaces & Campaign Sharing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar o sistema de compartilhamento granular de campanhas para gestores de tráfego e suporte a múltiplos workspaces com alternador (tenant switcher) e membros de equipe no Vórtex.

**Architecture:** Modelos `TenantMember` e `CampaignShare` no Prisma. Guard centralizado `requireCampaignAccess` em `src/lib/permissions.ts`. Componente `TenantSwitcher` no topo da sidebar e abas "Minhas Campanhas" / "Compartilhadas Comigo" em `/admin/campaigns`.

**Tech Stack:** Next.js 16, React 19, TypeScript 5, Prisma 7, PostgreSQL, Jose (JWT), Resend (E-mails de convite), TailwindCSS v4, Lucide React, Vitest.

## Global Constraints

- Seguir estritamente a disciplina **Ponytail**: código enxuto, sem dependências extras, reutilizando utilitários nativos e templates de e-mail existentes.
- Garantir segurança rigorosa em todas as Server Actions e queries (RBAC multi-tenant).
- Não permitir que convidados excluam campanhas do dono original.
- Todos os passos devem passar no `vortex-quality-gate` (`tsc`, `lint`, `test`, `build`).

---

### Task 1: Prisma Schema & Database Models

**Files:**
- Modify: `prisma/schema.prisma`
- Test: `npx prisma db push && npx prisma generate`

**Interfaces:**
- Produces: `TenantMember`, `CampaignShare`, `CampaignPermission` no Prisma Client.

- [ ] **Step 1: Adicionar modelos no `prisma/schema.prisma`**

```prisma
enum CampaignPermission {
  VIEW
  EDIT
}

model TenantMember {
  id        String       @id @default(uuid())
  tenantId  String
  userId    String
  role      UserRoleExpr @default(MEMBER)
  createdAt DateTime     @default(now())

  tenant    Tenant       @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  user      User         @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([tenantId, userId])
  @@index([userId])
  @@index([tenantId])
}

model CampaignShare {
  id         String             @id @default(uuid())
  campaignId String
  userId     String?
  email      String
  permission CampaignPermission @default(VIEW)
  token      String?            @unique
  accepted   Boolean            @default(false)
  createdAt  DateTime           @default(now())

  campaign   Campaign           @relation(fields: [campaignId], references: [id], onDelete: Cascade)
  user       User?              @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([campaignId, email])
  @@index([userId])
  @@index([email])
}
```

Atualizar relações nos models `Tenant`, `User` e `Campaign`.

- [ ] **Step 2: Sincronizar banco e gerar Prisma Client**

Executar: `npx prisma db push && npx prisma generate`  
Esperado: Banco de dados sincronizado e Prisma Client gerado com sucesso.

- [ ] **Step 3: Commit**

```bash
git add prisma/schema.prisma
git commit -m "feat(db): add TenantMember and CampaignShare models"
```

---

### Task 2: Sistema de Permissões e RBAC (`src/lib/permissions.ts`)

**Files:**
- Create: `src/lib/permissions.ts`
- Test: `src/tests/permissions.test.ts`

**Interfaces:**
- Produces: `requireCampaignAccess`, `getUserAccessibleTenants`, `getUserAccessibleCampaigns`.

- [ ] **Step 1: Escrever teste unitário de permissões (TDD)**

Criar `src/tests/permissions.test.ts` testando regras de autorização para:
- Dono da conta (acesso total).
- Membro da equipe (acesso total do workspace).
- Gestor convidado com `EDIT` (pode editar pixels/HTML, mas não deletar).
- Visualizador convidado com `VIEW` (somente leitura).
- Usuário sem relação (acesso negado).

- [ ] **Step 2: Implementar `src/lib/permissions.ts`**

```ts
export type CampaignAccessRole = "OWNER" | "MEMBER" | "SHARED_EDITOR" | "SHARED_VIEWER";

export async function checkCampaignAccess(
  campaignId: string,
  userId: string,
  userTenantId: string | null
): Promise<{
  allowed: boolean;
  role: CampaignAccessRole | null;
  canEdit: boolean;
  canDelete: boolean;
}>
```

- [ ] **Step 3: Executar testes de permissão**

Executar: `npm test src/tests/permissions.test.ts`  
Esperado: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/lib/permissions.ts src/tests/permissions.test.ts
git commit -m "feat(auth): implement granular campaign and tenant permission checks"
```

---

### Task 3: Server Actions de Compartilhamento e Membros

**Files:**
- Create: `src/app/admin/campaign-share-actions.ts`
- Create: `src/app/admin/team-actions.ts`

**Interfaces:**
- Produces: `shareCampaignAction`, `revokeCampaignShareAction`, `inviteTeamMemberAction`, `removeTeamMemberAction`, `switchActiveTenantAction`.

- [ ] **Step 1: Implementar `src/app/admin/campaign-share-actions.ts`**

- `shareCampaignAction(campaignId, email, permission)`: Valida permissão do dono, busca usuário ou cria token de convite, insere `CampaignShare` e envia e-mail com Resend.
- `revokeCampaignShareAction(shareId)`: Remove `CampaignShare`.
- `getCampaignSharesAction(campaignId)`: Lista convidados da campanha.

- [ ] **Step 2: Implementar `src/app/admin/team-actions.ts`**

- `inviteTeamMemberAction(email, role)`: Adiciona `TenantMember` e envia e-mail.
- `removeTeamMemberAction(memberId)`: Remove `TenantMember` (impede remoção do dono).
- `getTeamMembersAction()`: Lista membros da equipe.
- `switchActiveTenantAction(targetTenantId)`: Executa `switchTenantSession` e redireciona.

- [ ] **Step 3: Commit**

```bash
git add src/app/admin/campaign-share-actions.ts src/app/admin/team-actions.ts
git commit -m "feat(actions): add campaign sharing and team management server actions"
```

---

### Task 4: Workspace Switcher na Sidebar

**Files:**
- Create: `src/components/admin/tenant-switcher.tsx`
- Modify: `src/components/admin/admin-shell.tsx`

**Interfaces:**
- Produces: Dropdown de seleção de workspace no topo da barra lateral esquerda.

- [ ] **Step 1: Criar componente `TenantSwitcher`**

Renderiza o nome do tenant atual, badge do plano e dropdown com lista de tenants acessíveis e botão de troca com 1 clique.

- [ ] **Step 2: Integrar `TenantSwitcher` no `admin-shell.tsx`**

Posicionar no topo da sidebar de desktop e mobile.

- [ ] **Step 3: Commit**

```bash
git add src/components/admin/tenant-switcher.tsx src/components/admin/admin-shell.tsx
git commit -m "feat(ui): add TenantSwitcher dropdown to admin sidebar"
```

---

### Task 5: Modal de Compartilhamento & Abas em `/admin/campaigns`

**Files:**
- Create: `src/components/admin/campaign-share-modal.tsx`
- Modify: `src/app/admin/campaigns/page.tsx`
- Modify: `src/components/admin/campaign-card.tsx`

**Interfaces:**
- Produces: Abas "Minhas Campanhas" e "Compartilhadas Comigo", botão de compartilhar campanhas.

- [ ] **Step 1: Criar `CampaignShareModal`**

Modal com input de e-mail, seletor de permissão (Visualizador / Gestor), lista de acessos ativos e botão de revogação.

- [ ] **Step 2: Atualizar `/admin/campaigns/page.tsx`**

- Buscar tanto as campanhas do Tenant ativo quanto as campanhas com `CampaignShare` para o `userId` ou `userEmail`.
- Renderizar abas com contador: `Minhas Campanhas (X)` e `Compartilhadas Comigo (Y)`.
- No card de campanhas compartilhadas: exibir badge de dono e badge de papel (`Gestor` ou `Visualizador`).

- [ ] **Step 3: Commit**

```bash
git add src/components/admin/campaign-share-modal.tsx src/app/admin/campaigns/page.tsx
git commit -m "feat(ui): add CampaignShareModal and shared campaigns tab"
```

---

### Task 6: Gerenciamento de Equipe em Configurações (`/admin/settings`)

**Files:**
- Create: `src/components/admin/team-settings-tab.tsx`
- Modify: `src/app/admin/settings/page.tsx`

**Interfaces:**
- Produces: Aba "Equipe" no painel de configurações do usuário.

- [ ] **Step 1: Criar `TeamSettingsTab`**

- Exibe lista de membros do workspace atual com avatars, e-mail, papel (`ADMIN` / `MEMBER`) e data de entrada.
- Formulário para convidar novo membro.
- Botão para remover membro da equipe.

- [ ] **Step 2: Integrar aba em `src/app/admin/settings/page.tsx`**

- [ ] **Step 3: Commit**

```bash
git add src/components/admin/team-settings-tab.tsx src/app/admin/settings/page.tsx
git commit -m "feat(ui): add team management tab in settings"
```

---

### Task 7: Página de Aceite de Convite (`/accept-invite`)

**Files:**
- Create: `src/app/accept-invite/page.tsx`
- Create: `src/app/accept-invite/actions.ts`

**Interfaces:**
- Produces: Onboarding seguro para convidados que ainda não têm conta no Vórtex.

- [ ] **Step 1: Implementar rota e formulário de onboarding**

- Valida o token do convite.
- Se o usuário já tiver conta, confirma e redireciona.
- Se for novo usuário, solicita Nome e Senha, cria o usuário, marca o convite como aceito e autentica na sessão.

- [ ] **Step 2: Commit**

```bash
git add src/app/accept-invite/page.tsx src/app/accept-invite/actions.ts
git commit -m "feat(auth): create invitation acceptance and guest onboarding page"
```

---

### Task 8: Bateria de Verificação de Qualidade (Quality Gate)

**Files:**
- Test: All suites

- [ ] **Step 1: Executar `npm test`**
- [ ] **Step 2: Executar `npx tsc --noEmit`**
- [ ] **Step 3: Executar `npm run lint`**
- [ ] **Step 4: Executar `npm run build`**
- [ ] **Step 5: Commit final**
