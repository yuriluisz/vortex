"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { revalidatePath } from "next/cache";
import { logAudit } from "@/lib/audit";
import type { Plan } from "@/lib/prisma-types";
import { PLAN_LIMITS } from "@/lib/plans";

// ============================================================================
// SEGURANÇA: Apenas SUPER_ADMIN
// ============================================================================
async function requireSuperAdmin() {
  const session = await getSession();
  if (!session?.email || session.role !== "SUPER_ADMIN") {
    throw new Error("Acesso negado. Apenas Super Admin.");
  }
  return session;
}

// ============================================================================
// ALTERAR PLANO DO TENANT
// ============================================================================
export async function updateTenantPlanAction(
  tenantId: string,
  plan: Plan
) {
  const session = await requireSuperAdmin();

  const limits = PLAN_LIMITS[plan];

  await prisma.tenant.update({
    where: { id: tenantId },
    data: {
      plan,
      maxCampaigns: limits.maxCampaigns,
      maxGroups: limits.maxGroups,
      maxLeads: limits.maxLeads,
    },
  });

  await logAudit(
    "PLAN_CHANGED",
    { tenantId, plan },
    session.userId,
    tenantId
  );

  revalidatePath("/admin/super");
}

// ============================================================================
// ATIVAR/DESATIVAR TENANT
// ============================================================================
export async function toggleTenantActiveAction(
  tenantId: string,
  active: boolean
) {
  const session = await requireSuperAdmin();

  await prisma.tenant.update({
    where: { id: tenantId },
    data: { active },
  });

  await logAudit(
    "TENANT_SWITCHED",
    { tenantId, active },
    session.userId,
    tenantId
  );

  revalidatePath("/admin/super");
}

// ============================================================================
// ALTERAR ROLE DE USUÁRIO
// ============================================================================
export async function updateUserRoleAction(
  userId: string,
  role: "SUPER_ADMIN" | "ADMIN" | "MEMBER"
) {
  const session = await requireSuperAdmin();

  await prisma.user.update({
    where: { id: userId },
    data: { role },
  });

  await logAudit(
    "USER_INVITED",
    { userId, role, action: "role_changed" },
    session.userId,
    undefined
  );

  revalidatePath("/admin/super");
}
