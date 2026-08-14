"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { X, Loader2, Save, Code2 } from "lucide-react";
import { saveTemplateEditAction } from "./actions";
import { FieldTooltip } from "@/components/admin/field-tooltip";
import type { TemplateCategory, TemplateTheme } from "@prisma/client";

const CATEGORIES: { value: TemplateCategory; label: string }[] = [
  { value: "LANDING_PAGE", label: "Landing Page" },
  { value: "SQUEEZE_PAGE", label: "Squeeze Page" },
  { value: "WEBINAR", label: "Webinar" },
  { value: "ECOMMERCE", label: "E-commerce" },
  { value: "INFOPRODUCT", label: "Infoproduto" },
  { value: "PORTFOLIO", label: "Portfólio" },
  { value: "EVENT", label: "Evento" },
  { value: "OTHER", label: "Outro" },
];

const THEMES: { value: TemplateTheme; label: string }[] = [
  { value: "DARK", label: "Escuro" },
  { value: "LIGHT", label: "Claro" },
  { value: "COLORFUL", label: "Colorido" },
];

type Props = {
  template: {
    id: string;
    name: string;
    description: string | null;
    category: TemplateCategory;
    theme: TemplateTheme;
    tags: string[];
    rawHtml: string;
  };
  onClose: () => void;
};

export function EditTemplateModal({ template, onClose }: Props) {
  const [name, setName] = useState(template.name);
  const [description, setDescription] = useState(template.description ?? "");
  const [category, setCategory] = useState<TemplateCategory>(template.category);
  const [theme, setTheme] = useState<TemplateTheme>(template.theme);
  const [tags, setTags] = useState(template.tags.join(", "));
  const [html, setHtml] = useState(template.rawHtml);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError("");
    try {
      await saveTemplateEditAction(template.id, {
        name,
        description: description || undefined,
        category,
        theme,
        tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
        rawHtml: html,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar alterações.");
      setPending(false);
    }
  }

  const inputCls = "w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground placeholder-muted-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/20";

  const modal = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-card rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto border border-border p-6 animate-scale-in">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-semibold text-card-foreground">Editar Template</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors" aria-label="Fechar">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Metadados */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1 flex items-center">
                Nome *
                <FieldTooltip tooltip="Nome atrativo para o template. Até 120 caracteres." docsAnchor="templates-editar" />
              </label>
              <input value={name} onChange={(e) => setName(e.target.value)} required maxLength={120} className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1 flex items-center">
                Tags (separadas por vírgula)
                <FieldTooltip tooltip="Palavras-chave para facilitar a busca. Até 20 tags, separadas por vírgula." docsAnchor="templates-editar" />
              </label>
              <input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="landing, vendas, imobiliário" className={inputCls} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1 flex items-center">
              Descrição
              <FieldTooltip tooltip="Explique para que tipo de campanha este template é ideal. Até 1000 caracteres." docsAnchor="templates-editar" />
            </label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className={inputCls} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1 flex items-center">
                Categoria
                <FieldTooltip tooltip="Escolha a categoria que melhor descreve o uso deste template." docsAnchor="templates-editar" />
              </label>
              <select value={category} onChange={(e) => setCategory(e.target.value as TemplateCategory)} className={inputCls}>
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1 flex items-center">
                Tema
                <FieldTooltip tooltip="Estilo visual predominante: Escuro, Claro ou Colorido." docsAnchor="templates-editar" />
              </label>
              <select value={theme} onChange={(e) => setTheme(e.target.value as TemplateTheme)} className={inputCls}>
                {THEMES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Editor de HTML */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
              <Code2 className="w-4 h-4 text-primary" />
              HTML do template
              <span className="text-xs text-muted-foreground font-normal">
                (alterações geram nova versão para análise)
              </span>
              <FieldTooltip tooltip="Alterações no HTML criam uma nova versão e o template volta para 'Em análise'. Metadados são salvos imediatamente." docsAnchor="templates-editar" />
            </label>
            <textarea
              value={html}
              onChange={(e) => setHtml(e.target.value)}
              rows={14}
              spellCheck={false}
              className="w-full rounded-lg border border-border bg-[#0d1117] text-[13px] text-emerald-300 font-mono leading-relaxed p-4 outline-none focus:border-ring focus:ring-2 focus:ring-ring/20 resize-y"
            />
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/50">
            <button type="button" onClick={onClose} className="rounded-lg border border-border px-4 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={pending} className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50">
              {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Salvar alterações
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return typeof window !== "undefined" ? createPortal(modal, document.body) : null;
}