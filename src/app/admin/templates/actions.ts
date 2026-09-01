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

// ============================================================================
// PUBLICAR NOVO TEMPLATE
// ============================================================================
export async function publishTemplateAction(input: {
  name: string;
  description?: string;
  category: TemplateCategory;
  theme: TemplateTheme;
  tags?: string[];
  sourceCampaignId: string;
}) {
  const session = await getSession();
  if (!session?.email || !session.userId || !session.tenantId) {
    throw new Error("Não autenticado.");
  }

  // 🔒 Plan Limit Check: Validar se o plano do tenant autoriza publicação de templates
  const plan = (session.plan || "FREE") as Plan;
  if (!hasFeature(plan, "publishTemplates")) {
    throw new Error("A publicação de templates na comunidade está disponível apenas nos planos PRO e ULTRA.");
  }

  if (!input.name.trim()) throw new Error("Nome é obrigatório.");
  if (!input.sourceCampaignId) throw new Error("Selecione uma campanha.");

  // Verificar que a campanha pertence ao tenant
  const campaign = await prisma.campaign.findFirst({
    where: { id: input.sourceCampaignId, tenantId: session.tenantId },
    select: { id: true, rawHtml: true, formSchema: true },
  });
  if (!campaign) throw new Error("Campanha não encontrada.");

  await publishTemplate(session.userId, session.tenantId, {
    name: input.name.trim(),
    description: input.description?.trim() || undefined,
    category: input.category,
    theme: input.theme,
    tags: input.tags ?? [],
    sourceCampaignId: input.sourceCampaignId,
    rawHtml: campaign.rawHtml,
    formSchema: campaign.formSchema,
  });

  await logAudit("TEMPLATE_PUBLISHED", { name: input.name, action: "publish" }, session.userId, session.tenantId);
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
export async function saveTemplateEditAction(
  templateId: string,
  input: {
    name: string;
    description?: string;
    category: TemplateCategory;
    theme: TemplateTheme;
    tags?: string[];
    rawHtml: string;
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
        },
      });

      // 2. Se HTML mudou, cria nova versão (vai para análise)
      const lastVersion = await tx.templateVersion.findFirst({
        where: { templateId },
        orderBy: { version: "desc" },
      });
      if (lastVersion && input.rawHtml.trim() !== lastVersion.rawHtml.trim()) {
        const sanitized = sanitizeTemplateHtml(input.rawHtml);
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
    select: { authorId: true, _count: { select: { usages: true } } },
  });
  if (!template) throw new Error("Template não encontrado.");
  if (template.authorId !== session.userId) throw new Error("Você não é o autor deste template.");

  // Não permitir excluir se tem usos (outros usuários usaram)
  if (template._count.usages > 0) {
    throw new Error("Este template está em uso por outros usuários. Use 'Remover visibilidade' em vez de excluir.");
  }

  await prisma.template.delete({ where: { id: templateId } });
  await logAudit("TEMPLATE_TAKEN_DOWN", { templateId, action: "delete" }, session.userId, undefined);
  revalidatePath("/admin/templates");
}