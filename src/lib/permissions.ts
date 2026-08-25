import "server-only";

import { prisma } from "@/lib/prisma";

export type CampaignAccessRole = "OWNER" | "MEMBER" | "SHARED_EDITOR" | "SHARED_VIEWER";

export interface CampaignAccessResult {
  allowed: boolean;
  role: CampaignAccessRole | null;
  canEdit: boolean;
  canDelete: boolean;
  campaign: {
    id: string;
    name: string;
    slug: string;
    tenantId: string;
  } | null;
}

/**
 * Valida os direitos de acesso de um usuário a uma campanha específica.
 *
 * Hierarquia de permissões:
 * 1. OWNER: Dono do Tenant onde a campanha foi criada (pode ver, editar e deletar).
 * 2. MEMBER: Membro da equipe do Tenant (pode ver, editar, mas NÃO deletar).
 * 3. SHARED_EDITOR: Gestor com acesso compartilhado de Edição (pode ver, editar pixels/HTML/grupos, mas NÃO deletar).
 * 4. SHARED_VIEWER: Convidado com acesso de Visualização (somente leitura de dashboard, leads e grupos).
 */
export async function checkCampaignAccess(
  campaignId: string,
  userId: string,
  userTenantId?: string | null
): Promise<CampaignAccessResult> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, tenantId: true, role: true },
  });

  if (!user) {
    return { allowed: false, role: null, canEdit: false, canDelete: false, campaign: null };
  }

  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    select: {
      id: true,
      name: true,
      slug: true,
      tenantId: true,
      tenant: { select: { id: true, name: true, slug: true } },
    },
  });

  if (!campaign) {
    return { allowed: false, role: null, canEdit: false, canDelete: false, campaign: null };
  }

  // 1. Dono direto do Tenant da campanha
  const effectiveTenantId = userTenantId || user.tenantId;
  if (effectiveTenantId && campaign.tenantId === effectiveTenantId) {
    return {
      allowed: true,
      role: "OWNER",
      canEdit: true,
      canDelete: true,
      campaign,
    };
  }

  // 2. Membro da equipe do Tenant via TenantMember
  const tenantMembership = await prisma.tenantMember.findUnique({
    where: {
      tenantId_userId: {
        tenantId: campaign.tenantId,
        userId: user.id,
      },
    },
  });

  if (tenantMembership) {
    return {
      allowed: true,
      role: "MEMBER",
      canEdit: true,
      canDelete: tenantMembership.role === "ADMIN",
      campaign,
    };
  }

  // 3. Compartilhamento individual da Campanha via CampaignShare
  const campaignShare = await prisma.campaignShare.findFirst({
    where: {
      campaignId: campaign.id,
      OR: [
        { userId: user.id },
        { email: { equals: user.email, mode: "insensitive" } },
      ],
    },
  });

  if (campaignShare) {
    const isEditor = campaignShare.permission === "EDIT";
    return {
      allowed: true,
      role: isEditor ? "SHARED_EDITOR" : "SHARED_VIEWER",
      canEdit: isEditor,
      canDelete: false,
      campaign,
    };
  }

  return { allowed: false, role: null, canEdit: false, canDelete: false, campaign: null };
}

export interface AccessibleTenant {
  tenantId: string;
  name: string;
  slug: string;
  plan: string;
  role: "OWNER" | "ADMIN" | "MEMBER";
  isPrimary: boolean;
}

/**
 * Retorna todos os workspaces / tenants aos quais o usuário tem acesso.
 */
export async function getUserAccessibleTenants(userId: string): Promise<AccessibleTenant[]> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      tenant: true,
      tenantMemberships: {
        include: {
          tenant: true,
        },
      },
    },
  });

  if (!user) return [];

  const results: AccessibleTenant[] = [];
  const seenIds = new Set<string>();

  // 1. Workspace Próprio / Primário
  if (user.tenant && user.tenant.active) {
    seenIds.add(user.tenant.id);
    results.push({
      tenantId: user.tenant.id,
      name: user.tenant.name,
      slug: user.tenant.slug,
      plan: user.tenant.plan,
      role: "OWNER",
      isPrimary: true,
    });
  }

  // 2. Workspaces como Membro da Equipe
  for (const membership of user.tenantMemberships) {
    if (membership.tenant && membership.tenant.active && !seenIds.has(membership.tenant.id)) {
      seenIds.add(membership.tenant.id);
      results.push({
        tenantId: membership.tenant.id,
        name: membership.tenant.name,
        slug: membership.tenant.slug,
        plan: membership.tenant.plan,
        role: membership.role as "ADMIN" | "MEMBER",
        isPrimary: false,
      });
    }
  }

  return results;
}
