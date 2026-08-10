import { getPublishedTemplates } from "@/services/template.service";
import { TemplateGrid } from "@/components/templates/template-grid";
import { TemplateFilters } from "@/components/templates/template-filters";
import type { TemplateCategory, TemplateTheme } from "@prisma/client";

interface TemplatesPageProps {
  searchParams: Promise<{
    category?: string;
    theme?: string;
    search?: string;
    sort?: string;
    page?: string;
  }>;
}

export const metadata = {
  title: "Templates - Comunidade Vórtex",
  description: "Explore templates de landing pages criados pela comunidade Vórtex.",
};

export default async function TemplatesPage({ searchParams }: TemplatesPageProps) {
  const params = await searchParams;

  const { templates, total, page, totalPages } = await getPublishedTemplates({
    category: params.category as TemplateCategory | undefined,
    theme: params.theme as TemplateTheme | undefined,
    search: params.search,
    sort: params.sort as "recent" | "popular" | "most_used" | undefined,
    page: params.page ? parseInt(params.page) : 1,
    pageSize: 24,
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border/40 bg-gradient-to-b from-background via-background to-muted/30">
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Templates da Comunidade
          </h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Explore landing pages criadas por profissionais da comunidade Vórtex.
            Use como base para suas campanhas e acelere seu processo criativo.
          </p>
        </div>
      </section>

      {/* Filters */}
      <TemplateFilters
        currentCategory={params.category}
        currentTheme={params.theme}
        currentSort={params.sort}
        currentSearch={params.search}
      />

      {/* Grid */}
      <section className="container mx-auto px-4 py-8">
        <TemplateGrid
          templates={templates}
          total={total}
          page={page}
          totalPages={totalPages}
        />
      </section>
    </div>
  );
}