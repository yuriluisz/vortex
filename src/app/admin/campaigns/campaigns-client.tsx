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
  Search,
  LayoutGrid,
  List,
  Eye,
  Percent,
  Edit3,
} from "lucide-react";
import { GlowCard } from "@/components/ui/glow-card";
import { DotGrid } from "@/components/ui/dot-grid";
import { CopyCampaignLink } from "@/components/admin/copy-campaign-link";
import { CampaignShareModal } from "@/components/admin/campaign-share-modal";
import { Share2, UserCheck, Shield } from "lucide-react";

export interface CampaignListItem {
  id: string;
  name: string;
  slug: string;
  active: boolean;
  views?: number | null;
  customDomain?: string | null;
  _count: {
    leads: number;
    groups: number;
  };
}

export interface SharedCampaignListItem extends CampaignListItem {
  sharedPermission: "VIEW" | "EDIT";
  sharedByOwnerName: string;
}

interface CampaignsClientProps {
  initialCampaigns: CampaignListItem[];
  sharedCampaigns?: SharedCampaignListItem[];
}

export function CampaignsClient({
  initialCampaigns,
  sharedCampaigns = [],
}: CampaignsClientProps) {
  const [activeSection, setActiveSection] = useState<"own" | "shared">("own");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "inactive">("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Estado para modal de compartilhamento
  const [shareModalData, setShareModalData] = useState<{ id: string; name: string } | null>(null);

  const currentList = activeSection === "own" ? initialCampaigns : sharedCampaigns;

  const filteredCampaigns = useMemo(() => {
    return currentList.filter((campaign) => {
      const matchesSearch =
        campaign.name.toLowerCase().includes(search.toLowerCase()) ||
        campaign.slug.toLowerCase().includes(search.toLowerCase());

      if (!matchesSearch) return false;

      if (filter === "active") return campaign.active;
      if (filter === "inactive") return !campaign.active;
      return true;
    });
  }, [currentList, search, filter]);

  return (
    <div className="mx-auto max-w-7xl w-full px-1 sm:px-0 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
            Campanhas
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
            Gerencie e monitore suas páginas de captura e campanhas compartilhadas com sua equipe.
          </p>
        </div>
        {activeSection === "own" && (
          <Link
            href="/admin/campaigns/new"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs sm:text-sm font-semibold text-primary-foreground shadow-md shadow-primary/20 transition-all hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98] w-full sm:w-auto justify-center"
          >
            <Plus className="h-4 w-4" />
            Nova Campanha
          </Link>
        )}
      </div>

      {/* Tabs Principais: Minhas Campanhas vs Compartilhadas Comigo */}
      <div className="flex items-center gap-2 border-b border-border/40 pb-2">
        <button
          type="button"
          onClick={() => {
            setActiveSection("own");
            setFilter("all");
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            activeSection === "own"
              ? "bg-primary/15 text-primary border border-primary/30 shadow-sm"
              : "text-muted-foreground hover:bg-white/5 hover:text-foreground border border-transparent"
          }`}
        >
          <Megaphone className="h-4 w-4" />
          <span>Minhas Campanhas</span>
          <span className="ml-1 px-1.5 py-0.5 rounded-full bg-white/10 text-[11px] font-semibold">
            {initialCampaigns.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveSection("shared");
            setFilter("all");
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            activeSection === "shared"
              ? "bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 shadow-sm"
              : "text-muted-foreground hover:bg-white/5 hover:text-foreground border border-transparent"
          }`}
        >
          <Share2 className="h-4 w-4" />
          <span>Compartilhadas Comigo</span>
          <span className="ml-1 px-1.5 py-0.5 rounded-full bg-white/10 text-[11px] font-semibold">
            {sharedCampaigns.length}
          </span>
        </button>
      </div>

      {/* Toolbar: Search, Filters & View Toggle */}
      {currentList.length > 0 && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nome ou slug..."
              className="w-full rounded-xl border border-border/60 bg-card/60 backdrop-blur-md pl-10 pr-4 py-2 text-xs sm:text-sm text-foreground placeholder-muted-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-2 flex-wrap sm:flex-nowrap">
            {/* Filter Tabs */}
            <div className="inline-flex rounded-xl border border-border/60 bg-card/60 backdrop-blur-md p-1 overflow-x-auto max-w-full">
              <button
                type="button"
                onClick={() => setFilter("all")}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                  filter === "all"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Todas ({currentList.length})
              </button>
              <button
                type="button"
                onClick={() => setFilter("active")}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                  filter === "active"
                    ? "bg-emerald-500 text-white shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Ativas ({currentList.filter((c) => c.active).length})
              </button>
              <button
                type="button"
                onClick={() => setFilter("inactive")}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                  filter === "inactive"
                    ? "bg-muted text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Inativas ({currentList.filter((c) => !c.active).length})
              </button>
            </div>

            {/* View Mode Toggle */}
            <div className="hidden sm:inline-flex rounded-xl border border-border/60 bg-card/60 backdrop-blur-md p-1">
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                title="Visualização em Grade"
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
                title="Visualização em Lista"
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
      {currentList.length === 0 ? (
        <div className="glass-panel rounded-2xl p-8 sm:p-16 text-center relative overflow-hidden">
          <DotGrid />
          <div className="relative z-10">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20 shadow-[0_0_25px_rgba(var(--primary),0.2)] mb-4">
              <Megaphone className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">
              {activeSection === "own"
                ? "Nenhuma campanha cadastrada"
                : "Nenhuma campanha compartilhada com você"}
            </h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto text-xs sm:text-sm">
              {activeSection === "own"
                ? "Você ainda não criou nenhuma página. Crie seu primeiro lançamento agora e comece a capturar leads."
                : "Quando outros produtores ou clientes compartilharem campanhas com o seu e-mail, elas aparecerão aqui."}
            </p>
            {activeSection === "own" && (
              <Link
                href="/admin/campaigns/new"
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-md transition-all hover:bg-primary/90 hover:scale-105 active:scale-95"
              >
                <Plus className="h-4 w-4" />
                Criar Primeira Campanha
              </Link>
            )}
          </div>
        </div>
      ) : filteredCampaigns.length === 0 ? (
        <div className="glass-panel rounded-2xl p-12 text-center">
          <p className="text-sm text-muted-foreground">
            Nenhuma campanha encontrada com o termo &quot;{search}&quot;.
          </p>
        </div>
      ) : viewMode === "grid" ? (
        /* Grid View */
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {filteredCampaigns.map((campaign) => {
            const viewsCount = campaign.views || 0;
            const leadsCount = campaign._count.leads;
            const conversion = viewsCount > 0 ? Math.round((leadsCount / viewsCount) * 100) : 0;
            const sharedItem = activeSection === "shared" ? (campaign as SharedCampaignListItem) : null;

            return (
              <div
                key={campaign.id}
                className="group glass-panel rounded-2xl p-5 flex flex-col justify-between transition-all duration-200 hover:shadow-xl hover:border-primary/40 hover:-translate-y-0.5 relative overflow-hidden"
              >
                <div>
                  {/* Status Bar Indicator */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-muted/60 border border-border/40 px-2 py-0.5 text-[11px] font-mono text-muted-foreground">
                      /{campaign.slug}
                    </span>

                    <div className="flex items-center gap-1.5">
                      {sharedItem && (
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                            sharedItem.sharedPermission === "EDIT"
                              ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30"
                              : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          }`}
                        >
                          {sharedItem.sharedPermission === "EDIT" ? "Editor" : "Visualizador"}
                        </span>
                      )}

                      {campaign.active ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          Ativa
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-muted/60 border border-muted px-2.5 py-0.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                          <XCircle className="h-3 w-3" />
                          Inativa
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Nome da Campanha */}
                  <Link
                    href={`/admin/campaigns/${campaign.id}`}
                    className="text-base font-bold text-foreground group-hover:text-primary transition-colors block line-clamp-1 mb-1"
                    title={campaign.name}
                  >
                    {campaign.name}
                  </Link>

                  {/* Dono se for compartilhada */}
                  {sharedItem && (
                    <p className="text-[11px] text-muted-foreground mb-2 truncate">
                      Por: <span className="font-semibold text-foreground/80">{sharedItem.sharedByOwnerName}</span>
                    </p>
                  )}

                  {/* Meta Pills: Views & Conversion */}
                  <div className="flex items-center gap-2 mb-4">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-muted/60 text-muted-foreground border border-border/40">
                      <Eye className="h-3 w-3" />
                      {viewsCount.toLocaleString("pt-BR")} views
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-primary/10 text-primary border border-primary/20">
                      <Percent className="h-3 w-3" />
                      {conversion}% conv.
                    </span>
                  </div>

                  {/* Estatísticas resumidas */}
                  <div className="grid grid-cols-2 gap-3 border-t border-border/40 pt-3 mb-4">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-chart-1/10 text-chart-1">
                        <Users className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-[11px] font-medium text-muted-foreground">Leads</p>
                        <p className="text-base font-bold text-foreground tabular-nums">
                          {leadsCount.toLocaleString("pt-BR")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-chart-3/10 text-chart-3">
                        <MessageCircle className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-[11px] font-medium text-muted-foreground">Grupos</p>
                        <p className="text-base font-bold text-foreground tabular-nums">
                          {campaign._count.groups}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="flex items-center justify-between gap-2 pt-3 border-t border-border/40">
                  <CopyCampaignLink slug={campaign.slug} customDomain={campaign.customDomain} />

                  <div className="flex items-center gap-1.5">
                    {activeSection === "own" && (
                      <button
                        type="button"
                        onClick={() => setShareModalData({ id: campaign.id, name: campaign.name })}
                        title="Compartilhar com Gestor de Tráfego"
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                      >
                        <Share2 className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Compartilhar</span>
                      </button>
                    )}

                    <Link
                      href={`/admin/campaigns/${campaign.id}/leads`}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                    >
                      Leads
                    </Link>
                    <Link
                      href={`/admin/campaigns/${campaign.id}`}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold text-primary bg-primary/10 hover:bg-primary/20 transition-colors"
                    >
                      <Edit3 className="h-3 w-3" />
                      {sharedItem && sharedItem.sharedPermission === "VIEW" ? "Ver" : "Editar"}
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List View */
        <div className="glass-panel rounded-2xl overflow-hidden shadow-sm border border-border/60">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] text-left text-sm text-muted-foreground">
              <thead className="bg-muted/70 text-[11px] uppercase tracking-wider text-muted-foreground border-b border-border/60 font-semibold">
                <tr>
                  <th className="px-5 py-3.5">Campanha</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-center">Visitas</th>
                  <th className="px-5 py-3.5 text-center">Leads</th>
                  <th className="px-5 py-3.5 text-center">Conversão</th>
                  <th className="px-5 py-3.5 text-center">Grupos</th>
                  <th className="px-5 py-3.5 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {filteredCampaigns.map((campaign) => {
                  const viewsCount = campaign.views || 0;
                  const leadsCount = campaign._count.leads;
                  const conversion = viewsCount > 0 ? Math.round((leadsCount / viewsCount) * 100) : 0;
                  const sharedItem = activeSection === "shared" ? (campaign as SharedCampaignListItem) : null;

                  return (
                    <tr key={campaign.id} className="hover:bg-muted/40 transition-colors">
                      <td className="px-5 py-4">
                        <Link href={`/admin/campaigns/${campaign.id}`} className="block group">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-foreground group-hover:text-primary transition-colors text-sm">
                              {campaign.name}
                            </p>
                            {sharedItem && (
                              <span
                                className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${
                                  sharedItem.sharedPermission === "EDIT"
                                    ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30"
                                    : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                }`}
                              >
                                {sharedItem.sharedPermission === "EDIT" ? "Editor" : "Visualizador"}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground font-mono mt-0.5">/{campaign.slug}</p>
                        </Link>
                      </td>
                      <td className="px-5 py-4">
                        {campaign.active ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400 uppercase">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            Ativa
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-muted/60 border border-muted px-2.5 py-0.5 text-[10px] font-bold text-muted-foreground uppercase">
                            <XCircle className="h-3 w-3" />
                            Inativa
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-center font-semibold text-foreground tabular-nums text-xs">
                        {viewsCount.toLocaleString("pt-BR")}
                      </td>
                      <td className="px-5 py-4 text-center font-bold text-foreground tabular-nums text-sm">
                        {leadsCount.toLocaleString("pt-BR")}
                      </td>
                      <td className="px-5 py-4 text-center text-xs font-semibold text-primary tabular-nums">
                        {conversion}%
                      </td>
                      <td className="px-5 py-4 text-center font-semibold text-foreground tabular-nums text-xs">
                        {campaign._count.groups}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {activeSection === "own" && (
                            <button
                              type="button"
                              onClick={() => setShareModalData({ id: campaign.id, name: campaign.name })}
                              title="Compartilhar Campanha"
                              className="rounded-md p-1.5 text-muted-foreground hover:bg-white/10 hover:text-foreground transition-colors"
                            >
                              <Share2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                          <CopyCampaignLink slug={campaign.slug} customDomain={campaign.customDomain} />
                          <Link
                            href={`/admin/campaigns/${campaign.id}`}
                            className="rounded-md px-2.5 py-1 text-xs font-semibold bg-primary/10 text-primary hover:bg-primary/20 transition-all"
                          >
                            {sharedItem && sharedItem.sharedPermission === "VIEW" ? "Ver" : "Editar"}
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal de Compartilhamento */}
      {shareModalData && (
        <CampaignShareModal
          campaignId={shareModalData.id}
          campaignName={shareModalData.name}
          isOpen={Boolean(shareModalData)}
          onClose={() => setShareModalData(null)}
        />
      )}
    </div>
  );
}
