"use client";

import { useState, useRef, useEffect } from "react";
import { MoreVertical, EyeOff, RefreshCw, Trash2, Loader2, Pencil } from "lucide-react";
import { hideTemplateAction, republishTemplateAction, deleteTemplateAction } from "./actions";
import { EditTemplateModal } from "./edit-template-modal";
import type { TemplateCategory, TemplateTheme } from "@prisma/client";

interface TemplateActionsMenuProps {
  templateId: string;
  status: string;
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
}

export function TemplateActionsMenu({ templateId, status, template }: TemplateActionsMenuProps) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [showEdit, setShowEdit] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Fechar ao clicar fora
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleAction(action: string) {
    setPending(action);
    setError("");
    try {
      if (action === "hide") await hideTemplateAction(templateId);
      if (action === "republish") await republishTemplateAction(templateId);
      if (action === "delete") {
        if (!confirm("Tem certeza que deseja excluir este template? Esta ação não pode ser desfeita.")) {
          setPending(null);
          return;
        }
        await deleteTemplateAction(templateId);
      }
      setOpen(false);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erro ao executar ação.");
    }
    setPending(null);
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="p-1.5 rounded-xl hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Ações do template"
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 z-50 w-52 rounded-xl border border-white/15 bg-zinc-950/95 backdrop-blur-2xl shadow-2xl p-1.5 animate-in fade-in zoom-in-95 duration-150 origin-top-right space-y-0.5">
          <button
            type="button"
            onClick={() => {
              setShowEdit(true);
              setOpen(false);
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-foreground rounded-lg hover:bg-white/10 transition-colors text-left"
          >
            <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
            Editar Metadados / HTML
          </button>

          {status === "PUBLISHED" && (
            <button
              type="button"
              onClick={() => handleAction("hide")}
              disabled={pending !== null}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-foreground rounded-lg hover:bg-white/10 transition-colors text-left disabled:opacity-50"
            >
              {pending === "hide" ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <EyeOff className="w-3.5 h-3.5 text-muted-foreground" />
              )}
              Ocultar da Galeria
            </button>
          )}

          {status === "TAKEN_DOWN" && (
            <button
              type="button"
              onClick={() => handleAction("republish")}
              disabled={pending !== null}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-emerald-400 rounded-lg hover:bg-emerald-500/10 transition-colors text-left disabled:opacity-50"
            >
              {pending === "republish" ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
              )}
              Republicar Template
            </button>
          )}

          <button
            type="button"
            onClick={() => handleAction("delete")}
            disabled={pending !== null}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-destructive rounded-lg hover:bg-destructive/10 transition-colors text-left disabled:opacity-50"
          >
            {pending === "delete" ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Trash2 className="w-3.5 h-3.5 text-destructive" />
            )}
            Excluir Template
          </button>

          {error && (
            <p className="px-3 py-2 text-xs text-destructive border-t border-white/10">{error}</p>
          )}
        </div>
      )}

      {showEdit && <EditTemplateModal template={template} onClose={() => setShowEdit(false)} />}
    </div>
  );
}
