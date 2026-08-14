"use client";

import { useState } from "react";
import { X, Loader2, Upload } from "lucide-react";
import { publishTemplateAction } from "./actions";

interface PublishModalProps {
  campaigns: { id: string; name: string }[];
  onClose: () => void;
}

const CATEGORIES = [
  { value: "LANDING_PAGE", label: "Landing Page" },
  { value: "SQUEEZE_PAGE", label: "Squeeze Page" },
  { value: "WEBINAR", label: "Webinar" },
  { value: "ECOMMERCE", label: "E-commerce" },
  { value: "INFOPRODUCT", label: "Infoproduto" },
  { value: "PORTFOLIO", label: "Portfólio" },
  { value: "EVENT", label: "Evento" },
  { value: "OTHER", label: "Outro" },
];

const THEMES = [
  { value: "DARK", label: "Escuro" },
  { value: "LIGHT", label: "Claro" },
  { value: "COLORFUL", label: "Colorido" },
];

export function PublishModal({ campaigns, onClose }: PublishModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("LANDING_PAGE");
  const [theme, setTheme] = useState("DARK");
  const [tags, setTags] = useState("");
  const [sourceCampaignId, setSourceCampaignId] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError("");
    try {
      await publishTemplateAction({
        name,
        description,
        category: category as any,
        theme: theme as any,
        tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
        sourceCampaignId,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || "Erro ao publicar.");
      setPending(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-card rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto border border-border animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-lg font-semibold text-card-foreground">Publicar Template</h2>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-lg transition-colors" aria-label="Fechar">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Campanha origem */}
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1.5">
              Campanha de origem *
            </label>
            <select
              value={sourceCampaignId}
              onChange={(e) => setSourceCampaignId(e.target.value)}
              required
              className="w-full px-3 py-2.5 text-sm rounded-lg border border-border bg-secondary focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
            >
              <option value="">Selecione uma campanha...</option>
              {campaigns.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground mt-1">
              O HTML desta campanha será usado como base do template.
            </p>
          </div>

          {/* Nome */}
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1.5">
              Nome do template *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Ex: Landing Page de Lançamento"
              className="w-full px-3 py-2.5 text-sm rounded-lg border border-border bg-secondary focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
            />
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1.5">
              Descrição
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Descreva o que este template faz..."
              className="w-full px-3 py-2.5 text-sm rounded-lg border border-border bg-secondary focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none"
            />
          </div>

          {/* Categoria + Tema */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1.5">Categoria</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2.5 text-sm rounded-lg border border-border bg-secondary focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1.5">Tema</label>
              <select
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                className="w-full px-3 py-2.5 text-sm rounded-lg border border-border bg-secondary focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
              >
                {THEMES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1.5">
              Tags (separadas por vírgula)
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="Ex: lançamento, infoproduto, dark"
              className="w-full px-3 py-2.5 text-sm rounded-lg border border-border bg-secondary focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
            />
          </div>

          {error && (
            <p className="text-sm text-red-500 bg-red-500/5 border border-red-500/20 rounded-lg p-2.5">{error}</p>
          )}

          {/* Aviso */}
          <div className="rounded-lg bg-yellow-500/5 border border-yellow-500/20 p-3 text-xs text-yellow-500">
            Seu template passará por revisão antes de ser publicado na comunidade.
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={pending}
            className="w-full inline-flex items-center justify-center gap-2 py-2.5 bg-primary text-primary-foreground rounded-lg font-semibold text-sm hover:bg-primary/90 disabled:opacity-50 transition-all duration-200 active:scale-[0.98]"
          >
            {pending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Upload className="w-4 h-4" />
            )}
            {pending ? "Publicando..." : "Enviar para revisão"}
          </button>
        </form>
      </div>
    </div>
  );
}