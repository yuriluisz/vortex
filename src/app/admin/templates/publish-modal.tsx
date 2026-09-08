"use client";

import { useState, useRef } from "react";
import { createPortal } from "react-dom";
import { X, Loader2, Upload, Sparkles, Image as ImageIcon, Trash2 } from "lucide-react";
import { publishTemplateAction } from "./actions";
import { FieldTooltip } from "@/components/admin/field-tooltip";
import type { TemplateCategory, TemplateTheme } from "@prisma/client";

interface PublishModalProps {
  campaigns: { id: string; name: string }[];
  onClose: () => void;
}

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

export function PublishModal({ campaigns, onClose }: PublishModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<TemplateCategory>("LANDING_PAGE");
  const [theme, setTheme] = useState<TemplateTheme>("DARK");
  const [tags, setTags] = useState("");
  const [sourceCampaignId, setSourceCampaignId] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);

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
    if (thumbnailPreview) {
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
      formData.append("sourceCampaignId", sourceCampaignId);
      if (thumbnailFile) {
        formData.append("thumbnail", thumbnailFile);
      }
      await publishTemplateAction(formData);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao publicar.");
      setPending(false);
    }
  }

  const inputClass =
    "w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-foreground outline-none transition-all focus:border-primary/50 focus:ring-4 focus:ring-primary/20 focus:bg-white/[0.08]";

  const modal = (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xl p-4 animate-in fade-in duration-200">
      <div className="bg-zinc-950 rounded-2xl shadow-2xl w-full max-w-lg max-h-[92vh] flex flex-col border border-white/15 overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-black/40">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">Publicar Template</h2>
              <p className="text-xs text-muted-foreground">Compartilhe seu design com a comunidade</p>
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* Campanha origem */}
          <div>
            <label className="block text-xs font-semibold text-foreground/80 mb-1.5 flex items-center">
              Campanha de origem *
              <FieldTooltip
                tooltip="O HTML desta campanha será copiado e usado como conteúdo do template."
                docsAnchor="templates-publicar"
              />
            </label>
            <select
              value={sourceCampaignId}
              onChange={(e) => setSourceCampaignId(e.target.value)}
              required
              className={inputClass}
            >
              <option value="" className="bg-zinc-950 text-muted-foreground">Selecione uma campanha...</option>
              {campaigns.map((c) => (
                <option key={c.id} value={c.id} className="bg-zinc-950 text-foreground">
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Nome */}
          <div>
            <label className="block text-xs font-semibold text-foreground/80 mb-1.5 flex items-center">
              Nome do template *
              <FieldTooltip tooltip="Um nome claro e atrativo para o seu template. Até 120 caracteres." docsAnchor="templates-publicar" />
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Ex: Landing Page Masterclass 2026"
              className={inputClass}
            />
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-xs font-semibold text-foreground/80 mb-1.5 flex items-center">
              Descrição
              <FieldTooltip tooltip="Explique para que tipo de campanha este template é ideal. Opcional." docsAnchor="templates-publicar" />
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Descreva a proposta deste template..."
              className={`${inputClass} resize-none`}
            />
          </div>

          {/* Categoria + Tema */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-foreground/80 mb-1.5 flex items-center">
                Categoria
                <FieldTooltip tooltip="Escolha a categoria que melhor descreve o uso deste template." docsAnchor="templates-publicar" />
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as TemplateCategory)}
                className={inputClass}
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value} className="bg-zinc-950 text-foreground">
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground/80 mb-1.5 flex items-center">
                Tema
                <FieldTooltip tooltip="O estilo visual predominante." docsAnchor="templates-publicar" />
              </label>
              <select
                value={theme}
                onChange={(e) => setTheme(e.target.value as TemplateTheme)}
                className={inputClass}
              >
                {THEMES.map((t) => (
                  <option key={t.value} value={t.value} className="bg-zinc-950 text-foreground">
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-semibold text-foreground/80 mb-1.5 flex items-center">
              Tags (separadas por vírgula)
              <FieldTooltip tooltip="Palavras-chave para busca. Até 20 tags." docsAnchor="templates-publicar" />
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="Ex: lançamento, infoproduto, dark"
              className={inputClass}
            />
          </div>

          {/* Imagem de Capa (Thumbnail R2) */}
          <div>
            <label className="block text-xs font-semibold text-foreground/80 mb-1.5 flex items-center">
              Imagem de Capa / Thumbnail (R2)
              <FieldTooltip tooltip="Imagem de destaque exibida no catálogo da comunidade (JPEG, PNG ou WEBP até 5MB)." docsAnchor="templates-publicar" />
            </label>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/png,image/jpeg,image/webp,image/gif"
              onChange={handleThumbnailSelect}
              className="hidden"
            />
            {thumbnailPreview ? (
              <div className="relative rounded-xl overflow-hidden border border-white/10 aspect-video bg-black/40 group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={thumbnailPreview} alt="Preview da capa" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={handleRemoveThumbnail}
                  className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/70 hover:bg-destructive text-white transition-colors"
                  title="Remover imagem"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
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
                <span className="text-xs font-medium">Clique para selecionar imagem de capa (R2)</span>
                <span className="text-[10px] text-muted-foreground/60">JPEG, PNG ou WEBP até 5MB</span>
              </button>
            )}
          </div>

          {error && (
            <p className="text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-xl p-3">
              {error}
            </p>
          )}

          {/* Aviso */}
          <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-3 text-xs text-amber-400 leading-relaxed">
            💡 <strong>Revisão de Qualidade:</strong> Seu template passará por aprovação técnica antes de ser exibido publicamente na galeria comunitária.
          </div>

          {/* Submit */}
          <div className="pt-2 border-t border-white/10 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-semibold text-muted-foreground hover:text-foreground rounded-xl border border-white/10 hover:bg-white/5 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={pending}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl font-bold text-xs hover:bg-primary/90 disabled:opacity-50 transition-all active:scale-[0.98] shadow-md shadow-primary/20"
            >
              {pending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Upload className="w-3.5 h-3.5" />
              )}
              {pending ? "Publicando..." : "Enviar para Revisão"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return typeof window !== "undefined" ? createPortal(modal, document.body) : null;
}