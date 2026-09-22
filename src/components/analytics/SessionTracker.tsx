"use client";

import { useEffect, useRef } from "react";

interface SessionTrackerProps {
  campaignId: string;
  enabled: boolean;
}

export default function SessionTracker({ campaignId, enabled }: SessionTrackerProps) {
  const initializedRef = useRef(false);

  useEffect(() => {
    // Não rastrear dentro de iframes (ex: preview do editor ou heatmap no admin)
    if (!enabled || initializedRef.current || typeof window === "undefined" || window.self !== window.top) return;
    initializedRef.current = true;

    // Gerar ou recuperar sessionId único para a aba/visita
    let sessionId = "";
    try {
      sessionId = sessionStorage.getItem(`vtx_rec_${campaignId}`) || "";
      if (!sessionId) {
        sessionId = `s_${Math.random().toString(36).slice(2, 11)}_${Date.now()}`;
        sessionStorage.setItem(`vtx_rec_${campaignId}`, sessionId);
      }
    } catch {
      sessionId = `s_${Math.random().toString(36).slice(2, 11)}_${Date.now()}`;
    }

    const startTime = Date.now();
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
    const device = isMobile ? "mobile" : "desktop";

    // Extrair UTMs da URL
    const urlParams = new URLSearchParams(window.location.search);
    const utmSource = urlParams.get("utm_source") || undefined;
    const utmMedium = urlParams.get("utm_medium") || undefined;
    const utmCampaign = urlParams.get("utm_campaign") || undefined;

    const allSessionEvents: unknown[] = [];
    const clicksQueue: { x: number; y: number }[] = [];
    let hasNewEvents = false;
    const MAX_EVENTS_LIMIT = 2500;
    let totalClicks = 0;
    let flushTimer: NodeJS.Timeout | null = null;
    let stopRecording: (() => void) | null = null;

    let isFlushing = false;

    // Listener para Mapa de Calor (Heatmap)
    const handleClick = (e: MouseEvent) => {
      totalClicks++;
      const docHeight = Math.max(
        document.body.scrollHeight,
        document.documentElement.scrollHeight,
        document.body.offsetHeight,
        1
      );
      const pageY = e.pageY ?? (e.clientY + (window.scrollY || window.pageYOffset || 0));
      const pageX = e.pageX ?? (e.clientX + (window.scrollX || window.pageXOffset || 0));
      const docWidth = Math.max(
        document.documentElement.clientWidth,
        document.body.scrollWidth,
        1
      );

      // X em % relativo à largura da página (eliminando scrollbars fixas)
      const x = Math.min(100, Math.max(0, (pageX / docWidth) * 100));
      // Y em % relativo à altura total do documento rolado
      const y = Math.min(100, Math.max(0, (pageY / docHeight) * 100));

      clicksQueue.push({
        x: Math.round(x * 10) / 10,
        y: Math.round(y * 10) / 10,
      });
    };

    window.addEventListener("click", handleClick, { passive: true });

    // Função para comprimir array em gzip base64 usando CompressionStream nativo
    async function compressEventsToGzipBase64(data: unknown): Promise<string | null> {
      try {
        if (!("CompressionStream" in window)) return null;
        const jsonStr = JSON.stringify(data);
        const stream = new Blob([jsonStr])
          .stream()
          .pipeThrough(new (window as unknown as { CompressionStream: new (type: string) => TransformStream }).CompressionStream("gzip"));
        const buffer = await new Response(stream).arrayBuffer();
        const bytes = new Uint8Array(buffer);
        let binary = "";
        const chunkSize = 0x8000;
        for (let i = 0; i < bytes.length; i += chunkSize) {
          binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunkSize)));
        }
        return btoa(binary);
      } catch (err) {
        console.warn("Compressão gzip nativa falhou, usando JSON fallback", err);
        return null;
      }
    }

    // Envio dos dados para a API
    async function flush(useBeacon = false) {
      if (flushTimer) {
        clearTimeout(flushTimer);
        flushTimer = null;
      }

      if (isFlushing && !useBeacon) {
        scheduleFlush(1500);
        return;
      }

      if (!hasNewEvents && clicksQueue.length === 0) return;
      hasNewEvents = false;
      isFlushing = true;

      // Envia a gravação cumulativa completa da sessão para que o R2 sempre tenha o histórico do início ao fim
      const eventsToSend = [...allSessionEvents];
      const clicksToSend = clicksQueue.splice(0, clicksQueue.length);

      const duration = Math.round((Date.now() - startTime) / 1000);

      const basePayload: Record<string, unknown> = {
        campaignId,
        sessionId,
        duration,
        clicksCount: totalClicks,
        clicks: clicksToSend,
        device,
        pageUrl: window.location.href,
        utmSource,
        utmMedium,
        utmCampaign,
      };

      try {
        // Tentar comprimir eventos
        if (eventsToSend.length > 0) {
          const gzip = await compressEventsToGzipBase64(eventsToSend);
          if (gzip) {
            basePayload.gzip = gzip;
          } else {
            basePayload.events = eventsToSend;
          }
        }

        const jsonBody = JSON.stringify(basePayload);
        const byteLength = jsonBody.length;

        if (useBeacon) {
          // No Chromium/Firefox, beacons e requests com keepalive: true falham se passarem de 64KB
          if (byteLength < 60000 && navigator.sendBeacon) {
            try {
              const blob = new Blob([jsonBody], { type: "application/json" });
              if (navigator.sendBeacon("/api/analytics/recordings/ingest", blob)) {
                return;
              }
            } catch {}
          }

          fetch("/api/analytics/recordings/ingest", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: jsonBody,
            keepalive: byteLength < 60000,
          }).catch(() => {});
          return;
        }

        // Flushes periódicos durante a navegação NÃO usam keepalive para não esbarrar no limite de 64KB
        await fetch("/api/analytics/recordings/ingest", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: jsonBody,
          keepalive: false,
        });
      } catch {
        // Silencia erros de rede transitórios
      } finally {
        isFlushing = false;
      }
    }

    function scheduleFlush(delay = 3000) {
      if (!flushTimer) {
        flushTimer = setTimeout(() => flush(false), delay);
      }
    }

    // Inicializar o rrweb dinamicamente
    import("rrweb")
      .then((rrweb) => {
        const record = rrweb.record || (rrweb as unknown as { default: { record: typeof rrweb.record } }).default?.record;
        if (!record || typeof record !== "function") return;

        stopRecording = record({
          emit(event) {
            if (allSessionEvents.length < MAX_EVENTS_LIMIT) {
              allSessionEvents.push(event);
            }
            hasNewEvents = true;

            // Snapshot inicial (type 2) deve ser enviado com prioridade
            if (event && event.type === 2) {
              scheduleFlush(800);
            } else if (allSessionEvents.length % 35 === 0) {
              flush(false);
            } else {
              scheduleFlush(3000);
            }
          },
          // Mascaramento total de inputs e dados sensíveis (LGPD / PII)
          maskAllInputs: true,
          maskTextSelector: "[data-vtx-mask], .vtx-mask, [data-sensitive], input[type='password']",
          blockClass: "vtx-no-record",
          inlineStylesheet: true,
          slimDOMOptions: "all",
          sampling: {
            scroll: 150,
            input: "last",
          },
        }) as () => void;
      })
      .catch((err) => {
        console.error("Falha ao inicializar gravador de sessões:", err);
      });

    // Enviar dados residuais ao sair da página
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        flush(true);
      }
    };

    const handlePageHide = () => {
      flush(true);
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pagehide", handlePageHide);

    // Heartbeat periódico (a cada 6s) para que visitantes no mobile que apenas leem
    // sem mover o ponteiro (sem mousemove) continuem tendo a duração e eventos sincronizados
    const heartbeatInterval = setInterval(() => {
      if (hasNewEvents || clicksQueue.length > 0) {
        flush(false);
      }
    }, 6000);

    return () => {
      clearInterval(heartbeatInterval);
      window.removeEventListener("click", handleClick);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pagehide", handlePageHide);
      if (stopRecording) {
        try {
          stopRecording();
        } catch {}
      }
      flush(true);
    };
  }, [campaignId, enabled]);

  return null;
}
