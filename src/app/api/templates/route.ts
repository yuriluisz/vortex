import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { TemplateCategory, TemplateTheme } from "@prisma/client";

const ListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(10000).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  category: z.nativeEnum(TemplateCategory).optional(),
  theme: z.nativeEnum(TemplateTheme).optional(),
  search: z.string().trim().max(100).optional(),
});

/**
 * GET /api/templates
 *
 * Lista templates publicados para o template picker.
 * Retorna dados resumidos (sem HTML).
 */
export async function GET(request: Request) {
  // Rate limit por IP (rota pública)
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const rl = await rateLimit(`template:list:${ip}`, {
    windowSeconds: 60,
    maxRequests: 120,
  });
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Muitas requisições. Tente novamente em instantes." },
      { status: 429, headers: { "Retry-After": String(rl.resetIn) } }
    );
  }

  const { searchParams } = new URL(request.url);
  const parsed = ListQuerySchema.safeParse({
    page: searchParams.get("page") ?? undefined,
    pageSize: searchParams.get("pageSize") ?? undefined,
    category: searchParams.get("category") ?? undefined,
    theme: searchParams.get("theme") ?? undefined,
    search: searchParams.get("search") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Parâmetros de consulta inválidos.", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { page, pageSize, category, theme, search } = parsed.data;

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

  const [templates, total] = await Promise.all([
    prisma.template.findMany({
      where: where as never,
      orderBy: [{ useCount: "desc" }, { createdAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        slug: true,
        name: true,
        description: true,
        category: true,
        theme: true,
        _count: {
          select: { usages: true, likes: true },
        },
      },
    }),
    prisma.template.count({ where: where as never }),
  ]);

  return NextResponse.json({
    templates,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  });
}