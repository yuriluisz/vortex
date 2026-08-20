import Link from "next/link";
import { getPublishedTemplates } from "@/services/template.service";
import { TemplateGrid } from "@/components/templates/template-grid";
import { TemplateFilters } from "@/components/templates/template-filters";
import { PublicNav } from "@/components/landing/public-nav";
import { getSession } from "@/lib/session";
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
  title: "Inspire-se · Vórtex+",
  description: "Explore landing pages criadas pela comunidade Vórtex.",
};

export default async function TemplatesPage({ searchParams }: TemplatesPageProps) {
  const params = await searchParams;
  const session = await getSession();
  const isLoggedIn = !!(session?.userId && session?.tenantId);

  const { templates, total, page, totalPages } = await getPublishedTemplates({
    category: params.category as TemplateCategory | undefined,
    theme: params.theme as TemplateTheme | undefined,
    search: params.search,
    sort: params.sort as "recent" | "popular" | "most_used" | undefined,
    page: params.page ? parseInt(params.page) : 1,
    pageSize: 24,
  });

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Navbar */}
      <PublicNav isLoggedIn={isLoggedIn} />

      {/* Spacer for fixed nav */}
      <div className="h-16" />

      {/* Hero — com background-templates */}
      <section className="relative overflow-hidden bg-black border-b border-white/10">
        {/* Background: background-templates.png com horizonte luminoso */}
        <div className="pointer-events-none absolute inset-0 z-0 select-none overflow-hidden flex items-center justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/background-templates.png"
            alt=""
            className="w-full h-full object-cover object-center opacity-75 mix-blend-screen"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,#000000_90%)]" />
        </div>

        <div className="relative z-10 mx-auto max-w-[1400px] px-6 sm:px-8 lg:px-12 py-20 sm:py-28 lg:py-36">
          <span className="inline-block text-xs font-bold uppercase tracking-widest text-primary mb-6">
            Galeria
          </span>
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-white leading-[1.05]">
            Inspire-se.
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-neutral-300 leading-relaxed max-w-xl">
            Landing pages reais criadas pela comunidade. Escolha uma base e lance sua campanha em minutos.
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
      <section className="mx-auto max-w-[1400px] px-6 sm:px-8 lg:px-12 py-12">
        <TemplateGrid
          templates={templates}
          total={total}
          page={page}
          totalPages={totalPages}
        />
      </section>

      {/* CTA Final */}
      <section className="border-t border-white/10 bg-black py-16 sm:py-24">
        <div className="mx-auto max-w-[1400px] px-6 sm:px-8 lg:px-12 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Pronto para criar a sua?
          </h2>
          <p className="mt-3 text-neutral-300 max-w-md mx-auto">
            Comece grátis ou faça upgrade para publicar seus próprios templates na galeria.
          </p>
          {isLoggedIn ? (
            <Link
              href="/admin/templates"
              className="group mt-8 inline-flex items-center gap-2 rounded-full bg-primary px-8 py-3.5 text-sm font-semibold text-primary-foreground shadow-xl shadow-primary/25 transition-all duration-200 hover:bg-primary/90 hover:scale-105 active:scale-95"
            >
              Meus Templates
            </Link>
          ) : (
            <Link
              href="/admin/login?mode=register"
              className="group mt-8 inline-flex items-center gap-2 rounded-full bg-primary px-8 py-3.5 text-sm font-semibold text-primary-foreground shadow-xl shadow-primary/25 transition-all duration-200 hover:bg-primary/90 hover:scale-105 active:scale-95"
            >
              Começar grátis
            </Link>
          )}
        </div>
      </section>
    </div>
  );
}