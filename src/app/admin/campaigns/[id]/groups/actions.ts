"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { revalidatePath } from "next/cache";
import { logAudit } from "@/lib/audit";
import { canCreateResource, PLAN_LIMITS } from "@/lib/plans";
import { requireTenantOwnership } from "@/lib/tenant-guard";
import type { Plan } from "@/lib/prisma-types";
import {
  createEvolutionGroup,
  fetchInviteCode,
  updateGroupSetting,
  updateGroupPicture,
  updateGroupDescription,
} from "@/lib/evolution";
import type { ActionState } from "../../actions";

// ============================================================================
// SEGURANÇA: Validação de sessão reutilizável
// ============================================================================
async function requireAuth() {
  const session = await getSession();
  if (!session?.email || !session.tenantId) {
    throw new Error("Não autorizado.");
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: session.tenantId },
    select: { id: true, plan: true, active: true },
  });

  if (!tenant || !tenant.active) {
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

// ============================================================================
// SCHEMAS
// ============================================================================

const GroupSchema = z.object({
  campaignId: z.string().uuid(),
  name: z.string().min(1, "O nome do grupo é obrigatório"),
  url: z.string().url("URL do WhatsApp inválida"),
  maxCapacity: z.coerce.number().min(1).max(1024),
});

const WhatsAppGroupSchema = z.object({
  campaignId: z.string().uuid(),
  name: z.string().min(1, "O nome do grupo é obrigatório"),
  maxCapacity: z.coerce.number().min(1).max(1024),
  participantNumber: z.string().min(10, "O número auxiliar é obrigatório e deve ser válido"),
  description: z.string().optional(),
});

const CampaignGroupSettingsSchema = z.object({
  groupMaxCapacity: z.coerce.number().min(1).max(1024).default(1000),
  groupSupportPhones: z.string().optional().transform((val) => val ? val.split(",").map((s) => s.trim().replace(/\D/g, "")).filter(Boolean) : []),
  groupDescription: z.string().optional(),
  groupImageUrl: z.string().url("A imagem precisa ser uma URL válida").optional().or(z.literal("")),
});

// ============================================================================
// ACTIONS: GRUPOS
// ============================================================================

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

  const campaignResult = await requireTenantOwnership(prisma.campaign, campaignId, tenantId, "Campanha");
  if (campaignResult.error) return campaignResult.error;

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

export async function createWhatsAppGroupAction(
  state: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { userId, tenantId, plan } = await requireAuth();

  const parsed = WhatsAppGroupSchema.safeParse({
    campaignId: formData.get("campaignId"),
    name: formData.get("name"),
    maxCapacity: formData.get("maxCapacity"),
    participantNumber: formData.get("participantNumber"),
    description: formData.get("description") || undefined,
  });

  if (!parsed.success) {
    return {
      error: "Verifique os erros no formulário.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { campaignId, name, maxCapacity, participantNumber, description } = parsed.data;
  const cleanNumber = participantNumber.replace(/\D/g, "");

  let base64Image: string | undefined = undefined;
  const pictureFile = formData.get("picture") as File | null;
  if (pictureFile && pictureFile.size > 0) {
    const arrayBuffer = await pictureFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    base64Image = buffer.toString("base64");
  }

  const campaignResult = await requireTenantOwnership(prisma.campaign, campaignId, tenantId, "Campanha");
  if (campaignResult.error) return campaignResult.error;

  const planLimits = PLAN_LIMITS[plan];
  if (!planLimits?.whatsappIntegration) {
    return { error: "Seu plano atual não permite a integração com WhatsApp." };
  }

  if (plan) {
    const currentCount = await prisma.group.count({
      where: { tenantId },
    });
    const limitCheck = canCreateResource(plan, "groups", currentCount);
    if (!limitCheck.allowed) {
      return { error: limitCheck.reason };
    }
  }

  const instance = await prisma.evolutionInstance.findUnique({
    where: { tenantId },
  });

  if (!instance || instance.status !== "CONNECTED") {
    return { error: "Nenhuma instância conectada no WhatsApp encontrada." };
  }

  try {
    const groupRes = await createEvolutionGroup(instance.instanceName, name, [cleanNumber]);
    if (!groupRes || !groupRes.id) {
      return { error: "Falha ao criar o grupo no WhatsApp. A API recusou o comando." };
    }

    const groupJid = groupRes.id;

    await updateGroupSetting(instance.instanceName, groupJid, "announcement");
    await updateGroupSetting(instance.instanceName, groupJid, "locked");

    if (description) {
      await updateGroupDescription(instance.instanceName, groupJid, description);
    }
    
    if (base64Image) {
      await updateGroupPicture(instance.instanceName, groupJid, base64Image);
    }

    let inviteCode: string | null | undefined = groupRes.inviteCode;
    if (!inviteCode) {
      inviteCode = await fetchInviteCode(instance.instanceName, groupJid);
    }

    if (!inviteCode) {
      return { error: "Grupo criado, mas falha ao resgatar o link de convite. Adicione o link manualmente." };
    }

    const url = `https://chat.whatsapp.com/${inviteCode}`;

    await prisma.group.create({
      data: {
        campaignId,
        name,
        url,
        maxCapacity,
        tenantId,
        groupJid,
        inviteCode,
      },
    });

    await logAudit(
      "GROUP_AUTO_CREATED",
      { campaignId, name, url, groupJid },
      userId,
      tenantId
    );
  } catch (error) {
    console.error(error);
    return { error: "Erro interno ao criar grupo no WhatsApp." };
  }

  revalidatePath(`/admin/campaigns/${campaignId}`);
  return { success: true };
}

export async function deleteGroupAction(groupId: string, campaignId: string) {
  const { userId, tenantId, role } = await requireAuth();

  // 🔒 RBAC: Apenas ADMIN/SUPER_ADMIN podem excluir grupos
  if (role === "MEMBER") throw new Error("Apenas administradores podem excluir grupos.");

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
  const { tenantId, role } = await requireAuth();

  // 🔒 RBAC: Apenas ADMIN/SUPER_ADMIN podem alterar status de grupos
  if (role === "MEMBER") throw new Error("Apenas administradores podem alterar grupos.");

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
  const { tenantId, role } = await requireAuth();

  // 🔒 RBAC: Apenas ADMIN/SUPER_ADMIN podem alterar URL de grupos
  if (role === "MEMBER") throw new Error("Apenas administradores podem alterar grupos.");

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

export async function updateCampaignGroupSettingsAction(
  campaignId: string,
  state: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { userId, tenantId, role } = await requireAuth();

  if (role === "MEMBER") {
    return { error: "Apenas administradores podem alterar configurações de grupo." };
  }

  const result = await requireTenantOwnership(prisma.campaign, campaignId, tenantId, "Campanha");
  if (result.error) return result.error;

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { plan: true },
  });

  if (tenant?.plan !== "ULTRA") {
    return { error: "As configurações de auto-criação de grupos são exclusivas para o plano ULTRA." };
  }

  const parsed = CampaignGroupSettingsSchema.safeParse({
    groupMaxCapacity: formData.get("groupMaxCapacity"),
    groupSupportPhones: formData.get("groupSupportPhones"),
    groupDescription: formData.get("groupDescription") || undefined,
    groupImageUrl: formData.get("groupImageUrl") || undefined,
  });

  if (!parsed.success) {
    return {
      error: "Verifique os erros no formulário.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { groupMaxCapacity, groupSupportPhones, groupDescription, groupImageUrl } = parsed.data;

  try {
    await prisma.campaign.update({
      where: { id: campaignId },
      data: {
        groupMaxCapacity,
        groupSupportPhones,
        groupDescription,
        groupImageUrl,
      },
    });

    await logAudit(
      "CAMPAIGN_UPDATED",
      { campaignId, groupSettingsUpdated: true },
      userId,
      tenantId
    );
  } catch (error) {
    console.error(error);
    return { error: "Erro interno ao atualizar configurações de grupo." };
  }

  revalidatePath(`/admin/campaigns/${campaignId}/groups`);
  return { success: true };
}
