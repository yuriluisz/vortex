import "server-only";

import { prisma } from "@/lib/prisma";
import { sanitizeTemplateHtml } from "@/lib/template-sanitizer";
import type { TemplateStatus, TemplateCategory, TemplateTheme } from "@prisma/client";

/**
 * Gera um slug único para um template a partir do nome.
 */
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

/**
 * Gera um slug único (evitando colisões).
 */
async function generateUniqueSlug(name: string): Promise<string> {
  const base = generateSlug(name);
  let slug = base;
  let counter = 1;

  while (await prisma.template.findUnique({ where: { slug } })) {
    slug = `${base}-${counter}`;
    counter++;
  }

  return slug;
}

/**
 * Dados necessários para publicar um template.
 */
export interface PublishTemplateInput {
  name: string;
  description?: string;
  rawHtml: string;
  formSchema: unknown;
  category: TemplateCategory;
  theme: TemplateTheme;
  primaryColor?: string;
  typography?: string;
  productType?: string;
  tags?: string[];
  sourceCampaignId?: string;
  thumbnailUrl?: string;
}

/**
 * Publica um novo template a partir de uma campanha.
 *
 * Passos:
 * 1. Sanitiza o HTML (removendo scripts, handlers, etc.)
 * 2. Cria o registro Template com status PENDING_REVIEW
 * 3. Cria a primeira TemplateVersion
 * 4. Registra no audit log
 *
 * @returns O template criado
 */
export async function publishTemplate(
  authorId: string,
  tenantId: string,
  input: PublishTemplateInput
) {
  // 1. Sanitizar o HTML
  const sanitizedHtml = sanitizeTemplateHtml(input.rawHtml);

  // 2. Gerar slug
  const slug = await generateUniqueSlug(input.name);

  // 3. Criar template + primeira versão em transação
  const template = await prisma.$transaction(async (tx) => {
    const t = await tx.template.create({
      data: {
        slug,
        name: input.name,
        description: input.description,
        thumbnailUrl: input.thumbnailUrl,
        category: input.category,
        theme: input.theme,
        primaryColor: input.primaryColor ?? "#000000",
        typography: input.typography,
        productType: input.productType,
        tags: input.tags ?? [],
        status: "PENDING_REVIEW",
        sourceCampaignId: input.sourceCampaignId,
        authorId,
        tenantId,
        versions: {
          create: {
            version: 1,
            rawHtml: sanitizedHtml,
            formSchema: input.formSchema as object,
            status: "PENDING_REVIEW",
          },
        },
      },
      include: {
        versions: {
          orderBy: { version: "desc" },
          take: 1,
        },
      },
    });

    return t;
  });

  return template;
}

/**
 * Dados para clonar um template em uma campanha.
 */
export interface CloneTemplateResult {
  rawHtml: string;
  formSchema: unknown;
  templateId: string;
  templateName: string;
}

/**
 * Clona um template publicado para uma campanha.
 *
 * Passos:
 * 1. Busca a versão ativa do template
 * 2. Verifica se o usuário pode usar templates (plano)
 * 3. Retorna o HTML e formSchema para usar na criação da campanha
 * 4. Registra o uso
 *
 * @returns O HTML e formSchema para usar na campanha
 */
export async function cloneTemplate(
  templateId: string,
  tenantId: string,
  campaignId: string
): Promise<CloneTemplateResult> {
  const template = await prisma.template.findUnique({
    where: { id: templateId },
    include: {
      versions: {
        where: { status: "PUBLISHED" },
        orderBy: { version: "desc" },
        take: 1,
      },
    },
  });

  if (!template) {
    throw new Error("Template não encontrado.");
  }

  if (template.status !== "PUBLISHED") {
    throw new Error("Template não está publicado.");
  }

  const activeVersion = template.versions[0];
  if (!activeVersion) {
    throw new Error("Template não possui uma versão publicada.");
  }

  // Registrar o uso
  await prisma.templateUsage.create({
    data: {
      templateId,
      tenantId,
      campaignId,
    },
  });

  // Incrementar contador de uso
  await prisma.template.update({
    where: { id: templateId },
    data: { useCount: { increment: 1 } },
  });

  // Atualizar a campanha com a origem do template
  await prisma.campaign.update({
    where: { id: campaignId },
    data: { templateOriginId: templateId },
  });

  return {
    rawHtml: activeVersion.rawHtml,
    formSchema: activeVersion.formSchema,
    templateId: template.id,
    templateName: template.name,
  };
}

/**
 * Atualiza a versão de um template (versionamento).
 * A nova versão vai para PENDING_REVIEW, a versão ativa permanece.
 */
export async function updateTemplateVersion(
  templateId: string,
  authorId: string,
  rawHtml: string,
  formSchema: unknown
) {
  // Verificar ownership
  const template = await prisma.template.findUnique({
    where: { id: templateId },
  });

  if (!template) {
    throw new Error("Template não encontrado.");
  }

  if (template.authorId !== authorId) {
    throw new Error("Você não é o autor deste template.");
  }

  // Sanitizar
  const sanitizedHtml = sanitizeTemplateHtml(rawHtml);

  // Pegar próxima versão
  const lastVersion = await prisma.templateVersion.findFirst({
    where: { templateId },
    orderBy: { version: "desc" },
  });

  const nextVersion = (lastVersion?.version ?? 0) + 1;

  // Criar nova versão em PENDING_REVIEW
  const version = await prisma.templateVersion.create({
    data: {
      templateId,
      version: nextVersion,
      rawHtml: sanitizedHtml,
      formSchema: formSchema as object,
      status: "PENDING_REVIEW",
    },
  });

  return version;
}

/**
 * Busca templates publicados com filtros.
 */
export async function getPublishedTemplates(params: {
  category?: TemplateCategory;
  theme?: TemplateTheme;
  search?: string;
  tags?: string[];
  sort?: "recent" | "popular" | "most_used";
  page?: number;
  pageSize?: number;
}) {
  const {
    category,
    theme,
    search,
    tags,
    sort = "recent",
    page = 1,
    pageSize = 20,
  } = params;

  const where: Record<string, unknown> = {
    status: "PUBLISHED",
  };

  if (category) where.category = category;
  if (theme) where.theme = theme;
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ];
  }
  if (tags && tags.length > 0) {
    where.tags = { hasSome: tags };
  }

  const orderBy =
    sort === "popular"
      ? { likeCount: "desc" as const }
      : sort === "most_used"
        ? { useCount: "desc" as const }
        : { createdAt: "desc" as const };

  const [templates, total] = await Promise.all([
    prisma.template.findMany({
      where: where as never,
      orderBy: [orderBy, { createdAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        author: {
          select: {
            id: true,
            handle: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        _count: {
          select: {
            likes: true,
            usages: true,
          },
        },
      },
    }),
    prisma.template.count({ where: where as never }),
  ]);

  return {
    templates,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

/**
 * Busca um template específico com sua versão ativa.
 */
export async function getTemplateWithActiveVersion(slug: string) {
  const template = await prisma.template.findUnique({
    where: { slug },
    include: {
      versions: {
        where: { status: "PUBLISHED" },
        orderBy: { version: "desc" },
        take: 1,
      },
      author: {
        select: {
          id: true,
          handle: true,
          displayName: true,
          avatarUrl: true,
          bio: true,
        },
      },
      _count: {
        select: {
          likes: true,
          usages: true,
        },
      },
    },
  });

  if (!template) return null;

  // Incrementar view count
  await prisma.template.update({
    where: { id: template.id },
    data: { viewCount: { increment: 1 } },
  });

  return template;
}

/**
 * Busca templates de um autor específico.
 */
export async function getAuthorTemplates(authorId: string) {
  return prisma.template.findMany({
    where: {
      authorId,
      status: { in: ["PUBLISHED", "PENDING_REVIEW", "DRAFT"] },
    },
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { likes: true, usages: true },
      },
    },
  });
}

/**
 * Troca o status de um template (moderação).
 */
export async function updateTemplateStatus(
  templateId: string,
  status: TemplateStatus,
  reason?: string
) {
  const template = await prisma.template.update({
    where: { id: templateId },
    data: {
      status,
      ...(reason ? { rejectionReason: reason } : {}),
    },
  });

  // Se foi aprovado, publicar a versão pendente mais recente
  if (status === "PUBLISHED") {
    const pendingVersion = await prisma.templateVersion.findFirst({
      where: {
        templateId,
        status: "PENDING_REVIEW",
      },
      orderBy: { version: "desc" },
    });

    if (pendingVersion) {
      await prisma.templateVersion.update({
        where: { id: pendingVersion.id },
        data: {
          status: "PUBLISHED",
          publishedAt: new Date(),
        },
      });
    }
  }

  return template;
}

/**
 * Verifica se o usuário pode publicar templates baseado no plano.
 */
export function canPublishTemplate(plan: string): boolean {
  return plan === "PRO" || plan === "ULTRA";
}