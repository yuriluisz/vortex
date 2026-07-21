"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

/**
 * Validação de sessão reutilizável para todas as mutations
 */
async function requireAuth() {
  const session = await getSession();
  if (!session?.email) {
    throw new Error("Não autorizado.");
  }
  return session;
}

// ---------------------------------------------------------------------------
// CAMPANHAS
// ---------------------------------------------------------------------------

const CampaignSchema = z.object({
  name: z.string().min(1, "O nome da campanha é obrigatório"),
  slug: z.string()
    .min(1, "O slug é obrigatório")
    .transform((val) => val.toLowerCase().replace(/\s+/g, '-'))
    .refine((val) => /^[a-z0-9-]+$/.test(val), "O slug deve conter apenas letras minúsculas, números e hífens"),
  pixelId: z.string().optional(),
  rawHtml: z.string().min(1, "O HTML base é obrigatório. (Use {{FORM_SLOT}} onde o form deve aparecer)"),
  formSchema: z.string().refine((val) => {
    try {
      JSON.parse(val);
      return true;
    } catch {
      return false;
    }
  }, "Formato JSON inválido para o Schema do formulário"),
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
  await requireAuth();

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

  // Verificar slug único
  const existing = await prisma.campaign.findUnique({ where: { slug } });
  if (existing) {
    return { error: "Já existe uma campanha com este slug." };
  }

  try {
    await prisma.campaign.create({
      data: {
        name,
        slug,
        pixelId,
        rawHtml,
        formSchema: JSON.parse(formSchema),
      },
    });
  } catch (error) {
    console.error(error);
    return { error: "Erro interno ao criar campanha." };
  }

  revalidatePath("/admin/campaigns");
  redirect("/admin/campaigns");
}

export async function deleteCampaignAction(id: string) {
  await requireAuth();
  
  await prisma.campaign.delete({ where: { id } });
  revalidatePath("/admin/campaigns");
  redirect("/admin/campaigns");
}

export async function toggleCampaignStatusAction(id: string, active: boolean) {
  await requireAuth();
  
  await prisma.campaign.update({
    where: { id },
    data: { active },
  });
  revalidatePath("/admin/campaigns");
  revalidatePath("/admin/campaigns/[id]", "page");
}

export async function updateCampaignAction(
  campaignId: string,
  state: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAuth();

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
  const existing = await prisma.campaign.findUnique({ where: { slug } });
  if (existing && existing.id !== campaignId) {
    return { error: "Já existe outra campanha com este slug." };
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
  await requireAuth();

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

  try {
    await prisma.group.create({
      data: {
        campaignId,
        name,
        url,
        maxCapacity,
      },
    });
  } catch (error) {
    console.error(error);
    return { error: "Erro interno ao criar grupo." };
  }

  revalidatePath(`/admin/campaigns/${campaignId}`);
  return { success: true };
}

export async function deleteGroupAction(groupId: string, campaignId: string) {
  await requireAuth();
  
  await prisma.group.delete({ where: { id: groupId } });
  revalidatePath(`/admin/campaigns/${campaignId}`);
}

export async function toggleGroupStatusAction(groupId: string, campaignId: string, active: boolean) {
  await requireAuth();
  
  await prisma.group.update({
    where: { id: groupId },
    data: { active },
  });
  revalidatePath(`/admin/campaigns/${campaignId}`);
}

export async function updateGroupUrlAction(groupId: string, campaignId: string, url: string) {
  await requireAuth();

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
