"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { canCreateResource } from "@/lib/plans";
import { logAudit } from "@/lib/audit";
import { requireTenantOwnership } from "@/lib/tenant-guard";
import { canCustomizeLink } from "@/lib/campaign-meta";
import type { Plan } from "@/lib/prisma-types";
import { addCustomHostname, removeCustomHostname, getCustomHostnameStatus } from "@/services/cloudflare.service";
import { invalidateCampaignCache } from "@/lib/campaign-cache";

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

export type ActionState = {
  success?: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
  invoiceUrl?: string;
  needsBilling?: boolean;
} | undefined;

// ============================================================================
// SCHEMAS
// ============================================================================

const SaveCampaignSchema = z.object({
  name: z.string().min(1, "O nome da campanha é obrigatório"),
  slug: z
    .string()
    .min(1, "O slug é obrigatório")
    .transform((val) => val.toLowerCase().replace(/\s+/g, "-"))
    .refine(
      (val) => /^[a-z0-9-]+$/.test(val),
      "O slug deve conter apenas letras minúsculas, números e hífens"
    ),
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
  pixelId: z
    .string()
    .optional()
    .refine(
      (val) => !val || /^\d+$/.test(val.trim()),
      "O Pixel ID deve conter apenas números"
    ),
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
  customDomain: z
    .string()
    .optional()
    .transform((val) => {
      if (!val) return undefined;
      const cleaned = val.trim().toLowerCase().replace(/^https?:\/\//i, "").replace(/\/+$/, "").trim();
      return cleaned || undefined;
    }),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  ogImageUrl: z
    .string()
    .url("A imagem precisa ser uma URL válida")
    .refine((v) => /^https?:\/\//i.test(v), "A imagem deve começar com http:// ou https://")
    .optional()
    .or(z.literal("")),
  faviconUrl: z
    .string()
    .url("O favicon precisa ser uma URL válida")
    .refine((v) => /^https?:\/\//i.test(v), "O favicon deve começar com http:// ou https://")
    .optional()
    .or(z.literal("")),
  groupMaxCapacity: z.coerce.number().min(1).max(1024).default(1000),
  groupSupportPhones: z.string().optional().transform((val) => val ? val.split(",").map((s) => s.trim().replace(/\D/g, "")).filter(Boolean) : []),
  groupDescription: z.string().optional(),
  groupImageUrl: z.string().url("A imagem precisa ser uma URL válida").optional().or(z.literal("")),
  sessionRecordingEnabled: z.boolean().optional().default(false),
});

// ============================================================================
// ACTIONS: CAMPANHAS
// ============================================================================

export async function saveCampaignAction(
  campaignId: string | null,
  data: Record<string, unknown>
): Promise<ActionState> {
  const { userId, tenantId, plan } = await requireAuth();

  const parsed = SaveCampaignSchema.safeParse(data);

  if (!parsed.success) {
    return {
      error: "Verifique os erros no formulário.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const {
    name, slug, rawHtml, formSchema, pixelId, gtmId, customDomain,
    metaTitle, metaDescription, ogImageUrl, faviconUrl,
    groupMaxCapacity, groupSupportPhones, groupDescription, groupImageUrl,
    sessionRecordingEnabled,
  } = parsed.data;

  const finalCustomDomain = plan === "ULTRA" ? customDomain || null : null;
  const canCustomize = canCustomizeLink(plan);
  const finalMetaTitle = canCustomize ? (metaTitle || null) : null;
  const finalMetaDescription = canCustomize ? (metaDescription || null) : null;
  const finalOgImageUrl = canCustomize ? (ogImageUrl || null) : null;
  const finalFaviconUrl = canCustomize ? (faviconUrl || null) : null;
  const finalSessionRecording = plan === "ULTRA" ? (sessionRecordingEnabled ?? false) : false;

  const campaignData = {
    name,
    slug,
    pixelId: pixelId || null,
    gtmId: gtmId || null,
    customDomain: finalCustomDomain,
    rawHtml,
    formSchema: JSON.parse(formSchema),
    groupMaxCapacity,
    groupSupportPhones,
    groupDescription: groupDescription || null,
    groupImageUrl: groupImageUrl || null,
    metaTitle: finalMetaTitle,
    metaDescription: finalMetaDescription,
    ogImageUrl: finalOgImageUrl,
    faviconUrl: finalFaviconUrl,
    sessionRecordingEnabled: finalSessionRecording,
  };

  // ── CREATE ──
  if (!campaignId) {
    // Verificar limite do plano
    const currentCount = await prisma.campaign.count({ where: { tenantId } });
    const limitCheck = canCreateResource(plan, "campaigns", currentCount);
    if (!limitCheck.allowed) {
      return { error: limitCheck.reason };
    }

    // Verificar slug único
    const existing = await prisma.campaign.findUnique({
      where: { tenantId_slug: { tenantId, slug } },
    });
    if (existing) {
      return { error: "Já existe uma campanha com este slug neste tenant." };
    }

    try {
      await prisma.campaign.create({
        data: {
          ...campaignData,
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

  // ── UPDATE ──
  const ownership = await requireTenantOwnership(prisma.campaign, campaignId, tenantId, "Campanha");
  if (ownership.error) return ownership.error;

  // Check unique slug
  const existing = await prisma.campaign.findUnique({
    where: { tenantId_slug: { tenantId, slug } },
  });
  if (existing && existing.id !== campaignId) {
    return { error: "Já existe outra campanha com este slug neste tenant." };
  }

  try {
    const oldCampaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      select: { customDomain: true },
    });

    // Check unique customDomain
    if (finalCustomDomain) {
      const existingDomain = await prisma.campaign.findUnique({
        where: { customDomain: finalCustomDomain },
      });
      if (existingDomain && existingDomain.id !== campaignId) {
        return { error: "Este domínio customizado já está sendo usado por outra campanha." };
      }
    }

    await prisma.campaign.update({
      where: { id: campaignId },
      data: campaignData,
    });

    if (oldCampaign?.customDomain && oldCampaign.customDomain !== finalCustomDomain) {
      await removeCustomHostname(oldCampaign.customDomain);
    }
    if (finalCustomDomain && oldCampaign?.customDomain !== finalCustomDomain) {
      await addCustomHostname(finalCustomDomain);
    }

    await invalidateCampaignCache(campaignId);
    await logAudit("CAMPAIGN_UPDATED", { campaignId, slug, name }, userId, tenantId);
  } catch (error) {
    console.error(error);
    return { error: "Erro interno ao atualizar campanha." };
  }

  revalidatePath("/admin/campaigns");
  revalidatePath(`/admin/campaigns/${campaignId}`);

  // Revalidar rotas públicas
  const publicCampaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    select: { slug: true, accessCode: true, customDomain: true },
  });
  if (publicCampaign?.slug) {
    revalidatePath(`/${publicCampaign.slug}`);
    revalidatePath(`/${publicCampaign.slug}/redirect`);
  }
  if (publicCampaign?.accessCode) {
    revalidatePath(`/c/${publicCampaign.accessCode}`);
    revalidatePath(`/c/${publicCampaign.accessCode}/redirect`);
  }
  if (publicCampaign?.customDomain) {
    revalidatePath(`/custom-domain/${publicCampaign.customDomain}`);
    revalidatePath(`/custom-domain/${publicCampaign.customDomain}/redirect`);
  }

  return { success: true };
}

export async function deleteCampaignAction(id: string) {
  const { userId, tenantId, role } = await requireAuth();

  // 🔒 RBAC: Apenas ADMIN/SUPER_ADMIN podem excluir campanhas
  if (role === "MEMBER") {
    throw new Error("Apenas administradores podem excluir campanhas.");
  }

  const result = await requireTenantOwnership(prisma.campaign, id, tenantId, "Campanha");
  if (result.error) throw new Error(result.error.error);

  const campaignToDelete = await prisma.campaign.findUnique({ where: { id }, select: { customDomain: true } });
  await prisma.campaign.delete({ where: { id } });
  await invalidateCampaignCache(id);

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
  const { userId, tenantId, role } = await requireAuth();

  if (role === "MEMBER") {
    throw new Error("Apenas administradores podem alterar o status da campanha.");
  }

  const result = await requireTenantOwnership(prisma.campaign, id, tenantId, "Campanha");
  if (result.error) throw new Error(result.error.error);

  await prisma.campaign.update({
    where: { id },
    data: { active },
  });
  await invalidateCampaignCache(id);

  await logAudit(
    "CAMPAIGN_UPDATED",
    { campaignId: id, active },
    userId,
    tenantId
  );

  revalidatePath("/admin/campaigns");
  revalidatePath("/admin/campaigns/[id]", "page");
}

export async function toggleCampaignProtectionAction(
  campaignId: string,
  protected_: boolean
) {
  const { userId, tenantId, role } = await requireAuth();

  if (role === "MEMBER") {
    throw new Error("Apenas administradores podem alterar a proteção da campanha.");
  }

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
  await invalidateCampaignCache(campaignId);

  await logAudit(
    "CAMPAIGN_UPDATED",
    { campaignId, protected: protected_ },
    userId,
    tenantId
  );

  // Revalidar rotas afetadas pela proteção
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
  const { tenantId, plan } = await requireAuth();
  if (plan !== "ULTRA") return null;

  const cleanHost = decodeURIComponent(hostname)
    .toLowerCase()
    .trim()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "");

  if (!cleanHost) return null;

  // 🔒 Tenant isolation / IDOR guard: só consulta se o hostname pertencer ao tenant
  const campaign = await prisma.campaign.findFirst({
    where: {
      tenantId,
      OR: [
        { customDomain: cleanHost },
        { customDomain: `https://${cleanHost}` },
        { customDomain: `http://${cleanHost}` },
        { customDomain: { equals: cleanHost, mode: "insensitive" } },
      ],
    },
    select: { id: true },
  });

  if (!campaign) return null;

  return await getCustomHostnameStatus(cleanHost);
}
