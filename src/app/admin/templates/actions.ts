"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { revalidatePath } from "next/cache";
import { logAudit } from "@/lib/audit";
import { publishTemplate, updateTemplateVersion } from "@/services/template.service";
import { sanitizeTemplateHtml } from "@/lib/template-sanitizer";
import { hasFeature } from "@/lib/plans";
import type { Plan } from "@/lib/prisma-types";
import type { TemplateCategory, TemplateTheme } from "@prisma/client";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { uploadImageToR2, deleteFileFromR2 } from "@/lib/r2";
import { validateImageBuffer } from "@/lib/image-validator";
import { rateLimit, RATE_LIMITS } from "@/lib/rate-limit";

// ============================================================================
// PUBLICAR NOVO TEMPLATE
// ============================================================================
export type PublishTemplateActionInput =
  | FormData
  | {
      name: string;
      description?: string;
      category: TemplateCategory;
      theme: TemplateTheme;
      tags?: string[];
      sourceCampaignId: string;
      thumbnail?: File | null;
    };

export async function publishTemplateAction(input: PublishTemplateActionInput) {
  const session = await getSession();
  if (!session?.email || !session.userId || !session.tenantId) {
    throw new Error("Não autenticado.");
  }

  // 🔒 Plan Limit Check: Validar se o plano do tenant autoriza publicação de templates
  const plan = (session.plan || "FREE") as Plan;
  if (!hasFeature(plan, "publishTemplates")) {
    throw new Error("A publicação de templates na comunidade está disponível apenas nos planos PRO e ULTRA.");
  }

  const rateKey = `publish_template:${session.userId}`;
  const rateResult = await rateLimit(rateKey, RATE_LIMITS.TEMPLATE_PUBLISH);
  if (!rateResult.allowed) {
    throw new Error("Muitas tentativas de publicação de template. Aguarde um minuto.");
  }

  let name: string;
  let description: string | undefined;
  let category: TemplateCategory;
  let theme: TemplateTheme;
  let tags: string[];
  let sourceCampaignId: string;
  let thumbnailFile: File | null = null;

  if (input instanceof FormData) {
    name = (input.get("name") as string) || "";
    description = (input.get("description") as string) || undefined;
    category = (input.get("category") as TemplateCategory) || "LANDING_PAGE";
    theme = (input.get("theme") as TemplateTheme) || "DARK";
    const rawTags = input.get("tags");
    tags = typeof rawTags === "string" ? rawTags.split(",").map((t) => t.trim()).filter(Boolean) : [];
    sourceCampaignId = (input.get("sourceCampaignId") as string) || "";
    const rawThumbnail = input.get("thumbnail");
    if (rawThumbnail && rawThumbnail instanceof File && rawThumbnail.size > 0) {
      thumbnailFile = rawThumbnail;
    }
  } else {
    name = input.name || "";
    description = input.description;
    category = input.category;
    theme = input.theme;
    tags = input.tags ?? [];
    sourceCampaignId = input.sourceCampaignId;
    thumbnailFile = input.thumbnail ?? null;
  }

  if (!name.trim()) throw new Error("Nome é obrigatório.");
  if (!sourceCampaignId) throw new Error("Selecione uma campanha.");

  // Verificar que a campanha pertence ao tenant
  const campaign = await prisma.campaign.findFirst({
    where: { id: sourceCampaignId, tenantId: session.tenantId },
    select: { id: true, rawHtml: true, formSchema: true },
  });
  if (!campaign) throw new Error("Campanha não encontrada.");

  let thumbnailUrl: string | undefined = undefined;
  if (thumbnailFile && thumbnailFile.size > 0) {
    if (thumbnailFile.size > 5 * 1024 * 1024) {
      throw new Error("A imagem de capa deve ter no máximo 5MB.");
    }

    const validTypes: Record<string, string> = {
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/webp": "webp",
      "image/gif": "gif",
    };

    if (!validTypes[thumbnailFile.type]) {
      throw new Error("Formato de imagem inválido. Use JPEG, PNG, WEBP ou GIF.");
    }

    const bytes = await thumbnailFile.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const validation = validateImageBuffer(buffer);
    if (!validation.isValid || !validation.mimeType || !validation.detectedFormat) {
      throw new Error(validation.error || "Arquivo de imagem corrompido ou formato não suportado.");
    }

    const ext = validation.detectedFormat;
    const cleanSlug = name.toLowerCase().replace(/[^a-z0-9]/g, "-").slice(0, 30);
    const key = `templates/${cleanSlug}-${Date.now()}.${ext}`;

    thumbnailUrl = await uploadImageToR2(key, buffer, validation.mimeType);
  }

  await publishTemplate(session.userId, session.tenantId, {
    name: name.trim(),
    description: description?.trim() || undefined,
    category,
    theme,
    tags,
    sourceCampaignId,
    thumbnailUrl,
    rawHtml: campaign.rawHtml,
    formSchema: campaign.formSchema,
  });

  await logAudit("TEMPLATE_PUBLISHED", { name, action: "publish" }, session.userId, session.tenantId);
  revalidatePath("/admin/templates");
}

// ============================================================================
// REENVIAR TEMPLATE REJEITADO
// ============================================================================
export async function resubmitTemplateAction(templateId: string) {
  const session = await getSession();
  if (!session?.email || !session.userId) {
    throw new Error("Não autenticado.");
  }

  const template = await prisma.template.findUnique({
    where: { id: templateId },
    select: { authorId: true, status: true },
  });

  if (!template) throw new Error("Template não encontrado.");
  if (template.authorId !== session.userId) throw new Error("Você não é o autor deste template.");
  if (template.status !== "REJECTED") throw new Error("Apenas templates rejeitados podem ser reenviados.");

  const lastVersion = await prisma.templateVersion.findFirst({
    where: { templateId },
    orderBy: { version: "desc" },
  });
  if (!lastVersion) throw new Error("Template sem versões.");

  await updateTemplateVersion(templateId, session.userId, lastVersion.rawHtml, lastVersion.formSchema);
  await logAudit("TEMPLATE_PUBLISHED", { templateId, action: "resubmit" }, session.userId, undefined);
  revalidatePath("/admin/templates");
}

// ============================================================================
// EDITAR TEMPLATE (metadados + nova versão HTML → PENDING_REVIEW)
// ============================================================================
const EditTemplateSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório.").max(120, "Máximo de 120 caracteres."),
  description: z.string().max(1000, "Descrição muito longa.").optional(),
  category: z.enum(["LANDING_PAGE", "SQUEEZE_PAGE", "WEBINAR", "ECOMMERCE", "INFOPRODUCT", "PORTFOLIO", "EVENT", "OTHER"]),
  theme: z.enum(["DARK", "LIGHT", "COLORFUL"]),
  tags: z.array(z.string().max(50).trim()).max(20).optional(),
});

export async function editTemplateAction(
  templateId: string,
  input: {
    name: string;
    description?: string;
    category: TemplateCategory;
    theme: TemplateTheme;
    tags?: string[];
  }
) {
  const session = await getSession();
  if (!session?.email || !session.userId) {
    throw new Error("Não autenticado.");
  }

  const template = await prisma.template.findUnique({
    where: { id: templateId },
    select: { authorId: true },
  });
  if (!template) throw new Error("Template não encontrado.");
  if (template.authorId !== session.userId) throw new Error("Você não é o autor deste template.");

  const parsed = EditTemplateSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || "Dados inválidos.");
  }

  try {
    await prisma.template.update({
      where: { id: templateId },
      data: {
        name: parsed.data.name.trim(),
        description: parsed.data.description?.trim() || null,
        category: parsed.data.category,
        theme: parsed.data.theme,
        tags: parsed.data.tags ?? [],
      },
    });
  } catch (e) {
    console.error("Erro ao editar template:", e);
    throw new Error("Erro ao salvar alterações no template.");
  }

  await logAudit("TEMPLATE_PUBLISHED", { templateId, action: "edit_metadata" }, session.userId, undefined);
  revalidatePath("/admin/templates");
}

// ============================================================================
// SALVAR EDIÇÃO COMPLETA (metadados + HTML em transação)
// ============================================================================
export type SaveTemplateEditActionInput =
  | FormData
  | {
      name: string;
      description?: string;
      category: TemplateCategory;
      theme: TemplateTheme;
      tags?: string[];
      rawHtml: string;
      thumbnail?: File | null;
    };

export async function saveTemplateEditAction(
  templateId: string,
  input: SaveTemplateEditActionInput
) {
  const session = await getSession();
  if (!session?.email || !session.userId) {
    throw new Error("Não autenticado.");
  }

  const template = await prisma.template.findUnique({
    where: { id: templateId },
    select: { authorId: true, slug: true, thumbnailUrl: true },
  });
  if (!template) throw new Error("Template não encontrado.");
  if (template.authorId !== session.userId) throw new Error("Você não é o autor deste template.");

  let name: string;
  let description: string | undefined;
  let category: TemplateCategory;
  let theme: TemplateTheme;
  let tags: string[];
  let rawHtml: string;
  let thumbnailFile: File | null = null;

  if (input instanceof FormData) {
    name = (input.get("name") as string) || "";
    description = (input.get("description") as string) || undefined;
    category = (input.get("category") as TemplateCategory) || "LANDING_PAGE";
    theme = (input.get("theme") as TemplateTheme) || "DARK";
    const rawTags = input.get("tags");
    tags = typeof rawTags === "string" ? rawTags.split(",").map((t) => t.trim()).filter(Boolean) : [];
    rawHtml = (input.get("rawHtml") as string) || "";
    const rawThumbnail = input.get("thumbnail");
    if (rawThumbnail && rawThumbnail instanceof File && rawThumbnail.size > 0) {
      thumbnailFile = rawThumbnail;
    }
  } else {
    name = input.name;
    description = input.description;
    category = input.category;
    theme = input.theme;
    tags = input.tags ?? [];
    rawHtml = input.rawHtml;
    thumbnailFile = input.thumbnail ?? null;
  }

  const parsed = EditTemplateSchema.safeParse({ name, description, category, theme, tags });
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || "Dados inválidos.");
  }

  let newThumbnailUrl: string | undefined = undefined;
  if (thumbnailFile && thumbnailFile.size > 0) {
    if (thumbnailFile.size > 5 * 1024 * 1024) {
      throw new Error("A imagem de capa deve ter no máximo 5MB.");
    }

    const validTypes: Record<string, string> = {
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/webp": "webp",
      "image/gif": "gif",
    };

    if (!validTypes[thumbnailFile.type]) {
      throw new Error("Formato de imagem inválido. Use JPEG, PNG, WEBP ou GIF.");
    }

    const bytes = await thumbnailFile.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const validation = validateImageBuffer(buffer);
    if (!validation.isValid || !validation.mimeType || !validation.detectedFormat) {
      throw new Error(validation.error || "Arquivo de imagem corrompido ou formato não suportado.");
    }

    const ext = validation.detectedFormat;
    const key = `templates/${template.slug}-${Date.now()}.${ext}`;

    newThumbnailUrl = await uploadImageToR2(key, buffer, validation.mimeType);

    if (template.thumbnailUrl) {
      await deleteFileFromR2(template.thumbnailUrl);
    }
  }

  try {
    await prisma.$transaction(async (tx) => {
      // 1. Atualiza metadados
      await tx.template.update({
        where: { id: templateId },
        data: {
          name: parsed.data.name.trim(),
          description: parsed.data.description?.trim() || null,
          category: parsed.data.category,
          theme: parsed.data.theme,
          tags: parsed.data.tags ?? [],
          ...(newThumbnailUrl ? { thumbnailUrl: newThumbnailUrl } : {}),
        },
      });

      // 2. Se HTML mudou, cria nova versão (vai para análise)
      const lastVersion = await tx.templateVersion.findFirst({
        where: { templateId },
        orderBy: { version: "desc" },
      });
      if (lastVersion && rawHtml.trim() !== lastVersion.rawHtml.trim()) {
        const sanitized = sanitizeTemplateHtml(rawHtml);
        await tx.templateVersion.create({
          data: {
            templateId,
            version: lastVersion.version + 1,
            rawHtml: sanitized,
            formSchema: lastVersion.formSchema ?? Prisma.JsonNull,
            status: "PENDING_REVIEW",
          },
        });
        await tx.template.update({
          where: { id: templateId },
          data: { status: "PENDING_REVIEW", rejectionReason: null },
        });
      }
    });
  } catch (e) {
    console.error("Erro ao salvar edição do template:", e);
    throw new Error("Erro ao salvar alterações no template.");
  }

  await logAudit("TEMPLATE_PUBLISHED", { templateId, action: "edit_complete" }, session.userId, undefined);
  revalidatePath("/admin/templates");
}

// ============================================================================
// ATUALIZAR HTML DO TEMPLATE (nova versão → PENDING_REVIEW)
// ============================================================================
export async function updateTemplateHtmlAction(templateId: string, rawHtml: string) {
  const session = await getSession();
  if (!session?.email || !session.userId) {
    throw new Error("Não autenticado.");
  }

  const template = await prisma.template.findUnique({
    where: { id: templateId },
    select: { authorId: true },
  });
  if (!template) throw new Error("Template não encontrado.");
  if (template.authorId !== session.userId) throw new Error("Você não é o autor deste template.");

  const sanitized = sanitizeTemplateHtml(rawHtml);
  await updateTemplateVersion(templateId, session.userId, sanitized, {});
  await logAudit("TEMPLATE_PUBLISHED", { templateId, action: "update_html" }, session.userId, undefined);
  revalidatePath("/admin/templates");
}

// ============================================================================
// REMOVER VISIBILIDADE (TAKEN_DOWN)
// ============================================================================
export async function hideTemplateAction(templateId: string) {
  const session = await getSession();
  if (!session?.email || !session.userId) {
    throw new Error("Não autenticado.");
  }

  const template = await prisma.template.findUnique({
    where: { id: templateId },
    select: { authorId: true, status: true },
  });
  if (!template) throw new Error("Template não encontrado.");
  if (template.authorId !== session.userId) throw new Error("Você não é o autor deste template.");
  if (template.status !== "PUBLISHED") throw new Error("Apenas templates publicados podem ser ocultados.");

  await prisma.template.update({
    where: { id: templateId },
    data: { status: "TAKEN_DOWN" },
  });

  await logAudit("TEMPLATE_TAKEN_DOWN", { templateId, action: "author_hide" }, session.userId, undefined);
  revalidatePath("/admin/templates");
}

// ============================================================================
// REPUBLICAR (TAKEN_DOWN → PENDING_REVIEW)
// ============================================================================
export async function republishTemplateAction(templateId: string) {
  const session = await getSession();
  if (!session?.email || !session.userId) {
    throw new Error("Não autenticado.");
  }

  const template = await prisma.template.findUnique({
    where: { id: templateId },
    select: { authorId: true, status: true },
  });
  if (!template) throw new Error("Template não encontrado.");
  if (template.authorId !== session.userId) throw new Error("Você não é o autor deste template.");
  if (template.status !== "TAKEN_DOWN") throw new Error("Apenas templates removidos podem ser republicados.");

  await prisma.template.update({
    where: { id: templateId },
    data: { status: "PENDING_REVIEW", rejectionReason: null },
  });

  await logAudit("TEMPLATE_PUBLISHED", { templateId, action: "republish" }, session.userId, undefined);
  revalidatePath("/admin/templates");
}

// ============================================================================
// EXCLUIR TEMPLATE
// ============================================================================
export async function deleteTemplateAction(templateId: string) {
  const session = await getSession();
  if (!session?.email || !session.userId) {
    throw new Error("Não autenticado.");
  }

  const template = await prisma.template.findUnique({
    where: { id: templateId },
    select: { authorId: true, thumbnailUrl: true, _count: { select: { usages: true } } },
  });
  if (!template) throw new Error("Template não encontrado.");
  if (template.authorId !== session.userId) throw new Error("Você não é o autor deste template.");

  // Não permitir excluir se tem usos (outros usuários usaram)
  if (template._count.usages > 0) {
    throw new Error("Este template está em uso por outros usuários. Use 'Remover visibilidade' em vez de excluir.");
  }

  if (template.thumbnailUrl) {
    await deleteFileFromR2(template.thumbnailUrl);
  }

  await prisma.template.delete({ where: { id: templateId } });
  await logAudit("TEMPLATE_TAKEN_DOWN", { templateId, action: "delete" }, session.userId, undefined);
  revalidatePath("/admin/templates");
}