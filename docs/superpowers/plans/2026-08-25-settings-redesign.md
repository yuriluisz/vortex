# Implementation Plan — Redesign Completo das Configurações do Sistema

**Topic:** Modernização visual e funcional das telas de Perfil, Segurança, Assinatura e Planos (`/admin/settings`).  
**Skills:** `/brainstorming`, `/writing-plans`, `/impeccable critique`, `/ponytail`.  

---

## 1. Mudanças Propostas

### 1. Header & Tabs de Configurações
- **`src/app/admin/settings/page.tsx`**: Ajustar container para `max-w-5xl`, polir header e banners de alerta.
- **`src/app/admin/settings/settings-tabs.tsx`**: Atualizar abas para o estilo pill moderno (`bg-primary text-primary-foreground` para ativo, com ícones alinhados).

### 2. Tela de Perfil & Segurança
- **`src/app/admin/settings/profile-form.tsx`**:
  - Card 1: Perfil & Identidade (avatar com gradiente, `@handle`, nome da empresa, nome de exibição, bio e switch de perfil público).
  - Card 2: Presença Online & Redes Sociais (Website, Instagram, YouTube, WhatsApp com ícones temáticos).
  - Card 3: Segurança & Acesso (Email atual e alteração de email com OTP).
  - Barra de ações inferior flutuante em dark glass.

### 3. Tela de Assinatura, Planos & Faturamento
- **`src/app/admin/settings/plan-selector.tsx`**:
  - Hero da Assinatura Atual com barra de progresso do ciclo e contagem de dias restantes.
  - Seção de Consumo de Recursos (KPI cards de Campanhas, Grupos e Leads com barras de progresso dinâmicas).
  - Card de Dados de Cobrança com grid estruturado de metadados fiscais e botão de edição.
  - Grid comparativo de Planos (Free, Pro com destaque "Mais Escolhido", e Ultra com recursos ilimitados).
- **`src/app/admin/settings/billing-modal.tsx`** e **`cancel-dialog.tsx`**:
  - Ajustar modais para dark glassmorphic styling com proteção `max-h-[90vh]` e `overflow-y-auto`.

---

## 2. Plano de Verificação
- `npx tsc --noEmit`
- `npm test`
- `npm run lint`
