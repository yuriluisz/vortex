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
    } catch (e: any) {
      setError(e.message || "Erro ao executar ação.");
    }
    setPending(null);
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen(!open)}
        className="p-1.5 rounded-lg hover:bg-muted transition-colors"
        aria-label="Ações do template"
      >
        <MoreVertical className="w-4 h-4 text-muted-foreground" />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 z-50 w-56 rounded-xl border border-border bg-card shadow-xl py-1.5 animate-in fade-in zoom-in-95 duration-150 origin-top-right">
          <button
            onClick={() => {
              setShowEdit(true);
              setOpen(false);
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-foreground/80 hover:bg-muted transition-colors"
          >
            <Pencil className="w-4 h-4" />
            Editar
          </button>

          {status === "PUBLISHED" && (
            <button
              onClick={() => handleAction("hide")}
              disabled={pending !== null}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-foreground/80 hover:bg-muted transition-colors disabled:opacity-50"
            >
              {pending === "hide" ? <Loader2 className="w-4 h-4 animate-spin" /> : <EyeOff className="w-4 h-4" />}
              Remover visibilidade
            </button>
          )}

          {status === "TAKEN_DOWN" && (
            <button
              onClick={() => handleAction("republish")}
              disabled={pending !== null}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-foreground/80 hover:bg-muted transition-colors disabled:opacity-50"
            >
              {pending === "republish" ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              Republicar
            </button>
          )}

          <button
            onClick={() => handleAction("delete")}
            disabled={pending !== null}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-500 hover:bg-red-500/10 transition-colors disabled:opacity-50"
          >
            {pending === "delete" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            Excluir
          </button>

          {error && (
            <p className="px-3 py-2 text-xs text-red-500 border-t border-border/50">{error}</p>
          )}
        </div>
      )}

      {showEdit && <EditTemplateModal template={template} onClose={() => setShowEdit(false)} />}
    </div>
  );
}
