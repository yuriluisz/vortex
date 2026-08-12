"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { revalidatePath } from "next/cache";
import { logAudit } from "@/lib/audit";
import { publishTemplate, updateTemplateVersion } from "@/services/template.service";
import { sanitizeTemplateHtml } from "@/lib/template-sanitizer";
import type { TemplateCategory, TemplateTheme } from "@prisma/client";

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