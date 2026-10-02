"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Search, X, Loader2, Copy, AlertTriangle } from "lucide-react";

interface TemplatePickerProps {
  onSelect: (html: string) => void;
  onClose: () => void;
}

interface TemplateItem {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  category: string;
  theme: string;
  _count: { usages: number; likes: number };
}

export function TemplatePicker({ onSelect, onClose }: TemplatePickerProps) {
  const [tab, setTab] = useState<"community" | "mine">("community");
  const [templates, setTemplates] = useState<TemplateItem[]>([]);
  const [myTemplates, setMyTemplates] = useState<TemplateItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [selectedRawHtml, setSelectedRawHtml] = useState<string | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/templates?pageSize=50").then((res) => res.json()),
      fetch("/api/templates/mine").then((res) => res.json()).catch(() => ({ templates: [] })),
    ])
      .then(([communityData, mineData]) => {
        setTemplates(communityData.templates ?? []);
        setMyTemplates(mineData.templates ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const activeList = tab === "community" ? templates : myTemplates;
  const filtered = activeList.filter(
    (t) =>
      !search ||
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.description?.toLowerCase().includes(search.toLowerCase())
  );

  async function handleSelect(template: TemplateItem) {
    setSelectedId(template.id);
    setLoadingPreview(true);
    try {
      const [previewRes, rawRes] = await Promise.all([
        fetch(`/api/templates/${template.slug}/preview`),
        fetch(`/api/templates/${template.slug}`),
      ]);
      const html = await previewRes.text();
      setPreviewHtml(html);
      if (rawRes.ok) {
        const data = await rawRes.json();
        setSelectedRawHtml(data.template?.rawHtml || html);
      } else {
        setSelectedRawHtml(html);
      }
    } catch {
      // fallback
    }
    setLoadingPreview(false);
  }

  function confirmSelection() {
    if (previewHtml) {
      setConfirmOpen(true);
    }
  }

  function applyTemplate() {
    if (selectedRawHtml) {
      onSelect(selectedRawHtml);
    }
  }

  const picker = (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-card rounded-xl shadow-2xl w-[98vw] max-w-[1400px] h-[95vh] flex flex-col border border-border animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <h2 className="text-lg font-semibold text-card-foreground">Escolher Template</h2>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-lg transition-colors" aria-label="Fechar">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-6 pt-3 border-b border-border/50">
          <button
            onClick={() => { setTab("community"); setSelectedId(null); setPreviewHtml(null); }}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              tab === "community" ? "text-primary border-b-2 border-primary" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Comunidade
          </button>
          <button
            onClick={() => { setTab("mine"); setSelectedId(null); setPreviewHtml(null); }}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              tab === "mine" ? "text-primary border-b-2 border-primary" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Meus Templates
          </button>
        </div>

        <div className="flex flex-1 min-h-0">
          {/* Lista de templates */}
          <div className="w-1/3 border-r border-border flex flex-col">
            <div className="p-3 border-b border-border/50">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Buscar..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-border bg-secondary rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-12 text-sm text-muted-foreground">
                  {tab === "mine" ? "Você não tem templates publicados" : "Nenhum template encontrado"}
                </div>
              ) : (
                filtered.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => handleSelect(template)}
                    className={`w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors border-b border-border/30 ${
                      selectedId === template.id ? "bg-primary/10 border-l-2 border-l-primary" : ""
                    }`}
                  >
                    <div className="font-medium text-sm text-card-foreground">{template.name}</div>
                    {template.description && (
                      <div className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                        {template.description}
                      </div>
                    )}
                    <div className="flex gap-2 mt-1">
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                        {template.category}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                        {template.theme}
                      </span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Preview */}
          <div className="flex-1 flex flex-col">
            <div className="flex-1 bg-muted/30 m-4 rounded-lg overflow-hidden">
              {loadingPreview ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
              ) : previewHtml ? (
                <iframe
                  title="Preview"
                  className="w-full h-full border-0 bg-transparent"
                  sandbox="allow-scripts"
                  srcDoc={previewHtml}
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <Copy className="w-12 h-12 mb-3" />
                  <p className="text-sm">Selecione um template ao lado</p>
                  <p className="text-xs mt-1">para visualizar o preview</p>
                </div>
              )}
            </div>

            <div className="px-4 pb-4">
              <button
                onClick={confirmSelection}
                disabled={!previewHtml}
                className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 active:scale-[0.98]"
              >
                Usar este Template
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Pop de confirmação */}
      {confirmOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-card rounded-xl shadow-2xl w-full max-w-md border border-border animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-lg bg-yellow-500/10 text-yellow-500 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-semibold text-card-foreground">Aplicar template?</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Isso vai <strong className="text-foreground">substituir o HTML atual</strong> da sua campanha pelo template selecionado. Deseja continuar?
              </p>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setConfirmOpen(false)}
                  className="flex-1 py-2.5 rounded-lg border border-border text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={applyTemplate}
                  className="flex-1 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-all duration-200 active:scale-[0.98]"
                >
                  Aplicar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return typeof window !== "undefined" ? createPortal(picker, document.body) : null;
}