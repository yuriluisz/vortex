"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Plus,
  Megaphone,
  CheckCircle2,
  XCircle,
  Users,
  MessageCircle,
  ExternalLink,
  Search,
  Copy,
  Check,
  LayoutGrid,
  List,
} from "lucide-react";
import { GlowCard } from "@/components/ui/glow-card";
import { DotGrid } from "@/components/ui/dot-grid";

export interface CampaignListItem {
  id: string;
  name: string;
  slug: string;
  active: boolean;
  _count: {
    leads: number;
    groups: number;
  };
}

interface CampaignsClientProps {
  initialCampaigns: CampaignListItem[];
}

export function CampaignsClient({ initialCampaigns }: CampaignsClientProps) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "inactive">("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredCampaigns = useMemo(() => {
    return initialCampaigns.filter((campaign) => {
      const matchesSearch =
        campaign.name.toLowerCase().includes(search.toLowerCase()) ||
        campaign.slug.toLowerCase().includes(search.toLowerCase());

      if (!matchesSearch) return false;

      if (filter === "active") return campaign.active;
      if (filter === "inactive") return !campaign.active;
      return true;
    });
  }, [initialCampaigns, search, filter]);

  const handleCopyLink = (e: React.MouseEvent, campaign: CampaignListItem) => {
    e.preventDefault();
    e.stopPropagation();

    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
    const url = `${baseUrl}/${campaign.slug}`;

    navigator.clipboard.writeText(url);
    setCopiedId(campaign.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="mx-auto max-w-7xl w-full px-1 sm:px-0">
      {/* Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-foreground tracking-tight">Campanhas</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Gerencie e monitore suas campanhas de lançamento em tempo real.
          </p>
        </div>
        <Link
          href="/admin/campaigns/new"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-[0_0_15px_rgba(var(--primary),0.4)] transition-all hover:bg-primary/90 hover:scale-105 active:scale-[0.97]"
        >
          <Plus className="h-4 w-4" />
          Nova Campanha
        </Link>
      </div>

      {/* Toolbar: Search, Filters & View Toggle */}
      {initialCampaigns.length > 0 && (
        <div className="mb-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nome ou slug..."
              className="w-full rounded-xl border border-border/60 bg-card/40 backdrop-blur-md pl-10 pr-4 py-2 text-sm text-foreground placeholder-muted-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-2 flex-wrap sm:flex-nowrap">
            {/* Filter Tabs */}
            <div className="inline-flex rounded-xl border border-border/60 bg-card/40 backdrop-blur-md p-1 overflow-x-auto max-w-full">
              <button
                type="button"
                onClick={() => setFilter("all")}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                  filter === "all"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Todas ({initialCampaigns.length})
              </button>
              <button
                type="button"
                onClick={() => setFilter("active")}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                  filter === "active"
                    ? "bg-emerald-500 text-white shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Ativas ({initialCampaigns.filter((c) => c.active).length})
              </button>
              <button
                type="button"
                onClick={() => setFilter("inactive")}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                  filter === "inactive"
                    ? "bg-muted text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Inativas ({initialCampaigns.filter((c) => !c.active).length})
              </button>
            </div>

            {/* View Mode Toggle */}
            <div className="hidden sm:inline-flex rounded-xl border border-border/60 bg-card/40 backdrop-blur-md p-1">
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                title="Grade"
                className={`rounded-lg p-1.5 transition-all ${
                  viewMode === "grid"
                    ? "bg-primary/20 text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("list")}
                title="Lista"
                className={`rounded-lg p-1.5 transition-all ${
                  viewMode === "list"
                    ? "bg-primary/20 text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {initialCampaigns.length === 0 ? (
        <div className="glass-panel rounded-xl p-8 sm:p-16 text-center relative overflow-hidden">
          <DotGrid />
          <div className="relative z-10">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 shadow-[0_0_20px_rgba(var(--primary),0.2)] mb-4">
              <Megaphone className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Nenhuma campanha encontrada</h3>
            <p className="text-muted-foreground mb-6 max-w-sm mx-auto text-sm">
              Você ainda não criou nenhuma campanha. Comece criando seu primeiro lançamento agora mesmo.
            </p>
            <Link
              href="/admin/campaigns/new"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-md transition-all hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
              Criar Campanha
            </Link>
          </div>
        </div>
      ) : filteredCampaigns.length === 0 ? (
        <div className="glass-panel rounded-xl p-12 text-center">
          <p className="text-sm text-muted-foreground">Nenhuma campanha corresponde à busca &quot;{search}&quot;.</p>
        </div>
      ) : viewMode === "grid" ? (
        /* Grid View */
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredCampaigns.map((campaign) => (
            <Link key={campaign.id} href={`/admin/campaigns/${campaign.id}`} className="group block">
              <GlowCard className="flex flex-col rounded-xl border border-border/50 bg-card/40 backdrop-blur-sm overflow-hidden shadow-sm h-full transition-all duration-300 hover:border-primary/40">
                {/* Status Bar */}
                <div
                  className={`h-1 w-full ${
                    campaign.active
                      ? "bg-primary shadow-[0_0_8px_rgba(var(--primary),0.8)]"
                      : "bg-muted-foreground/30"
                  }`}
                />

                <div className="p-4 sm:p-6 flex flex-col flex-1 relative z-10">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0 pr-2">
                      <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                        {campaign.name}
                      </h3>
                      <div className="mt-1.5 inline-flex items-center gap-1.5 rounded-md bg-white/5 border border-white/10 px-2 py-0.5 text-xs font-medium text-muted-foreground font-mono">
                        <ExternalLink className="h-3 w-3" />
                        /{campaign.slug}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button
                        type="button"
                        onClick={(e) => handleCopyLink(e, campaign)}
                        title="Copiar Link"
                        className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
                      >
                        {copiedId === campaign.id ? (
                          <Check className="h-3.5 w-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </button>
                      {campaign.active ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-primary/20 border border-primary/30 px-2.5 py-1 text-[10px] font-bold text-primary uppercase tracking-wider shadow-[0_0_10px_rgba(var(--primary),0.2)]">
                          <CheckCircle2 className="h-3 w-3" />
                          Ativa
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-muted/50 border border-muted px-2.5 py-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                          <XCircle className="h-3 w-3" />
                          Inativa
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-auto grid grid-cols-2 gap-4 border-t border-border/50 pt-4">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-chart-2/10 text-chart-2">
                        <Users className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">Leads</p>
                        <p className="text-lg font-bold text-foreground tabular-nums">{campaign._count.leads}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-chart-3/10 text-chart-3">
                        <MessageCircle className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">Grupos</p>
                        <p className="text-lg font-bold text-foreground tabular-nums">{campaign._count.groups}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </GlowCard>
            </Link>
          ))}
        </div>
      ) : (
        /* List View */
        <div className="glass-panel rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-left text-sm text-muted-foreground">
            <thead className="bg-muted/50 text-xs uppercase text-muted-foreground border-b border-border/60">
              <tr>
                <th className="px-6 py-4 font-semibold">Campanha</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold text-center">Leads</th>
                <th className="px-6 py-4 font-semibold text-center">Grupos</th>
                <th className="px-6 py-4 font-semibold text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {filteredCampaigns.map((campaign) => (
                <tr key={campaign.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-4">
                    <Link href={`/admin/campaigns/${campaign.id}`} className="block group">
                      <p className="font-semibold text-foreground group-hover:text-primary transition-colors">
                        {campaign.name}
                      </p>
                      <p className="text-xs text-muted-foreground font-mono mt-0.5">/{campaign.slug}</p>
                    </Link>
                  </td>
                  <td className="px-6 py-4">
                    {campaign.active ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-primary/20 border border-primary/30 px-2.5 py-0.5 text-[10px] font-bold text-primary uppercase">
                        <CheckCircle2 className="h-3 w-3" />
                        Ativa
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-muted/50 border border-muted px-2.5 py-0.5 text-[10px] font-bold text-muted-foreground uppercase">
                        <XCircle className="h-3 w-3" />
                        Inativa
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center font-bold text-foreground tabular-nums">
                    {campaign._count.leads}
                  </td>
                  <td className="px-6 py-4 text-center font-bold text-foreground tabular-nums">
                    {campaign._count.groups}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={(e) => handleCopyLink(e, campaign)}
                        title="Copiar Link"
                        className="rounded-lg p-2 text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
                      >
                        {copiedId === campaign.id ? (
                          <Check className="h-4 w-4 text-emerald-400" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </button>
                      <Link
                        href={`/admin/campaigns/${campaign.id}`}
                        className="rounded-lg px-3 py-1.5 text-xs font-semibold bg-white/5 border border-white/10 hover:bg-white/10 text-foreground transition-all"
                      >
                        Editar
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
