import { notFound } from "next/navigation";
import { getTemplateWithActiveVersion } from "@/services/template.service";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import TemplateDetailClient from "./template-detail-client";

export const metadata = {
  title: "Detail - Templates Vórtex",
};

export default async function TemplateDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const template = await getTemplateWithActiveVersion(slug);

  if (!template) {
    notFound();
  }

  const session = await getSession();
  let initialLiked = false;
  if (session?.userId) {
    const like = await prisma.templateLike.findUnique({
      where: {
        templateId_userId: {
          templateId: template.id,
          userId: session.userId,
        },
      },
      select: { id: true },
    });
    initialLiked = !!like;
  }

  return <TemplateDetailClient template={template} initialLiked={initialLiked} />;
}