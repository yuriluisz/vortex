"use client";

import Script from "next/script";
import { useEffect, useRef } from "react";

interface MetaPixelProps {
  pixelId: string | null | undefined;
  /** Evento adicional a ser disparado após o PageView */
  trackEvent?: "Lead" | "CompleteRegistration" | "ViewContent";
  /** Se true, redireciona para esta URL após disparar o evento (usado no redirect) */
  redirectUrl?: string;
}

/**
 * Componente unificado de injeção do Meta Pixel.
 *
 * - Sanitiza o pixelId (apenas dígitos)
 * - Adiciona fallback <noscript>
 * - Suporta eventos extras (Lead, CompleteRegistration, ViewContent)
 * - Suporta redirect após disparo do evento (para página de redirect)
 */
export default function MetaPixel({
  pixelId,
  trackEvent,
  redirectUrl,
}: MetaPixelProps) {
  const eventFired = useRef(false);

  const isValid = Boolean(pixelId && /^\d+$/.test(pixelId));

  // Disparar evento extra + redirect no client-side
  useEffect(() => {
    if (!isValid || eventFired.current) return;
    if (!trackEvent && !redirectUrl) return;

    eventFired.current = true;

    const run = () => {
      const fbq = (window as any).fbq;
      if (trackEvent && fbq) {
        fbq("track", trackEvent);
      }

      if (redirectUrl) {
        // Pequeno delay para garantir que o evento subiu para a Meta
        setTimeout(() => {
          window.location.href = redirectUrl;
        }, 300);
      }
    };

    // Se fbq já estiver carregado, executa imediatamente
    if ((window as any).fbq) {
      run();
    } else {
      // Senão, espera o script carregar
      const interval = setInterval(() => {
        if ((window as any).fbq) {
          clearInterval(interval);
          run();
        }
      }, 50);
      // Timeout de segurança
      setTimeout(() => clearInterval(interval), 5000);
    }
  }, [isValid, trackEvent, redirectUrl]);

  if (!isValid) {
    return null;
  }

  return (
    <>
      <Script
        id="meta-pixel"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${pixelId}');
            fbq('track', 'PageView');
          `,
        }}
      />
      {/* Fallback <noscript> para visitantes sem JavaScript */}
      <noscript>
        <img
          height="1"
          width="1"
          style={{ display: "none" }}
          src={`https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>
    </>
  );
}