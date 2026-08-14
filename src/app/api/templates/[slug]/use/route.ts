import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { hasFeature } from "@/lib/plans";
import { logAudit } from "@/lib/audit";
import { rateLimit } from "@/lib/rate-limit";

const SLUG_REGEX = /^[a-z0-9-]{1,100}$/;

/**
 * POST /api/templates/[slug]/use
 *
 * Usa um template publicado para criar uma nova campanha.
 * Requer autenticação e plano com useTemplates.
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  // Validação de slug
  if (!SLUG_REGEX.test(slug)) {
    return NextResponse.json({ error: "Template não encontrado." }, { status: 404 });
  }

  try {
    // 1. Autenticar
    const session = await getSession();
    if (!session?.userId || !session?.tenantId) {
      return NextResponse.json({ error: "Faça login para usar este template." }, { status: 401 });
    }

    const { userId, tenantId } = session;

    // Rate limit por tenant (autenticado)
    const rl = await rateLimit(`template:use:${tenantId}`, {
      windowSeconds: 60,
      maxRequests: 10,
    });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Muitas requisições. Tente novamente em instantes." },
        { status: 429, headers: { "Retry-After": String(rl.resetIn) } }
      );
    }

    // 2. Buscar tenant para checar plano
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { id: true, plan: true },
    });

    if (!tenant) {
      return NextResponse.json({ error: "Tenant não encontrado." }, { status: 404 });
    }

    // 3. Check de plano (usar template = todos os planos)
    if (!hasFeature(tenant.plan, "useTemplates")) {
      return NextResponse.json(
        { error: "Seu plano não permite usar templates." },
        { status: 403 }
      );
    }

    // 4. Buscar template e versão ativa
    const template = await prisma.template.findUnique({
      where: { slug },
      include: {
        versions: {
          where: { status: "PUBLISHED" },
          orderBy: { version: "desc" },
          take: 1,
        },
      },
    });

    if (!template || template.status !== "PUBLISHED") {
      return NextResponse.json({ error: "Template não encontrado." }, { status: 404 });
    }

    const activeVersion = template.versions[0];
    if (!activeVersion) {
      return NextResponse.json({ error: "Template sem versão publicada." }, { status: 404 });
    }

    // 5. Checar limite de campanhas
    const campaignCount = await prisma.campaign.count({ where: { tenantId } });
    const limits: Record<string, number> = { FREE: 1, PRO: 10, ULTRA: -1 };
    const maxCampaigns = limits[tenant.plan] ?? 1;
    if (maxCampaigns !== -1 && campaignCount >= maxCampaigns) {
      return NextResponse.json(
        { error: "Limite de campanhas atingido para o seu plano. Faça upgrade para criar mais." },
        { status: 403 }
      );
    }

    // 6. Criar campanha a partir do template (transação)
    const campaign = await prisma.$transaction(async (tx) => {
      // slug único
      const baseSlug = `template-${template.slug}`.slice(0, 60);
      let uniqueSlug = baseSlug;
      let suffix = 1;
      while (await tx.campaign.findUnique({
        where: { tenantId_slug: { tenantId, slug: uniqueSlug } },
      })) {
        uniqueSlug = `${baseSlug}-${suffix}`;
        suffix++;
      }

      const c = await tx.campaign.create({
        data: {
          tenantId,
          slug: uniqueSlug,
          name: template.name,
          rawHtml: activeVersion.rawHtml,
          formSchema: (activeVersion.formSchema ?? {}) as object,
          templateOriginId: template.id,
        },
      });

      // Registrar uso
      await tx.templateUsage.create({
        data: {
          templateId: template.id,
          tenantId,
          campaignId: c.id,
        },
      });

      // Incrementar contador
      await tx.template.update({
        where: { id: template.id },
        data: { useCount: { increment: 1 } },
      });

      return c;
    });

    // 7. Audit log
    await logAudit(
      "TEMPLATE_CLONED",
      { templateId: template.id, campaignId: campaign.id },
      userId,
      tenantId
    );

    return NextResponse.json({
      success: true,
      campaignId: campaign.id,
    });
  } catch (error) {
    console.error("Use template error:", error);
    return NextResponse.json({ error: "Erro ao usar template." }, { status: 500 });
  }
}