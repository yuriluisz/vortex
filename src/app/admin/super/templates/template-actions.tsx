"use client";

import { useState } from "react";
import {
  Mail,
  Eye,
  EyeOff,
  Trash2,
  Ban,
  CheckCircle2,
  MoreVertical,
  Loader2,
} from "lucide-react";
import {
  sendTemplateAuthorEmailAction,
  toggleTemplateVisibilityAction,
  deleteTemplateAction,
  toggleTemplateAuthorBlockAction,
} from "../actions";

type TemplateStatus = "PENDING_REVIEW" | "PUBLISHED" | "REJECTED" | "TAKEN_DOWN" | "DRAFT";

type TemplateActionsProps = {
  templateId: string;
  authorId: string;
  authorEmail: string;
  authorName: string;
  status: TemplateStatus;
  isAuthorBlocked: boolean;
};

export function TemplateActions({
  templateId,
  authorId,
  authorEmail,
  authorName,
  status,
  isAuthorBlocked,
}: TemplateActionsProps) {
  const [open, setOpen] = useState(false);
  const [showEmail, setShowEmail] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Ações contextuais por status
  const canToggleVisibility = status === "PUBLISHED" || status === "TAKEN_DOWN";
  const isVisible = status === "PUBLISHED";

  async function handleSendEmail() {
    if (!subject.trim() || !message.trim()) {
      setError("Assunto e mensagem são obrigatórios.");
      return;
    }
    setPending(true);
    setError("");
    setSuccess("");
    try {
      await sendTemplateAuthorEmailAction(templateId, subject, message);
      setSuccess("Email enviado com sucesso!");
      setShowEmail(false);
      setSubject("");
      setMessage("");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erro ao enviar email.");
    } finally {
      setPending(false);
    }
  }

  async function handleToggleVisibility() {
    setPending(true);
    setError("");
    setSuccess("");
    try {
      await toggleTemplateVisibilityAction(templateId, !isVisible);
      setSuccess(isVisible ? "Visibilidade removida." : "Template restaurado.");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erro ao alterar visibilidade.");
    } finally {
      setPending(false);
    }
  }

  async function handleDelete() {
    setPending(true);
    setError("");
    setSuccess("");
    try {
      await deleteTemplateAction(templateId);
      setSuccess("Template excluído.");
      setShowDelete(false);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erro ao excluir template.");
    } finally {
      setPending(false);
    }
  }

  async function handleToggleBlock() {
    setPending(true);
    setError("");
    setSuccess("");
    try {
      await toggleTemplateAuthorBlockAction(authorId, !isAuthorBlocked);
      setSuccess(isAuthorBlocked ? "Autor desbloqueado." : "Autor bloqueado de enviar templates.");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erro ao bloquear autor.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="relative">
      {/* Botão de menu */}
      <button
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-all"
        aria-label="Ações de moderação"
        aria-expanded={open}
      >
        <MoreVertical className="w-3.5 h-3.5" />
        Ações
      </button>

      {/* Dropdown */}
      {open && (
        <>
          {/* Overlay para fechar ao clicar fora */}
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />

          <div className="absolute right-0 top-full mt-2 z-40 w-64 rounded-xl border border-border bg-card shadow-2xl p-1.5 animate-scale-in origin-top-right">
            {/* Seção: Comunicação */}
            <button
              onClick={() => {
                setShowEmail(true);
                setOpen(false);
                setError("");
                setSuccess("");
              }}
              className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-xs font-medium text-foreground hover:bg-muted transition-colors"
            >
              <Mail className="w-4 h-4 text-primary shrink-0" />
              Enviar email ao autor
            </button>

            {/* Seção: Visibilidade (só para PUBLISHED/TAKEN_DOWN) */}
            {canToggleVisibility && (
              <>
                <div className="my-1.5 border-t border-border/60" />
                <button
                  onClick={handleToggleVisibility}
                  disabled={pending}
                  className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-xs font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-50"
                >
                  {isVisible ? (
                    <>
                      <EyeOff className="w-4 h-4 text-amber-500 shrink-0" />
                      Remover visibilidade
                    </>
                  ) : (
                    <>
                      <Eye className="w-4 h-4 text-green-500 shrink-0" />
                      Restaurar visibilidade
                    </>
                  )}
                </button>
              </>
            )}

            {/* Seção: Autor */}
            <div className="my-1.5 border-t border-border/60" />
            <button
              onClick={handleToggleBlock}
              disabled={pending}
              className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-xs font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-50"
            >
              {isAuthorBlocked ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                  Desbloquear autor
                </>
              ) : (
                <>
                  <Ban className="w-4 h-4 text-red-500 shrink-0" />
                  Bloquear autor de enviar
                </>
              )}
            </button>

            {/* Zona de perigo */}
            <div className="my-1.5 border-t border-red-500/20" />
            <button
              onClick={() => {
                setShowDelete(true);
                setOpen(false);
                setError("");
                setSuccess("");
              }}
              className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-xs font-medium text-red-500 hover:bg-red-500/10 transition-colors"
            >
              <Trash2 className="w-4 h-4 shrink-0" />
              Excluir template
            </button>
          </div>
        </>
      )}

      {/* Modal de email */}
      {showEmail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-card rounded-xl shadow-2xl w-full max-w-md border border-border p-6 animate-scale-in">
            <h3 className="text-lg font-semibold text-card-foreground mb-4">
              Enviar email para {authorName || authorEmail}
            </h3>
            <div className="space-y-3">
              <input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Assunto..."
                className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground placeholder-muted-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
              />
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Mensagem..."
                rows={4}
                className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground placeholder-muted-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
              />
              {error && <p className="text-xs text-red-500">{error}</p>}
              {success && <p className="text-xs text-green-500">{success}</p>}
              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => setShowEmail(false)}
                  className="rounded-lg border border-border px-4 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSendEmail}
                  disabled={pending}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                  Enviar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de exclusão */}
      {showDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-card rounded-xl shadow-2xl w-full max-w-sm border border-border p-6 animate-scale-in">
            <h3 className="text-lg font-semibold text-card-foreground mb-2">Excluir template?</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Esta ação é irreversível. O template e todas as suas versões serão removidos permanentemente.
            </p>
            {error && <p className="text-xs text-red-500 mb-2">{error}</p>}
            {success && <p className="text-xs text-green-500 mb-2">{success}</p>}
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setShowDelete(false)}
                className="rounded-lg border border-border px-4 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={pending}
                className="inline-flex items-center gap-1.5 rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Feedback de sucesso */}
      {success && !showEmail && !showDelete && (
        <p className="mt-2 text-xs text-green-500">{success}</p>
      )}
      {error && !showEmail && !showDelete && (
        <p className="mt-2 text-xs text-red-500">{error}</p>
      )}
    </div>
  );
}