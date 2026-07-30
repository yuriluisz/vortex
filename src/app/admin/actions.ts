"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { canCreateResource } from "@/lib/plans";
import { logAudit } from "@/lib/audit";
import { requireTenantOwnership } from "@/lib/tenant-guard";
import type { Plan } from "@/lib/prisma-types";
import { PLAN_LIMITS } from "@/lib/plans";
import { addCustomHostname, removeCustomHostname, getCustomHostnameStatus } from "@/services/cloudflare.service";
import { createEvolutionGroup, fetchInviteCode, updateGroupSetting, updateGroupPicture, updateGroupDescription } from "@/lib/evolution";

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
  customDomain: z.string().optional(),
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
  groupMaxCapacity: z.coerce.number().min(1).max(1024).default(1000),
  groupSupportPhones: z.string().optional().transform((val) => val ? val.split(",").map((s) => s.trim().replace(/\D/g, "")).filter(Boolean) : []),
  groupDescription: z.string().optional(),
  groupImageUrl: z.string().url("A imagem precisa ser uma URL válida").optional().or(z.literal("")),
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
    customDomain: formData.get("customDomain") || undefined,
    rawHtml: formData.get("rawHtml"),
    formSchema: formData.get("formSchema"),
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

  const { name, slug, pixelId, customDomain, rawHtml, formSchema, groupMaxCapacity, groupSupportPhones, groupDescription, groupImageUrl } = parsed.data;

  const finalCustomDomain = plan === "ULTRA" ? customDomain || null : null;

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
        customDomain: finalCustomDomain,
        rawHtml,
        formSchema: JSON.parse(formSchema),
        groupMaxCapacity,
        groupSupportPhones,
        groupDescription,
        groupImageUrl,
        tenantId,
        accessCode: crypto.randomUUID(),
      },
    });

    
    if (finalCustomDomain) {
      await addCustomHostname(finalCustomDomain);
    }

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

  
  const campaignToDelete = await prisma.campaign.findUnique({ where: { id }, select: { customDomain: true } });
  await prisma.campaign.delete({ where: { id } });

  
  if (campaignToDelete?.customDomain) {
    await removeCustomHostname(campaignToDelete.customDomain);
  }

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
  const { userId, tenantId, plan } = await requireAuth();

  const result = await requireTenantOwnership(prisma.campaign, campaignId, tenantId, "Campanha");
  if (result.error) return result.error;

  const parsed = CampaignSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    pixelId: formData.get("pixelId") || undefined,
    customDomain: formData.get("customDomain") || undefined,
    rawHtml: formData.get("rawHtml"),
    formSchema: formData.get("formSchema"),
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

  const { name, slug, pixelId, customDomain, rawHtml, formSchema, groupMaxCapacity, groupSupportPhones, groupDescription, groupImageUrl } = parsed.data;

  // Check unique slug if it changed
  const existing = await prisma.campaign.findUnique({
    where: { tenantId_slug: { tenantId, slug } },
  });
  if (existing && existing.id !== campaignId) {
    return { error: "Já existe outra campanha com este slug neste tenant." };
  }

  try {
    const finalCustomDomain = plan === "ULTRA" ? customDomain || null : null;

    const oldCampaign = await prisma.campaign.findUnique({ where: { id: campaignId }, select: { customDomain: true } });


    // Check unique customDomain se foi preenchido
    if (finalCustomDomain) {
      const existingDomain = await prisma.campaign.findUnique({
        where: { customDomain: finalCustomDomain }
      });
      if (existingDomain && existingDomain.id !== campaignId) {
        return { error: "Este domínio customizado já está sendo usado por outra campanha." };
      }
    }

    await prisma.campaign.update({
      where: { id: campaignId },
      data: {
        name,
        slug,
        pixelId,
        customDomain: finalCustomDomain,
        rawHtml,
        formSchema: JSON.parse(formSchema),
        groupMaxCapacity,
        groupSupportPhones,
        groupDescription,
        groupImageUrl,
      },
    });

    if (oldCampaign?.customDomain && oldCampaign.customDomain !== finalCustomDomain) {
      await removeCustomHostname(oldCampaign.customDomain);
    }
    if (finalCustomDomain && oldCampaign?.customDomain !== finalCustomDomain) {
      await addCustomHostname(finalCustomDomain);
    }

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

const CampaignGroupSettingsSchema = z.object({
  groupMaxCapacity: z.coerce.number().min(1).max(1024).default(1000),
  groupSupportPhones: z.string().optional().transform((val) => val ? val.split(",").map((s) => s.trim().replace(/\D/g, "")).filter(Boolean) : []),
  groupDescription: z.string().optional(),
  groupImageUrl: z.string().url("A imagem precisa ser uma URL válida").optional().or(z.literal("")),
});

export async function updateCampaignGroupSettingsAction(
  campaignId: string,
  state: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { userId, tenantId } = await requireAuth();

  const result = await requireTenantOwnership(prisma.campaign, campaignId, tenantId, "Campanha");
  if (result.error) return result.error;

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { plan: true }
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

const WhatsAppGroupSchema = z.object({
  campaignId: z.string().uuid(),
  name: z.string().min(1, "O nome do grupo é obrigatório"),
  maxCapacity: z.coerce.number().min(1).max(1024),
  participantNumber: z.string().min(10, "O número auxiliar é obrigatório e deve ser válido"),
  description: z.string().optional(),
});

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
    // Envia apenas o base64 puro (sem prefixo data:) que costuma ser mais compatível
    base64Image = buffer.toString("base64");
  }

  // Verificar que a campanha pertence ao tenant
  const campaignResult = await requireTenantOwnership(prisma.campaign, campaignId, tenantId, "Campanha");
  if (campaignResult.error) return campaignResult.error;

  // Verificar flag whatsappIntegration
  const planLimits = PLAN_LIMITS[plan];
  if (!planLimits?.whatsappIntegration) {
    return { error: "Seu plano atual não permite a integração com WhatsApp." };
  }

  // Verificar limite do plano para grupos
  if (plan) {
    const currentCount = await prisma.group.count({
      where: { tenantId },
    });
    const limitCheck = canCreateResource(plan, "groups", currentCount);
    if (!limitCheck.allowed) {
      return { error: limitCheck.reason };
    }
  }

  // Buscar instância
  const instance = await prisma.evolutionInstance.findUnique({
    where: { tenantId },
  });

  if (!instance || instance.status !== "CONNECTED") {
    return { error: "Nenhuma instância conectada no WhatsApp encontrada." };
  }

  try {
    // Criar grupo no whatsapp
    const groupRes = await createEvolutionGroup(instance.instanceName, name, [cleanNumber]);
    if (!groupRes || !groupRes.id) {
      return { error: "Falha ao criar o grupo no WhatsApp. A API recusou o comando." };
    }

    const groupJid = groupRes.id;

    // Aplicar travas (somente admins mandam msg, e somente admins editam info)
    await updateGroupSetting(instance.instanceName, groupJid, "announcement");
    await updateGroupSetting(instance.instanceName, groupJid, "locked");

    if (description) {
      await updateGroupDescription(instance.instanceName, groupJid, description);
    }
    
    if (base64Image) {
      await updateGroupPicture(instance.instanceName, groupJid, base64Image);
    }

    // Buscar o invite code
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

// ---------------------------------------------------------------------------
// PROTEÇÃO DE CAMPANHA
// ---------------------------------------------------------------------------

export async function toggleCampaignProtectionAction(
  campaignId: string,
  protected_: boolean
) {
  const { userId, tenantId } = await requireAuth();

  const result = await requireTenantOwnership(prisma.campaign, campaignId, tenantId, "Campanha");
  if (result.error) throw new Error(result.error.error);

  // Buscar slug e accessCode antes de atualizar
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    select: { slug: true, accessCode: true },
  });

  // Ao ativar proteção, garantir que accessCode exista
  const data: { protected: boolean; accessCode?: string } = { protected: protected_ };
  if (protected_ && !campaign?.accessCode) {
    data.accessCode = crypto.randomUUID();
  }

  await prisma.campaign.update({
    where: { id: campaignId },
    data,
  });

  await logAudit(
    "CAMPAIGN_UPDATED",
    { campaignId, protected: protected_ },
    userId,
    tenantId
  );

  // Revalidar TODAS as rotas afetadas pela proteção
  revalidatePath(`/admin/campaigns/${campaignId}`);
  if (campaign?.slug) {
    revalidatePath(`/${campaign.slug}`);
    revalidatePath(`/${campaign.slug}/redirect`);
  }
  if (campaign?.accessCode) {
    revalidatePath(`/c/${campaign.accessCode}`);
    revalidatePath(`/c/${campaign.accessCode}/redirect`);
  }
}

export async function checkCustomHostnameStatusAction(hostname: string) {
  const { plan } = await requireAuth();
  if (plan !== "ULTRA") return null;
  return await getCustomHostnameStatus(hostname);
}

