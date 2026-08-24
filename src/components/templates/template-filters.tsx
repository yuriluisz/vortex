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
      <div className="mx-auto max-w-[1400px] px-4 sm:px-8 lg:px-12">
        {/* Mobile toggle */}
        <div className="flex items-center justify-between py-3 sm:hidden">
          <button
            onClick={() => setShowMobileFilters(!showMobileFilters)}
            className="flex items-center gap-2 text-xs font-semibold text-neutral-300 hover:text-white transition-colors bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg"
          >
            <span>Filtros</span>
            <span className="bg-primary/20 text-primary text-[10px] px-1.5 py-0.2 rounded-full font-bold">
              {(currentCategory ? 1 : 0) + (currentTheme ? 1 : 0) + (currentSort !== "recent" ? 1 : 0) + (currentSearch ? 1 : 0)}
            </span>
          </button>
          {hasActiveFilters && (
            <button
              onClick={clearAll}
              className="text-xs text-primary font-medium hover:underline"
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
                  className="w-full pl-9 pr-10 py-2 text-xs sm:text-sm rounded-xl border border-white/15 bg-white/[0.05] text-white placeholder:text-neutral-400 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                />
                {searchInput && (
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    aria-label="Limpar busca"
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-white/10 transition-colors"
                  >
                    <X className="w-3.5 h-3.5 text-neutral-400" />
                  </button>
                )}
              </form>

              {/* Pills container */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                {/* Category pills */}
                <div className="flex flex-wrap gap-1.5">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.value}
                      onClick={() => updateFilter("category", cat.value)}
                      aria-pressed={currentCategory === cat.value}
                      className={`px-2.5 sm:px-3 py-1 sm:py-1.5 text-[11px] sm:text-xs font-medium rounded-lg transition-all duration-200 ${
                        currentCategory === cat.value
                          ? "bg-primary text-primary-foreground shadow-sm font-semibold"
                          : "bg-white/[0.05] border border-white/10 text-neutral-300 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                <div className="hidden sm:block h-4 w-px bg-white/10 mx-1 flex-shrink-0" />

                {/* Theme pills */}
                <div className="flex flex-wrap gap-1.5">
                  {THEMES.map((theme) => (
                    <button
                      key={theme.value}
                      onClick={() => updateFilter("theme", theme.value)}
                      aria-pressed={currentTheme === theme.value}
                      className={`px-2.5 sm:px-3 py-1 sm:py-1.5 text-[11px] sm:text-xs font-medium rounded-lg transition-all duration-200 ${
                        currentTheme === theme.value
                          ? "bg-primary text-primary-foreground shadow-sm font-semibold"
                          : "bg-white/[0.05] border border-white/10 text-neutral-300 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      {theme.label}
                    </button>
                  ))}
                </div>

                <div className="hidden sm:block h-4 w-px bg-white/10 mx-1 flex-shrink-0" />

                {/* Sort select */}
                <div className="flex items-center gap-2 justify-between sm:justify-start">
                  <select
                    value={currentSort}
                    onChange={(e) => updateFilter("sort", e.target.value)}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg bg-white/[0.05] text-neutral-300 border border-white/10 focus:border-primary outline-none cursor-pointer transition-all [&>option]:bg-neutral-950 [&>option]:text-white"
                  >
                    {SORT_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>

                  {/* Clear all in desktop */}
                  {hasActiveFilters && (
                    <button
                      onClick={clearAll}
                      className="hidden sm:inline-block ml-auto text-xs text-neutral-400 hover:text-rose-400 transition-colors"
                    >
                      Limpar tudo
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
      </div>
    </div>
  );
}