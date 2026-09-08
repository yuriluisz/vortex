"use client";

import { useState, useRef } from "react";
import { createPortal } from "react-dom";
import { X, Loader2, Save, Code2, Sparkles, Image as ImageIcon, Trash2 } from "lucide-react";
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
    thumbnailUrl?: string | null;
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

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(template.thumbnailUrl ?? null);

  function handleThumbnailSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError("A imagem de capa deve ter no máximo 5MB.");
      return;
    }
    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!validTypes.includes(file.type)) {
      setError("Formato de imagem inválido. Use JPEG, PNG, WEBP ou GIF.");
      return;
    }
    setThumbnailFile(file);
    setThumbnailPreview(URL.createObjectURL(file));
    setError("");
  }

  function handleRemoveThumbnail() {
    setThumbnailFile(null);
    if (thumbnailPreview && thumbnailPreview !== template.thumbnailUrl) {
      URL.revokeObjectURL(thumbnailPreview);
    }
    setThumbnailPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("name", name);
      if (description) formData.append("description", description);
      formData.append("category", category);
      formData.append("theme", theme);
      formData.append("tags", tags);
      formData.append("rawHtml", html);
      if (thumbnailFile) {
        formData.append("thumbnail", thumbnailFile);
      }

      await saveTemplateEditAction(template.id, formData);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar alterações.");
      setPending(false);
    }
  }

  const inputCls =
    "w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-foreground outline-none transition-all focus:border-primary/50 focus:ring-4 focus:ring-primary/20 focus:bg-white/[0.08]";

  const modal = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-xl p-4 animate-in fade-in duration-200">
      <div className="bg-zinc-950 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col border border-white/15 overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-black/40">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">Editar Template</h3>
              <p className="text-xs text-muted-foreground">{template.name}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* Metadados */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-foreground/80 mb-1.5 flex items-center">
                Nome *
                <FieldTooltip tooltip="Nome atrativo para o template. Até 120 caracteres." docsAnchor="templates-editar" />
              </label>
              <input value={name} onChange={(e) => setName(e.target.value)} required maxLength={120} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground/80 mb-1.5 flex items-center">
                Tags (separadas por vírgula)
                <FieldTooltip tooltip="Palavras-chave para facilitar a busca. Até 20 tags, separadas por vírgula." docsAnchor="templates-editar" />
              </label>
              <input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="landing, vendas, imobiliário" className={inputCls} />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground/80 mb-1.5 flex items-center">
              Descrição
              <FieldTooltip tooltip="Explique para que tipo de campanha este template é ideal." docsAnchor="templates-editar" />
            </label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className={`${inputCls} resize-none`} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-foreground/80 mb-1.5 flex items-center">
                Categoria
                <FieldTooltip tooltip="Escolha a categoria que melhor descreve o uso deste template." docsAnchor="templates-editar" />
              </label>
              <select value={category} onChange={(e) => setCategory(e.target.value as TemplateCategory)} className={inputCls}>
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value} className="bg-zinc-950 text-foreground">{c.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground/80 mb-1.5 flex items-center">
                Tema
                <FieldTooltip tooltip="Estilo visual predominante: Escuro, Claro ou Colorido." docsAnchor="templates-editar" />
              </label>
              <select value={theme} onChange={(e) => setTheme(e.target.value as TemplateTheme)} className={inputCls}>
                {THEMES.map((t) => (
                  <option key={t.value} value={t.value} className="bg-zinc-950 text-foreground">{t.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Imagem de Capa (Thumbnail R2) */}
          <div>
            <label className="block text-xs font-semibold text-foreground/80 mb-1.5 flex items-center">
              Imagem de Capa / Thumbnail (R2)
              <FieldTooltip tooltip="Imagem de destaque exibida no catálogo da comunidade (JPEG, PNG ou WEBP até 5MB)." docsAnchor="templates-editar" />
            </label>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/png,image/jpeg,image/webp,image/gif"
              onChange={handleThumbnailSelect}
              className="hidden"
            />
            {thumbnailPreview ? (
              <div className="relative rounded-xl overflow-hidden border border-white/10 aspect-video max-h-48 bg-black/40 group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={thumbnailPreview} alt="Preview da capa" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm transition-colors"
                  >
                    <ImageIcon className="w-3.5 h-3.5" />
                    Alterar capa
                  </button>
                  <button
                    type="button"
                    onClick={handleRemoveThumbnail}
                    className="p-1.5 rounded-lg bg-destructive/80 hover:bg-destructive text-white backdrop-blur-sm transition-colors"
                    title="Remover imagem"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex flex-col items-center justify-center gap-2 p-4 rounded-xl border border-dashed border-white/15 bg-white/[0.02] hover:bg-white/[0.05] text-muted-foreground hover:text-foreground transition-all cursor-pointer"
              >
                <div className="h-9 w-9 rounded-lg bg-white/5 flex items-center justify-center text-muted-foreground">
                  <ImageIcon className="w-4 h-4" />
                </div>
                <span className="text-xs font-medium">Clique para selecionar nova imagem de capa (R2)</span>
                <span className="text-[10px] text-muted-foreground/60">JPEG, PNG ou WEBP até 5MB</span>
              </button>
            )}
          </div>

          {/* Editor de HTML */}
          <div>
            <label className="flex items-center gap-2 text-xs font-semibold text-foreground/80 mb-2">
              <Code2 className="w-4 h-4 text-primary" />
              HTML do template
              <span className="text-[11px] text-muted-foreground font-normal">
                (alterações no código criam uma nova versão para análise)
              </span>
              <FieldTooltip tooltip="Alterações no HTML criam uma nova versão e o template volta para 'Em análise'." docsAnchor="templates-editar" />
            </label>
            <textarea
              value={html}
              onChange={(e) => setHtml(e.target.value)}
              rows={12}
              spellCheck={false}
              className="w-full rounded-xl border border-white/10 bg-[#090d13] text-[13px] text-emerald-400 font-mono leading-relaxed p-4 outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/20 resize-y shadow-inner"
            />
          </div>

          {error && <p className="text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-xl p-3">{error}</p>}

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-white/10 px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={pending}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-all active:scale-[0.98] shadow-md shadow-primary/20 disabled:opacity-50"
            >
              {pending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              Salvar Alterações
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return typeof window !== "undefined" ? createPortal(modal, document.body) : null;
}