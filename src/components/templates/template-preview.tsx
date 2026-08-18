"use client";

import { useEffect, useState, useRef } from "react";

interface TemplatePreviewProps {
  templateId: string;
  slug: string;
  name: string;
}

/**
 * Componente de preview de template em iframe sandbox.
 * Renderiza o HTML em um iframe isolado para segurança.
 */
export function TemplatePreview({ templateId: _templateId, slug, name }: TemplatePreviewProps) {
  const [html, setHtml] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const loadedRef = useRef(false);

  useEffect(() => {
    // Evitar dupla chamada em StrictMode
    if (loadedRef.current) return;
    loadedRef.current = true;

    fetch(`/api/templates/${slug}/preview`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load");
        return res.text();
      })
      .then((html) => {
        setHtml(html);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, [slug]);

  // Atualizar iframe quando o HTML carregar
  useEffect(() => {
    if (html && iframeRef.current) {
      const iframe = iframeRef.current;
      iframe.srcdoc = html;
    }
  }, [html]);

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-muted/50">
        <div className="animate-pulse text-sm text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-muted/50">
        <span className="text-sm text-muted-foreground">Preview indisponível</span>
      </div>
    );
  }

  return (
    <iframe
      ref={iframeRef}
      title={name}
      className="w-full h-full bg-white"
      sandbox="allow-scripts"
      loading="lazy"
    />
  );
}