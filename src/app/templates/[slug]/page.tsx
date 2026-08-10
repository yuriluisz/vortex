import { notFound } from "next/navigation";
import { getTemplateWithActiveVersion } from "@/services/template.service";
import { Heart, Eye, Copy, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { TemplatePreview } from "@/components/templates/template-preview";
import { TemplateUseButton } from "@/components/templates/template-use-button";

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

  const labels: Record<string, string> = {
    LANDING_PAGE: "Landing Page",
    SQUEEZE_PAGE: "Squeeze Page",
    WEBINAR: "Webinar",
    ECOMMERCE: "E-commerce",
    INFOPRODUCT: "Infoproduto",
    PORTFOLIO: "Portfólio",
    EVENT: "Evento",
    OTHER: "Outro",
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <Link
          href="/templates"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para Templates
        </Link>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Preview */}
          <div className="rounded-xl border border-border/40 overflow-hidden bg-white h-[600px]">
            <TemplatePreview
              templateId={template.id}
              slug={template.slug}
              name={template.name}
            />
          </div>

          {/* Info */}
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs px-2 py-0.5 rounded-full bg-black/10">
                  {labels[template.category] ?? template.category}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-black/10">
                  {template.theme}
                </span>
              </div>
              <h1 className="text-3xl font-bold tracking-tight">{template.name}</h1>
              {template.description && (
                <p className="mt-3 text-muted-foreground leading-relaxed">
                  {template.description}
                </p>
              )}
            </div>

            {/* Author */}
            {template.author && (
              <div className="flex items-center gap-3 p-4 rounded-xl border border-border/40">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-lg font-bold">
                  {template.author.displayName?.[0] ?? "?"}
                </div>
                <div>
                  <div className="font-medium">{template.author.displayName ?? "Autor anônimo"}</div>
                  {template.author.handle && (
                    <Link
                      href={`/community/${template.author.handle}`}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      @{template.author.handle}
                    </Link>
                  )}
                </div>
              </div>
            )}

            {/* Stats */}
            <div className="flex gap-6 text-sm text-muted-foreground pb-2 border-b border-border/40">
              <span className="flex items-center gap-1.5">
                <Eye className="w-4 h-4" />
                {template.viewCount} visualizações
              </span>
              <span className="flex items-center gap-1.5">
                <Copy className="w-4 h-4" />
                {template._count.usages} usos
              </span>
              <span className="flex items-center gap-1.5">
                <Heart className="w-4 h-4" />
                {template._count.likes} curtidas
              </span>
            </div>

            {/* Tags */}
            {template.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {template.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs px-2.5 py-1 rounded-full bg-muted text-muted-foreground"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* Actions */}
            <TemplateUseButton templateSlug={template.slug} />
          </div>
        </div>
      </div>
    </div>
  );
}