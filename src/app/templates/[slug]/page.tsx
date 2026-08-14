import { notFound } from "next/navigation";
import { getTemplateWithActiveVersion } from "@/services/template.service";
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

  return <TemplateDetailClient template={template} />;
}