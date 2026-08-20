"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { useState } from "react";

interface TemplateFiltersProps {
  currentCategory?: string;
  currentTheme?: string;
  currentSort?: string;
  currentSearch?: string;
}

const CATEGORIES = [
  { value: "", label: "Todos" },
  { value: "LANDING_PAGE", label: "Landing Page" },
  { value: "SQUEEZE_PAGE", label: "Squeeze" },
  { value: "WEBINAR", label: "Webinar" },
  { value: "ECOMMERCE", label: "E-commerce" },
  { value: "INFOPRODUCT", label: "Infoproduto" },
  { value: "PORTFOLIO", label: "Portfólio" },
  { value: "EVENT", label: "Evento" },
  { value: "OTHER", label: "Outro" },
];

const THEMES = [
  { value: "", label: "Todos" },
  { value: "DARK", label: "Escuro" },
  { value: "LIGHT", label: "Claro" },
  { value: "COLORFUL", label: "Colorido" },
];

const SORT_OPTIONS = [
  { value: "recent", label: "Recentes" },
  { value: "popular", label: "Populares" },
  { value: "most_used", label: "Mais usados" },
];

export function TemplateFilters({
  currentCategory = "",
  currentTheme = "",
  currentSort = "recent",
  currentSearch = "",
}: TemplateFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchInput, setSearchInput] = useState(currentSearch);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete("page");
    router.push(`/templates?${params.toString()}`);
  }

  function handleSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    updateFilter("search", searchInput);
  }

  function handleClearSearch() {
    setSearchInput("");
    updateFilter("search", "");
  }

  function clearAll() {
    setSearchInput("");
    router.push("/templates");
  }

  const hasActiveFilters = currentCategory || currentTheme || currentSort !== "recent" || currentSearch;

  return (
    <div className="sticky top-16 z-40 border-b border-white/10 bg-black/90 backdrop-blur-xl">
      <div className="mx-auto max-w-[1400px] px-6 sm:px-8 lg:px-12">
        {/* Mobile toggle */}
        <div className="flex items-center justify-between py-3 sm:hidden">
          <button
            onClick={() => setShowMobileFilters(!showMobileFilters)}
            className="text-sm font-medium text-neutral-400 hover:text-white transition-colors"
          >
            Filtros ({(currentCategory ? 1 : 0) + (currentTheme ? 1 : 0) + (currentSort !== "recent" ? 1 : 0) + (currentSearch ? 1 : 0)})
          </button>
          {hasActiveFilters && (
            <button
              onClick={clearAll}
              className="text-xs text-primary hover:underline"
            >
              Limpar tudo
            </button>
          )}
        </div>

        {/* Filters content */}
        <div className={`py-4 ${showMobileFilters ? "block" : "hidden sm:block"}`}>
            <div className="flex flex-col gap-4">
              {/* Search bar */}
              <form onSubmit={handleSearch} className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Buscar templates..."
                  className="w-full pl-9 pr-10 py-2.5 text-sm rounded-lg border border-white/15 bg-white/[0.05] text-white placeholder:text-neutral-400 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                />
                {searchInput && (
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    aria-label="Limpar busca"
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-white/10 transition-colors"
                  >
                    <X className="w-3.5 h-3.5 text-neutral-400" />
                  </button>
                )}
              </form>

              {/* Pills row */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Category pills */}
                <div className="flex flex-wrap gap-1.5">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.value}
                      onClick={() => updateFilter("category", cat.value)}
                      aria-pressed={currentCategory === cat.value}
                      className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all duration-200 ${
                        currentCategory === cat.value
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "bg-white/[0.05] border border-white/10 text-neutral-300 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                <div className="h-4 w-px bg-white/10 mx-1" />

                {/* Theme pills */}
                <div className="flex flex-wrap gap-1.5">
                  {THEMES.map((theme) => (
                    <button
                      key={theme.value}
                      onClick={() => updateFilter("theme", theme.value)}
                      aria-pressed={currentTheme === theme.value}
                      className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all duration-200 ${
                        currentTheme === theme.value
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "bg-white/[0.05] border border-white/10 text-neutral-300 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      {theme.label}
                    </button>
                  ))}
                </div>

                <div className="h-4 w-px bg-white/10 mx-1" />

                {/* Sort select */}
                <select
                  value={currentSort}
                  onChange={(e) => updateFilter("sort", e.target.value)}
                  className="px-3 py-1.5 text-xs font-medium rounded-full bg-white/[0.05] text-neutral-300 border border-white/10 focus:border-primary outline-none cursor-pointer transition-all [&>option]:bg-neutral-950 [&>option]:text-white"
                >
                  {SORT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>

                {/* Clear all */}
                {hasActiveFilters && (
                  <button
                    onClick={clearAll}
                    className="ml-auto text-xs text-neutral-400 hover:text-rose-400 transition-colors"
                  >
                    Limpar tudo
                  </button>
                )}
              </div>
            </div>
          </div>
      </div>
    </div>
  );
}