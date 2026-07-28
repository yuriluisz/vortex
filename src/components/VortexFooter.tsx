"use client";

import { useState } from "react";
import ReportModal from "./ReportModal";

interface VortexFooterProps {
  campaignSlug: string;
  campaignName: string;
  tenantSlug: string;
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
  hidden = false,
}: VortexFooterProps) {
  const [showReport, setShowReport] = useState(false);

  if (hidden) return null;

  return (
    <>
      <footer
        style={{
          width: "100%",
          background: "#000000",
          padding: "12px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "13px",
          color: "#a3a3a3",
          fontFamily: "system-ui, -apple-system, sans-serif",
          boxSizing: "border-box",
          minHeight: "48px",
          flexShrink: 0,
          position: "relative",
        }}
      >
        {/* Made with + Logo no centro */}
        <a
          href="https://vortexpages.online"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: "#a3a3a3",
            textDecoration: "none",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <span>Made with</span>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/Vortex Padrão.svg"
            alt="Vórtex+"
            style={{
              height: "16px",
              width: "auto",
              filter: "invert(1)",
              display: "block",
            }}
          />
        </a>

        {/* Link de report à direita */}
        <button
          onClick={() => setShowReport(true)}
          style={{
            background: "none",
            border: "none",
            color: "#a3a3a3",
            cursor: "pointer",
            fontSize: "13px",
            fontFamily: "inherit",
            textDecoration: "underline",
            textUnderlineOffset: "2px",
            padding: "4px 0",
            position: "absolute",
            right: "24px",
          }}
        >
          Reporte aqui
        </button>
      </footer>

      {/* Modal de Report */}
      {showReport && (
        <ReportModal
          campaignSlug={campaignSlug}
          campaignName={campaignName}
          tenantSlug={tenantSlug}
          onClose={() => setShowReport(false)}
        />
      )}
    </>
  );
}
