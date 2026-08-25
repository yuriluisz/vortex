"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { revalidatePath } from "next/cache";
import { logAudit } from "@/lib/audit";
import type { Plan } from "@/lib/prisma-types";
import { PLAN_LIMITS } from "@/lib/plans";
import { enforceDowngrade } from "@/lib/subscription-guard";
import { sendEmail } from "@/lib/notifications";
import { updateTemplateStatus } from "@/services/template.service";
import { z } from "zod";

// ============================================================================
// SEGURANÇA: Apenas SUPER_ADMIN (validação dupla — middleware + server action)
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
export async function updateTenantPlanAction(tenantId: string, plan: Plan) {
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

  await logAudit("PLAN_CHANGED", { tenantId, plan }, session.userId, tenantId);
  revalidatePath("/admin/super");
}

// ============================================================================
// ATIVAR/DESATIVAR TENANT
// ============================================================================
export async function toggleTenantActiveAction(tenantId: string, active: boolean) {
  const session = await requireSuperAdmin();

  await prisma.tenant.update({
    where: { id: tenantId },
    data: { active },
  });

  await logAudit("TENANT_SWITCHED", { tenantId, active }, session.userId, tenantId);
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

// ============================================================================
// BLOQUEAR/DESBLOQUEAR USUÁRIO
// ============================================================================
export async function toggleUserBlockedAction(userId: string, blocked: boolean) {
  const session = await requireSuperAdmin();

  await prisma.user.update({
    where: { id: userId },
    data: { blocked },
  });

  await logAudit(
    "TENANT_UPDATED",
    { userId, blocked, action: "user_block_toggled" },
    session.userId,
    undefined
  );
  revalidatePath("/admin/super");
}

// ============================================================================
// CANCELAR PLANO DO TENANT (imediato)
// ============================================================================
export async function cancelTenantPlanAction(tenantId: string) {
  const session = await requireSuperAdmin();

  const freeLimits = PLAN_LIMITS["FREE"];

  await prisma.tenant.update({
    where: { id: tenantId },
    data: {
      plan: "FREE",
      subscriptionStatus: "CANCELED",
      asaasSubscriptionId: null,
      cancelAt: null,
      gracePeriodEnd: null,
      pendingPlan: null,
      currentPeriodEnd: null,
      downgradeReason: "CANCELAMENTO_VOLUNTARIO",
      maxCampaigns: freeLimits.maxCampaigns,
      maxGroups: freeLimits.maxGroups,
      maxLeads: freeLimits.maxLeads,
    },
  });

  // Aplicar downgrade nos recursos (desativa campanhas/grupos excedentes)
  await enforceDowngrade(tenantId, "FREE");

  await logAudit(
    "PLAN_CHANGED",
    { tenantId, plan: "FREE", reason: "super_admin_cancel" },
    session.userId,
    tenantId
  );
  revalidatePath("/admin/super");
}

// ============================================================================
// EXCLUIR CAMPANHA (super admin)
// ============================================================================
export async function deleteCampaignAction(campaignId: string) {
  const session = await requireSuperAdmin();

  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    select: { id: true, name: true, slug: true, tenantId: true },
  });

  if (!campaign) {
    throw new Error("Campanha não encontrada.");
  }

  await prisma.campaign.delete({ where: { id: campaignId } });

  await logAudit(
    "CAMPAIGN_DELETED",
    { campaignId, name: campaign.name, slug: campaign.slug, action: "deleted_by_super_admin" },
    session.userId,
    campaign.tenantId
  );
  revalidatePath("/admin/super");
}

// ============================================================================
// ENVIAR EMAIL PARA O TENANT (admin do tenant)
// ============================================================================
export async function sendTenantEmailAction(
  tenantId: string,
  subject: string,
  message: string
) {
  const session = await requireSuperAdmin();

  if (!subject.trim() || !message.trim()) {
    throw new Error("Assunto e mensagem são obrigatórios.");
  }

  // Buscar o primeiro admin do tenant
  const adminUser = await prisma.user.findFirst({
    where: { tenantId, role: "ADMIN" },
    select: { email: true, name: true },
  });

  if (!adminUser) {
    throw new Error("Nenhum administrador encontrado para este tenant.");
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { name: true, slug: true },
  });

  const result = await sendEmail({
    to: adminUser.email,
    subject: `[Vórtex+] ${subject}`,
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #0a0a0a; color: #e5e5e5; border-radius: 12px;">
        <h1 style="font-size: 20px; font-weight: 700; color: #ffffff;">Vórtex+ — Administração</h1>
        <p>Olá <strong>${adminUser.name || "Administrador"}</strong>,</p>
        <p style="background: #171717; border: 1px solid #262626; border-radius: 8px; padding: 16px; white-space: pre-wrap;">${message}</p>
        <hr style="border: none; border-top: 1px solid #262626; margin: 24px 0;" />
        <p style="font-size: 12px; color: #525252;">
          Tenant: ${tenant?.name || tenantId} (${tenant?.slug || tenantId})<br/>
          Esta é uma mensagem administrativa do Vórtex+.
        </p>
      </div>
    `,
  });

  await logAudit(
    "TENANT_UPDATED",
    { tenantId, subject, action: "email_sent_by_super_admin" },
    session.userId,
    tenantId
  );

  if (!result.success) {
    throw new Error(result.error || "Falha ao enviar email.");
  }
}

// ============================================================================
// ATIVAR/DESATIVAR CAMPANHA (super admin)
// ============================================================================
export async function toggleCampaignActiveAction(campaignId: string, active: boolean) {
  const session = await requireSuperAdmin();

  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    select: { id: true, name: true, slug: true, tenantId: true },
  });

  if (!campaign) {
    throw new Error("Campanha não encontrada.");
  }

  await prisma.campaign.update({
    where: { id: campaignId },
    data: { active },
  });

  await logAudit(
    "CAMPAIGN_UPDATED",
    { campaignId, name: campaign.name, slug: campaign.slug, active, action: "toggled_by_super_admin" },
    session.userId,
    campaign.tenantId
  );
  revalidatePath("/admin/super");
}

// ============================================================================
// MODERAR TEMPLATE (aprovar/rejeitar)
// ============================================================================
export async function moderateTemplateAction(
  templateId: string,
  action: "approve" | "reject",
  reason?: string
) {
  const session = await requireSuperAdmin();

  if (action === "reject" && !reason?.trim()) {
    throw new Error("Motivo de rejeição é obrigatório.");
  }

  await updateTemplateStatus(
    templateId,
    action === "approve" ? "PUBLISHED" : "REJECTED",
    session.userId,
    reason?.trim() || undefined
  );

  await logAudit(
    action === "approve" ? "TEMPLATE_APPROVED" : "TEMPLATE_REJECTED",
    { templateId, reason: reason?.trim() || null },
    session.userId,
    undefined
  );
  revalidatePath("/admin/super/templates");
}

// ============================================================================
// ENVIAR EMAIL PARA O AUTOR DO TEMPLATE
// ============================================================================
export async function sendTemplateAuthorEmailAction(
  templateId: string,
  subject: string,
  message: string
) {
  const session = await requireSuperAdmin();

  if (!subject.trim() || !message.trim()) {
    throw new Error("Assunto e mensagem são obrigatórios.");
  }

  const template = await prisma.template.findUnique({
    where: { id: templateId },
    include: {
      author: { select: { email: true, name: true } },
    },
  });

  if (!template) {
    throw new Error("Template não encontrado.");
  }

  const result = await sendEmail({
    to: template.author.email,
    subject: `[Vórtex+] ${subject}`,
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #0a0a0a; color: #e5e5e5; border-radius: 12px;">
        <h1 style="font-size: 20px; font-weight: 700; color: #ffffff;">Vórtex+ — Moderação de Template</h1>
        <p>Olá <strong>${template.author.name || "usuário"}</strong>,</p>
        <p>Em relação ao seu template <strong>${template.name}</strong>:</p>
        <p style="background: #171717; border: 1px solid #262626; border-radius: 8px; padding: 16px; white-space: pre-wrap;">${message}</p>
        <hr style="border: none; border-top: 1px solid #262626; margin: 24px 0;" />
        <p style="font-size: 12px; color: #525252;">
          Esta é uma mensagem administrativa do Vórtex+.
        </p>
      </div>
    `,
  });

  await logAudit(
    "TEMPLATE_REPORTED",
    { templateId, subject, action: "email_sent_to_author" },
    session.userId,
    template.tenantId ?? undefined
  );

  if (!result.success) {
    throw new Error(result.error || "Falha ao enviar email.");
  }
}

// ============================================================================
// REMOVER/RESTAURAR VISIBILIDADE DO TEMPLATE (TAKEN_DOWN ↔ PUBLISHED)
// ============================================================================
export async function toggleTemplateVisibilityAction(
  templateId: string,
  visible: boolean
) {
  const session = await requireSuperAdmin();

  const template = await prisma.template.findUnique({
    where: { id: templateId },
    select: { id: true, name: true, slug: true, tenantId: true },
  });

  if (!template) {
    throw new Error("Template não encontrado.");
  }

  const newStatus = visible ? "PUBLISHED" : "TAKEN_DOWN";

  await updateTemplateStatus(
    templateId,
    newStatus,
    session.userId,
    visible ? undefined : "Visibilidade removida pelo super admin."
  );

  await logAudit(
    visible ? "TEMPLATE_APPROVED" : "TEMPLATE_TAKEN_DOWN",
    { templateId, name: template.name, slug: template.slug, visible, action: "visibility_toggled" },
    session.userId,
    template.tenantId ?? undefined
  );
  revalidatePath("/admin/super/templates");
}

// ============================================================================
// EXCLUIR TEMPLATE (definitivo)
// ============================================================================
export async function deleteTemplateAction(templateId: string) {
  const session = await requireSuperAdmin();

  const template = await prisma.template.findUnique({
    where: { id: templateId },
    select: { id: true, name: true, slug: true, tenantId: true },
  });

  if (!template) {
    throw new Error("Template não encontrado.");
  }

  await prisma.template.delete({ where: { id: templateId } });

  await logAudit(
    "TEMPLATE_TAKEN_DOWN",
    { templateId, name: template.name, slug: template.slug, action: "deleted_by_super_admin" },
    session.userId,
    template.tenantId ?? undefined
  );
  revalidatePath("/admin/super/templates");
}

// ============================================================================
// BLOQUEAR/DESBLOQUEAR AUTOR DE ENVIAR TEMPLATES
// ============================================================================
export async function toggleTemplateAuthorBlockAction(
  authorId: string,
  blocked: boolean
) {
  const session = await requireSuperAdmin();

  const author = await prisma.user.findUnique({
    where: { id: authorId },
    select: { id: true, email: true, name: true },
  });

  if (!author) {
    throw new Error("Usuário não encontrado.");
  }

  await prisma.user.update({
    where: { id: authorId },
    data: { templateBlocked: blocked },
  });

  await logAudit(
    "TEMPLATE_REPORTED",
    { authorId, email: author.email, blocked, action: "template_author_block_toggled" },
    session.userId,
    undefined
  );
  revalidatePath("/admin/super/templates");
}

// ============================================================================
// Schema de validação para edição de campanha
// ============================================================================
const CampaignEditSchema = z.object({
  name: z.string().min(1, "O nome da campanha é obrigatório"),
  slug: z
    .string()
    .min(1, "O slug é obrigatório")
    .transform((val) => val.toLowerCase().replace(/\s+/g, "-"))
    .refine(
      (val) => /^[a-z0-9-]+$/.test(val),
      "O slug deve conter apenas letras minúsculas, números e hífens"
    ),
  pixelId: z.string().optional(),
  gtmId: z
    .string()
    .optional()
    .transform((val) => {
      if (!val) return undefined;
      const cleaned = val.trim().toUpperCase();
      return cleaned || undefined;
    })
    .refine(
      (val) => !val || /^GTM-[A-Z0-9]+$/.test(val),
      "O Google Tag Manager ID deve seguir o formato GTM-XXXXXXX"
    ),
  rawHtml: z.string().min(1, "O HTML base é obrigatório."),
  formSchema: z.string().refine(
    (val) => {
      try {
        JSON.parse(val);
        return true;
      } catch {
        return false;
      }
    },
    "Formato JSON inválido para o Schema do formulário"
  ),
});

// ============================================================================
// EDITAR CAMPANHA (super admin — sem tenant guard)
// ============================================================================
export async function updateCampaignSuperAction(
  campaignId: string,
  formData: FormData
): Promise<{ success?: boolean; error?: string; fieldErrors?: Record<string, string[]> }> {
  const session = await requireSuperAdmin();

  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    select: { id: true, tenantId: true },
  });

  if (!campaign) {
    return { error: "Campanha não encontrada." };
  }

  const parsed = CampaignEditSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    pixelId: formData.get("pixelId") || undefined,
    gtmId: formData.get("gtmId") || undefined,
    rawHtml: formData.get("rawHtml"),
    formSchema: formData.get("formSchema"),
  });

  if (!parsed.success) {
    return {
      error: "Verifique os erros no formulário.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { name, slug, pixelId, gtmId, rawHtml, formSchema } = parsed.data;

  // Verificar slug único dentro do tenant (ignorando a própria campanha)
  const existing = await prisma.campaign.findUnique({
    where: { tenantId_slug: { tenantId: campaign.tenantId, slug } },
  });
  if (existing && existing.id !== campaignId) {
    return { error: "Já existe outra campanha com este slug neste tenant." };
  }

  try {
    await prisma.campaign.update({
      where: { id: campaignId },
      data: {
        name,
        slug,
        pixelId,
        gtmId,
        rawHtml,
        formSchema: JSON.parse(formSchema),
      },
    });

    await logAudit(
      "CAMPAIGN_UPDATED",
      { campaignId, slug, name, action: "edited_by_super_admin" },
      session.userId,
      campaign.tenantId
    );
  } catch (error) {
    console.error(error);
    return { error: "Erro interno ao atualizar campanha." };
  }

  revalidatePath("/admin/super");
  return { success: true };
}
