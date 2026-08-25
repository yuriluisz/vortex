"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Loader2, Check, Code2, Eye, FileJson } from "lucide-react";
import { moderateTemplateAction } from "../actions";

interface ReviewModalProps {
  slug: string;
  templateId: string;
  onClose: () => void;
}

export function ReviewModal({ slug, templateId, onClose }: ReviewModalProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [html, setHtml] = useState("");
  const [sourceCode, setSourceCode] = useState("");
  const [formSchema, setFormSchema] = useState<unknown>(null);
  const [templateInfo, setTemplateInfo] = useState<any>(null);
  const [view, setView] = useState<"preview" | "code" | "schema">("preview");
  const [pending, setPending] = useState(false);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [reason, setReason] = useState("");

  useEffect(() => {
    fetch(`/api/templates/${slug}/admin-preview`)
      .then((res) => {
        if (!res.ok) throw new Error("Falha ao carregar preview");
        return res.json();
      })
      .then((data) => {
        setHtml(data.html);
        setSourceCode(data.sourceCode);
        setFormSchema(data.formSchema);
        setTemplateInfo(data.template);
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message || "Erro ao carregar preview.");
        setLoading(false);
      });
  }, [slug]);

  async function handleApprove() {
    setPending(true);
    setError("");
    try {
      await moderateTemplateAction(templateId, "approve");
      onClose();
    } catch (e: any) {
      setError(e.message || "Erro ao aprovar.");
      setPending(false);
    }
  }

  async function handleReject() {
    if (!reason.trim()) {
      setError("Informe o motivo da rejeição.");
      return;
    }
    setPending(true);
    setError("");
    try {
      await moderateTemplateAction(templateId, "reject", reason);
      onClose();
    } catch (e: any) {
      setError(e.message || "Erro ao rejeitar.");
      setPending(false);
    }
  }

  const modal = (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="glass-panel rounded-2xl shadow-2xl w-[95vw] max-w-7xl h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h2 className="text-lg font-semibold text-card-foreground">
              Revisar Template: {templateInfo?.name ?? "..."}
            </h2>
            {templateInfo?.author && (
              <p className="text-xs text-muted-foreground mt-0.5">
                Autor: {templateInfo.author.displayName || templateInfo.author.email}
                {templateInfo.author.handle && ` @${templateInfo.author.handle}`}
                {" · "}Versão {templateInfo.version}
              </p>
            )}
          </div>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-lg transition-colors" aria-label="Fechar">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs de visualização */}
        <div className="flex gap-1 px-6 pt-3 border-b border-border/50">
          <button
            onClick={() => setView("preview")}
            className={`inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              view === "preview" ? "text-primary border-b-2 border-primary" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Eye className="w-4 h-4" />
            Preview
          </button>
          <button
            onClick={() => setView("code")}
            className={`inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              view === "code" ? "text-primary border-b-2 border-primary" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Code2 className="w-4 h-4" />
            Código HTML
          </button>
          <button
            onClick={() => setView("schema")}
            className={`inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              view === "schema" ? "text-primary border-b-2 border-primary" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <FileJson className="w-4 h-4" />
            Form Schema
          </button>
        </div>

        {/* Conteúdo */}
        <div className="flex-1 min-h-0 p-4 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full text-destructive text-sm">{error}</div>
          ) : view === "preview" ? (
            <iframe
              title="Preview do template"
              className="w-full h-full rounded-lg border border-border bg-white"
              sandbox="allow-scripts"
              srcDoc={html}
            />
          ) : view === "code" ? (
            <pre className="w-full h-full overflow-auto rounded-lg border border-border bg-[#0d1117] text-[13px] leading-relaxed text-[#c9d1d9] p-4 font-mono whitespace-pre-wrap break-words">
              {sourceCode}
            </pre>
          ) : (
            <pre className="w-full h-full overflow-auto rounded-lg border border-border bg-[#0d1117] text-[13px] leading-relaxed text-[#c9d1d9] p-4 font-mono whitespace-pre-wrap break-words">
              {JSON.stringify(formSchema, null, 2)}
            </pre>
          )}
        </div>

        {/* Footer com ações */}
        <div className="px-6 py-4 border-t border-border">
          {error && <p className="text-xs text-destructive mb-2">{error}</p>}

          {showRejectForm ? (
            <div className="flex flex-col gap-2">
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Motivo da rejeição (obrigatório)..."
                rows={2}
                className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground placeholder-muted-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
              />
              <div className="flex items-center gap-2">
                <button
                  onClick={handleReject}
                  disabled={pending}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-destructive px-4 py-2 text-sm font-semibold text-white hover:bg-destructive/90 transition-colors disabled:opacity-50"
                >
                  <X className="w-4 h-4" />
                  {pending ? "Rejeitando..." : "Confirmar Rejeição"}
                </button>
                <button
                  onClick={() => {
                    setShowRejectForm(false);
                    setReason("");
                    setError("");
                  }}
                  className="rounded-lg border border-border px-4 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setShowRejectForm(true)}
                disabled={pending}
                className="inline-flex items-center gap-1.5 rounded-lg border border-destructive/30 px-4 py-2 text-sm font-semibold text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
              >
                <X className="w-4 h-4" />
                Rejeitar
              </button>
              <button
                onClick={handleApprove}
                disabled={pending}
                className="inline-flex items-center gap-1.5 rounded-lg bg-chart-1 px-4 py-2 text-sm font-semibold text-white hover:bg-chart-1/90 transition-colors disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                {pending ? "Processando..." : "Aprovar"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return typeof window !== "undefined" ? createPortal(modal, document.body) : null;
}