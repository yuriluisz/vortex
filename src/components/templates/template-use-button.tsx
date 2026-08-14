"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Copy } from "lucide-react";

interface TemplateUseButtonProps {
  templateSlug: string;
}

/**
 * Botão "Usar Template" que clona o template para a conta do usuário.
 * Usuários não logados são redirecionados para o login.
 */
export function TemplateUseButton({ templateSlug }: TemplateUseButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleUse() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/templates/${templateSlug}/use`, {
        method: "POST",
      });

      if (res.status === 401) {
        router.push("/admin/login?redirect=/templates");
        return;
      }

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Erro ao usar template.");
        return;
      }

      // Redirect para a campanha criada
      router.push(`/admin/campaigns/${data.campaignId}`);
    } catch {
      setError("Erro ao usar template.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <button
        onClick={handleUse}
        disabled={loading}
        className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Criando campanha...
          </>
        ) : (
          <>
            <Copy className="w-5 h-5" />
            Usar este Template
          </>
        )}
      </button>
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}