"use client";

import { useState, useEffect } from "react";
import { Search, X, Loader2, Copy } from "lucide-react";

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
  const [templates, setTemplates] = useState<TemplateItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);

  useEffect(() => {
    fetch("/api/templates?pageSize=50")
      .then((res) => res.json())
      .then((data) => {
        setTemplates(data.templates ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filtered = templates.filter(
    (t) =>
      !search ||
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.description?.toLowerCase().includes(search.toLowerCase())
  );

  async function handleSelect(template: TemplateItem) {
    setSelectedId(template.id);
    setLoadingPreview(true);
    try {
      const res = await fetch(`/api/templates/${template.slug}/preview`);
      const html = await res.text();
      // Extrair apenas o body content do preview
      const bodyMatch = html.match(/<body>([\s\S]*)<\/body>/i);
      const bodyContent = bodyMatch?.[1] ?? html;
      setPreviewHtml(bodyContent);
    } catch {
      // fallback
    }
    setLoadingPreview(false);
  }

  function confirmSelection() {
    if (previewHtml) {
      onSelect(previewHtml);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-white rounded-xl shadow-2xl w-[90vw] max-w-5xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">Escolher Template</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-1 min-h-0">
          {/* Lista de templates */}
          <div className="w-1/3 border-r border-gray-200 flex flex-col">
            <div className="p-3 border-b border-gray-100">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                </div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-12 text-sm text-gray-500">
                  Nenhum template encontrado
                </div>
              ) : (
                filtered.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => handleSelect(template)}
                    className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-50 ${
                      selectedId === template.id ? "bg-blue-50 border-l-2 border-l-blue-500" : ""
                    }`}
                  >
                    <div className="font-medium text-sm">{template.name}</div>
                    {template.description && (
                      <div className="text-xs text-gray-500 line-clamp-1 mt-0.5">
                        {template.description}
                      </div>
                    )}
                    <div className="flex gap-2 mt-1">
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">
                        {template.category}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">
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
            <div className="flex-1 bg-gray-50 m-4 rounded-lg overflow-hidden">
              {loadingPreview ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                </div>
              ) : previewHtml ? (
                <iframe
                  title="Preview"
                  className="w-full h-full"
                  sandbox="allow-scripts"
                  srcDoc={`<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>*{margin:0;padding:0;box-sizing:border-box}html,body{width:100%;height:100%}</style></head><body>${previewHtml}</body></html>`}
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
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
                className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Usar este Template
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}