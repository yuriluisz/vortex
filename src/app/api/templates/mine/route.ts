import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { rateLimit } from "@/lib/rate-limit";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session?.email || !session.userId) {
    return NextResponse.json({ templates: [] }, { status: 401 });
  }

  // Rate limit por usuário (autenticado)
  const rl = await rateLimit(`template:mine:${session.userId}`, {
    windowSeconds: 60,
    maxRequests: 60,
  });
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Muitas requisições. Tente novamente em instantes." },
      { status: 429, headers: { "Retry-After": String(rl.resetIn) } }
    );
  }

  const templates = await prisma.template.findMany({
    where: {
      authorId: session.userId,
      status: { in: ["PUBLISHED", "PENDING_REVIEW"] },
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      slug: true,
      name: true,
      description: true,
      category: true,
      theme: true,
      _count: { select: { usages: true, likes: true } },
    },
  });

  return NextResponse.json({ templates });
}