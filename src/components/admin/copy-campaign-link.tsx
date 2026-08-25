"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

interface CopyCampaignLinkProps {
  slug: string;
  customDomain?: string | null;
}

export function CopyCampaignLink({ slug, customDomain }: CopyCampaignLinkProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const url = customDomain ? `https://${customDomain}` : `${origin}/${slug}`;

    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      title="Copiar link público"
      className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium text-muted-foreground bg-muted/60 hover:bg-muted hover:text-foreground transition-all duration-150 border border-border/40 active:scale-95"
    >
      {copied ? (
        <>
          <Check className="h-3 w-3 text-primary animate-scale-in" />
          <span className="text-[11px] text-primary font-semibold">Copiado</span>
        </>
      ) : (
        <>
          <Copy className="h-3 w-3" />
          <span className="text-[11px]">Copiar link</span>
        </>
      )}
    </button>
  );
}
