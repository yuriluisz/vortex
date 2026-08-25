"use client";

import Script from "next/script";
import { useEffect, useRef } from "react";

export function formatGtmId(gtmId: string | null | undefined): string | null {
  if (!gtmId) return null;
  const clean = gtmId.trim().toUpperCase();
  return /^GTM-[A-Z0-9]+$/.test(clean) ? clean : null;
}

export function isValidGtmId(gtmId: string | null | undefined): boolean {
  return formatGtmId(gtmId) !== null;
}

export interface GoogleTagManagerProps {
  gtmId: string | null | undefined;
  /** Evento opcional a ser disparado no dataLayer */
  trackEvent?: "generate_lead" | "join_group" | "page_view";
  /** Parâmetros adicionais para o evento do dataLayer */
  eventParams?: Record<string, unknown>;
  /** Se informado, redireciona para esta URL após disparar o evento */
  redirectUrl?: string;
}

/**
 * Componente nativo de injeção do Google Tag Manager (GTM).
 *
 * - Valida e sanitiza o gtmId (padrão GTM-XXXXXXX)
 * - Injeta snippet oficial via next/script (strategy="afterInteractive")
 * - Injeta fallback <noscript> com iframe seguro
 * - Suporta envio de eventos para window.dataLayer e timing seguro de redirect
 */
export default function GoogleTagManager({
  gtmId,
  trackEvent,
  eventParams,
  redirectUrl,
}: GoogleTagManagerProps) {
  const eventFired = useRef(false);
  const cleanId = formatGtmId(gtmId);

  // Disparar evento extra + redirect no client-side
  useEffect(() => {
    if (!cleanId || eventFired.current) return;
    if (!trackEvent && !redirectUrl) return;

    eventFired.current = true;

    const run = () => {
      const w = window as unknown as { dataLayer?: Array<Record<string, unknown>> };
      w.dataLayer = w.dataLayer || [];

      if (trackEvent) {
        w.dataLayer.push({
          event: trackEvent,
          ...eventParams,
        });
      }

      if (redirectUrl) {
        // Pequeno delay para garantir processamento dos eventos no container
        setTimeout(() => {
          window.location.href = redirectUrl;
        }, 300);
      }
    };

    run();
  }, [cleanId, trackEvent, eventParams, redirectUrl]);

  if (!cleanId) {
    return null;
  }

  return (
    <>
      <Script
        id="google-tag-manager"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','${cleanId}');
          `,
        }}
      />
      {/* Fallback <noscript> para visitantes sem JavaScript */}
      <noscript>
        <iframe
          src={`https://www.googletagmanager.com/ns.html?id=${cleanId}`}
          height="0"
          width="0"
          style={{ display: "none", visibility: "hidden" }}
          title="Google Tag Manager"
        />
      </noscript>
    </>
  );
}
