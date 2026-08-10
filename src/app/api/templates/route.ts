import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/templates
 *
 * Lista templates publicados para o template picker.
 * Retorna dados resumidos (sem HTML).
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const pageSize = Math.min(parseInt(searchParams.get("pageSize") ?? "20"), 100);
  const page = Math.max(parseInt(searchParams.get("page") ?? "1"), 1);
  const category = searchParams.get("category");
  const theme = searchParams.get("theme");
  const search = searchParams.get("search");

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