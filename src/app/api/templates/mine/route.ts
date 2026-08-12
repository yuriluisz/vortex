import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();
  if (!session?.email || !session.userId) {
    return NextResponse.json({ templates: [] }, { status: 401 });
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