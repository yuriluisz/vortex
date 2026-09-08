# Especificação Técnica de Remediação de Segurança — Vortex

> **Data:** 28 de Agosto de 2026  
> **Status:** Aprovado para Implementação  
> **Metodologia:** Ponytail Discipline (Simplicidade, biblioteca padrão, zero boilerplate)

---

## 1. Contexto e Objetivos

A auditoria de segurança identificou pontos de melhoria e vulnerabilidades acionáveis em:
1. **Autenticação & Isolamento Tenant:** Fluxo de aceite de convites de campanha (`acceptInviteAction`).
2. **Autorização & IDOR:** Sincronização de grupos via WhatsApp API (`syncGroupAction`).
3. **Controle de Acesso por Função (RBAC):** Restrição de deleção para perfis `MEMBER`.
4. **Governança de Planos:** Publicação de templates (`publishTemplateAction`).
5. **Roteamento & Proxy:** Blindagem de fallback de Host em `src/proxy.ts`.
6. **Higienização de Inputs:** URLs de perfis sociais.

---

## 2. Decisões de Arquitetura (Ponytail Approach)

- **Sem novas dependências:** Utilizar apenas `bcryptjs`, `zod`, `jose` e helpers internos já existentes (`requireTenantOwnership`, `hasFeature`, `getSession`).
- **Guards no ponto central:** Aplicar validações diretamente nas Server Actions de entrada, garantindo que nenhum canal contorne as regras de negócio.
- **Fail-closed:** Qualquer divergência de propriedade de tenant, credencial inválida ou papel insuficiente resulta em rejeição imediata com erro descritivo.

---

## 3. Especificação Detalhada por Componente

### 3.1 `src/app/accept-invite/actions.ts`
- Se o usuário correspondente ao e-mail do convite já existir:
  - Validar a senha informada contra `user.passwordHash` via `bcrypt.compare`.
  - Se a senha for inválida e não houver sessão ativa do usuário, retornar erro amigável informando a necessidade da senha correta.
  - Se a senha for válida (ou se o usuário já estiver com sessão ativa), criar/manter a sessão e vincular o compartilhamento.

### 3.2 `src/app/admin/whatsapp/actions.ts`
- Inserir chamada de `requireTenantOwnership(prisma.group, groupId, tenantId, "Grupo")` logo no início de `syncGroupAction`.

### 3.3 `src/app/admin/campaigns/actions.ts` & `src/app/admin/campaigns/[id]/groups/actions.ts`
- Em `deleteCampaignAction`, `deleteGroupAction`, `toggleGroupStatusAction` e `updateGroupUrlAction`:
  - Verificar `if (role === "MEMBER") throw new Error("Apenas administradores possuem permissão para esta ação.");`.

### 3.4 `src/app/admin/templates/actions.ts`
- Em `publishTemplateAction`:
  - Checar `if (!hasFeature(session.plan, "publishTemplates")) throw new Error("A publicação de templates não está disponível no plano atual.");`.

### 3.5 `src/proxy.ts`
- Em ambiente de produção (`process.env.NODE_ENV === "production"`), só reescrever a requisição para domínios customizados se o cabeçalho secreto da Cloudflare (`x-vortex-secret`) for válido.

### 3.6 `src/app/admin/settings/profile-actions.ts` & `src/app/community/[handle]/page.tsx`
- Validar prefixo `^https?://` nas URLs de redes sociais.
- Normalizar números de WhatsApp para o formato numérico limpo antes de gerar links `https://wa.me/...`.
