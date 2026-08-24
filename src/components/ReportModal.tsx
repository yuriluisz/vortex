"use client";

import { useState } from "react";
import { AlertCircle, CheckCircle2, Flag, Loader2, X } from "lucide-react";

interface ReportModalProps {
  campaignSlug: string;
  campaignName: string;
  tenantSlug: string;
  /** Tipo de conteúdo sendo denunciado (campaign ou template) */
  contentType?: "campaign" | "template";
  onClose: () => void;
}

/**
 * Modal de report de conteúdo.
 * Permite ao visitante denunciar uma campanha enviando um email para o suporte.
 */
export default function ReportModal({
  campaignSlug,
  campaignName,
  tenantSlug,
  contentType = "campaign",
  onClose,
}: ReportModalProps) {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !message.trim()) {
      setError("Preencha todos os campos.");
      return;
    }

    setSending(true);
    setError("");

    try {
      const res = await fetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reporterEmail: email.trim(),
          message: message.trim(),
          campaignSlug,
          campaignName,
          tenantSlug,
          contentType,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erro ao enviar report.");
      }

      setSent(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao enviar. Tente novamente.");
    } finally {
      setSending(false);
    }
  }

  // Fechar ao clicar no overlay
  function handleOverlayClick(e: React.MouseEvent) {
    if (e.target === e.currentTarget) onClose();
  }

  return (
    <div
      onClick={handleOverlayClick}
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200"
    >
      <div className="bg-zinc-950 border border-white/15 rounded-2xl p-5 sm:p-6 w-full max-w-md max-h-[90dvh] overflow-y-auto shadow-2xl text-foreground animate-in zoom-in-95 duration-200 relative">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
          aria-label="Fechar"
        >
          <X className="w-4 h-4" />
        </button>

        {sent ? (
          <div className="text-center py-6">
            <div className="flex justify-center mb-3">
              <CheckCircle2 className="w-12 h-12 text-emerald-400" />
            </div>
            <h2 className="text-lg font-bold text-white">
              Report enviado!
            </h2>
            <p className="text-sm text-neutral-400 mt-2">
              Obrigado. Sua mensagem foi enviada para nossa equipe de moderação.
            </p>
            <button
              onClick={onClose}
              className="mt-6 inline-flex items-center justify-center bg-white text-black font-semibold rounded-xl px-6 py-2.5 text-sm hover:bg-neutral-200 active:scale-95 transition-all"
            >
              Fechar
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2.5 mb-5 pr-8">
              <div className="p-2 rounded-xl bg-destructive/15 text-destructive border border-destructive/20">
                <Flag className="w-4 h-4" />
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white">
                Reportar Conteúdo
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label
                  htmlFor="report-email"
                  className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1.5"
                >
                  Seu email
                </label>
                <input
                  id="report-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="w-full rounded-xl border border-white/15 bg-white/[0.05] px-3.5 py-2.5 text-sm text-white placeholder:text-neutral-500 outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>

              <div>
                <label
                  htmlFor="report-message"
                  className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1.5"
                >
                  O que você encontrou?
                </label>
                <textarea
                  id="report-message"
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Descreva o problema encontrado..."
                  rows={4}
                  className="w-full rounded-xl border border-white/15 bg-white/[0.05] px-3.5 py-2.5 text-sm text-white placeholder:text-neutral-500 outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all resize-y"
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 text-xs text-destructive bg-destructive/10 border border-destructive/20 p-2.5 rounded-lg">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="flex items-center gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs sm:text-sm font-medium rounded-xl border border-white/10 text-neutral-400 hover:text-white hover:bg-white/5 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={sending}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {sending ? "Enviando..." : "Enviar Report"}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}