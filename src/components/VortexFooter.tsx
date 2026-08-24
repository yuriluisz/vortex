"use client";

import { useState } from "react";
import ReportModal from "./ReportModal";

interface VortexFooterProps {
  campaignSlug: string;
  campaignName: string;
  tenantSlug: string;
  /** Tipo de conteúdo sendo exibido (campaign ou template) */
  contentType?: "campaign" | "template";
  /** Se true, o footer não é exibido (plano ULTRA com removeBranding) */
  hidden?: boolean;
}

/**
 * Footer institucional injetado automaticamente nas páginas de campanha.
 * Exibe "Made with" + logo Vórtex+ no centro e link de report à direita.
 * Não é removível pelo usuário (exceto plano ULTRA).
 */
export default function VortexFooter({
  campaignSlug,
  campaignName,
  tenantSlug,
  contentType = "campaign",
  hidden = false,
}: VortexFooterProps) {
  const [showReport, setShowReport] = useState(false);

  if (hidden) return null;

  return (
    <>
      <footer className="w-full bg-black px-4 py-3 sm:px-6 flex items-center justify-between gap-4 text-xs text-neutral-400 min-h-[48px] border-t border-white/5 relative">
        <div className="flex-1 hidden sm:block" />

        {/* Made with + Logo no centro */}
        <a
          href="https://vortexpages.online"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-neutral-400 hover:text-white transition-colors"
        >
          <span>Made with</span>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/Vortex Padrão.svg"
            alt="Vórtex+"
            className="h-3.5 sm:h-4 w-auto invert block"
          />
        </a>

        {/* Link de report à direita */}
        <div className="flex-1 flex justify-end">
          <button
            onClick={() => setShowReport(true)}
            className="text-neutral-500 hover:text-neutral-300 transition-colors text-[11px] sm:text-xs underline underline-offset-2"
          >
            Reporte aqui
          </button>
        </div>
      </footer>

      {/* Modal de Report */}
      {showReport && (
        <ReportModal
          campaignSlug={campaignSlug}
          campaignName={campaignName}
          tenantSlug={tenantSlug}
          contentType={contentType}
          onClose={() => setShowReport(false)}
        />
      )}
    </>
  );
}
