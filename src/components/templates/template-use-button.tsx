"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Loader2, Copy, Sparkles } from "lucide-react";

interface TemplateUseButtonProps {
  templateSlug: string;
  templateName?: string;
}

/**
 * Botão "Usar Template" que clona o template para a conta do usuário com confirmação em popup.
 * Usuários não logados são redirecionados para o login.
 */
export function TemplateUseButton({ templateSlug, templateName }: TemplateUseButtonProps) {
  const [loading, setLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function handleUse() {
    setLoading(true);
    setError(null);
    router.push(`/admin/campaigns/new?template=${encodeURIComponent(templateSlug)}`);
  }

  return (
    <div className="space-y-3">
      <button
        onClick={() => setShowConfirmModal(true)}
        disabled={loading}
        className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md active:scale-[0.98]"
      >
        <Copy className="w-5 h-5" />
        Usar este Template
      </button>

      {error && !showConfirmModal && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      {/* Modal de Confirmação de Uso do Template */}
      {showConfirmModal && typeof window !== "undefined" && createPortal(
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget && !loading) {
              setShowConfirmModal(false);
            }
          }}
        >
          <div className="bg-card border border-border rounded-2xl p-6 max-w-md w-full shadow-2xl shadow-primary/10 animate-in zoom-in-95 duration-200 text-left">
            <div className="flex items-center gap-3.5 mb-4">
              <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20 shadow-inner">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-card-foreground">Usar este Template?</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Criar campanha a partir do modelo</p>
              </div>
            </div>

            <p className="text-sm text-muted-foreground leading-relaxed mb-6">
              Uma nova campanha será criada na sua conta a partir do template <strong className="text-foreground font-semibold">{templateName || "selecionado"}</strong>. Você será direcionado para o editor onde poderá alterar textos, links e formulários.
            </p>

            {error && (
              <div className="mb-4 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-2.5 text-xs text-destructive">
                {error}
              </div>
            )}

            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                disabled={loading}
                className="px-4 py-2.5 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleUse}
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-all active:scale-[0.98] disabled:opacity-50 shadow-lg shadow-primary/20"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Criando Campanha...
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Confirmar e Usar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}