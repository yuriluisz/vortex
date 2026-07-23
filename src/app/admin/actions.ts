"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { canCreateResource } from "@/lib/plans";
import { logAudit } from "@/lib/audit";
import { requireTenantOwnership } from "@/lib/tenant-guard";
import { Plan } from "@prisma/client";

// ============================================================================
// SEGURANÇA: Validação de sessão reutilizável para todas as mutations
// ============================================================================
async function requireAuth() {
  const session = await getSession();
  if (!session?.email || !session.tenantId) {
    throw new Error("Não autorizado.");
  }

  // Validar que o tenant ainda existe (pode ter sido resetado)
  const tenant = await prisma.tenant.findUnique({
    where: { id: session.tenantId },
    select: { id: true, plan: true },
  });

  if (!tenant) {
    throw new Error("Sessão inválida. Faça login novamente.");
  }

  return {
    userId: session.userId,
    email: session.email,
    tenantId: tenant.id,
    plan: tenant.plan as Plan,
    role: session.role,
  };
}

// ---------------------------------------------------------------------------
// CAMPANHAS
// ---------------------------------------------------------------------------

const CampaignSchema = z.object({
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
  rawHtml: z
    .string()
    .min(
      1,
      "O HTML base é obrigatório. (Use {{FORM_SLOT}} onde o form deve aparecer)"
    ),
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

export type ActionState = {
  success?: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
} | undefined;

export async function createCampaignAction(
  state: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { userId, tenantId, plan } = await requireAuth();

  const parsed = CampaignSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    pixelId: formData.get("pixelId") || undefined,
    rawHtml: formData.get("rawHtml"),
    formSchema: formData.get("formSchema"),
  });

  if (!parsed.success) {
    return {
      error: "Verifique os erros no formulário.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { name, slug, pixelId, rawHtml, formSchema } = parsed.data;

  // Verificar limite do plano
  if (plan) {
    const currentCount = await prisma.campaign.count({
      where: { tenantId },
    });
    const limitCheck = canCreateResource(plan, "campaigns", currentCount);
    if (!limitCheck.allowed) {
      return { error: limitCheck.reason };
    }
  }

  // Verificar slug único dentro do tenant
  const existing = await prisma.campaign.findUnique({
    where: { tenantId_slug: { tenantId, slug } },
  });
  if (existing) {
    return { error: "Já existe uma campanha com este slug neste tenant." };
  }

  try {
    await prisma.campaign.create({
      data: {
        name,
        slug,
        pixelId,
        rawHtml,
        formSchema: JSON.parse(formSchema),
        tenantId,
      },
    });

    await logAudit("CAMPAIGN_CREATED", { slug, name }, userId, tenantId);
  } catch (error) {
    console.error(error);
    return { error: "Erro interno ao criar campanha." };
  }

  revalidatePath("/admin/campaigns");
  redirect("/admin/campaigns");
}

export async function deleteCampaignAction(id: string) {
  const { userId, tenantId } = await requireAuth();

  const result = await requireTenantOwnership(prisma.campaign, id, tenantId, "Campanha");
  if (result.error) throw new Error(result.error.error);

  await prisma.campaign.delete({ where: { id } });

  await logAudit("CAMPAIGN_DELETED", { campaignId: id }, userId, tenantId);

  revalidatePath("/admin/campaigns");
  redirect("/admin/campaigns");
}

export async function toggleCampaignStatusAction(
  id: string,
  active: boolean
) {
  const { userId, tenantId } = await requireAuth();

  const result = await requireTenantOwnership(prisma.campaign, id, tenantId, "Campanha");
  if (result.error) throw new Error(result.error.error);

  await prisma.campaign.update({
    where: { id },
    data: { active },
  });

  await logAudit(
    "CAMPAIGN_UPDATED",
    { campaignId: id, active },
    userId,
    tenantId
  );

  revalidatePath("/admin/campaigns");
  revalidatePath("/admin/campaigns/[id]", "page");
}

export async function updateCampaignAction(
  campaignId: string,
  state: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { userId, tenantId } = await requireAuth();

  const result = await requireTenantOwnership(prisma.campaign, campaignId, tenantId, "Campanha");
  if (result.error) return result.error;

  const parsed = CampaignSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    pixelId: formData.get("pixelId") || undefined,
    rawHtml: formData.get("rawHtml"),
    formSchema: formData.get("formSchema"),
  });

  if (!parsed.success) {
    return {
      error: "Verifique os erros no formulário.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { name, slug, pixelId, rawHtml, formSchema } = parsed.data;

  // Check unique slug if it changed
  const existing = await prisma.campaign.findUnique({
    where: { tenantId_slug: { tenantId, slug } },
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
        rawHtml,
        formSchema: JSON.parse(formSchema),
      },
    });

    await logAudit(
      "CAMPAIGN_UPDATED",
      { campaignId, slug, name },
      userId,
      tenantId
    );
  } catch (error) {
    console.error(error);
    return { error: "Erro interno ao atualizar campanha." };
  }

  revalidatePath("/admin/campaigns");
  revalidatePath(`/admin/campaigns/${campaignId}`);
  return { success: true };
}

// ---------------------------------------------------------------------------
// GRUPOS
// ---------------------------------------------------------------------------

const GroupSchema = z.object({
  campaignId: z.string().uuid(),
  name: z.string().min(1, "O nome do grupo é obrigatório"),
  url: z.string().url("URL do WhatsApp inválida"),
  maxCapacity: z.coerce.number().min(1).max(1024),
});

export async function createGroupAction(
  state: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { userId, tenantId, plan } = await requireAuth();

  const parsed = GroupSchema.safeParse({
    campaignId: formData.get("campaignId"),
    name: formData.get("name"),
    url: formData.get("url"),
    maxCapacity: formData.get("maxCapacity"),
  });

  if (!parsed.success) {
    return {
      error: "Verifique os erros no formulário.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { campaignId, name, url, maxCapacity } = parsed.data;

  // Verificar que a campanha pertence ao tenant
  const campaignResult = await requireTenantOwnership(prisma.campaign, campaignId, tenantId, "Campanha");
  if (campaignResult.error) return campaignResult.error;

  // Verificar limite do plano
  if (plan) {
    const currentCount = await prisma.group.count({
      where: { tenantId },
    });
    const limitCheck = canCreateResource(plan, "groups", currentCount);
    if (!limitCheck.allowed) {
      return { error: limitCheck.reason };
    }
  }

  try {
    await prisma.group.create({
      data: {
        campaignId,
        name,
        url,
        maxCapacity,
        tenantId,
      },
    });

    await logAudit(
      "GROUP_CREATED",
      { campaignId, name, url },
      userId,
      tenantId
    );
  } catch (error) {
    console.error(error);
    return { error: "Erro interno ao criar grupo." };
  }

  revalidatePath(`/admin/campaigns/${campaignId}`);
  return { success: true };
}

export async function deleteGroupAction(groupId: string, campaignId: string) {
  const { userId, tenantId } = await requireAuth();

  const result = await requireTenantOwnership(prisma.group, groupId, tenantId, "Grupo");
  if (result.error) throw new Error(result.error.error);

  await prisma.group.delete({ where: { id: groupId } });

  await logAudit("GROUP_DELETED", { groupId, campaignId }, userId, tenantId);

  revalidatePath(`/admin/campaigns/${campaignId}`);
}

export async function toggleGroupStatusAction(
  groupId: string,
  campaignId: string,
  active: boolean
) {
  const { userId, tenantId } = await requireAuth();

  const result = await requireTenantOwnership(prisma.group, groupId, tenantId, "Grupo");
  if (result.error) throw new Error(result.error.error);

  await prisma.group.update({
    where: { id: groupId },
    data: { active },
  });

  revalidatePath(`/admin/campaigns/${campaignId}`);
}

export async function updateGroupUrlAction(
  groupId: string,
  campaignId: string,
  url: string
) {
  const { userId, tenantId } = await requireAuth();

  const result = await requireTenantOwnership(prisma.group, groupId, tenantId, "Grupo");
  if (result.error) throw new Error(result.error.error);

  const parsedUrl = z.string().url("URL inválida").safeParse(url);
  if (!parsedUrl.success) {
    throw new Error("URL inválida");
  }

  await prisma.group.update({
    where: { id: groupId },
    data: { url: parsedUrl.data },
  });

  revalidatePath(`/admin/campaigns/${campaignId}`);
}