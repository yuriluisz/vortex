"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

interface CopyCampaignLinkProps {
  slug: string;
  customDomain?: string | null;
  className?: string;
}

export function CopyCampaignLink({
  slug,
  customDomain,
  className,
}: CopyCampaignLinkProps) {
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

  const defaultClasses =
    "inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-foreground border border-white/10 hover:bg-white/5 transition-all duration-200 shadow-sm active:scale-95";

  return (
    <button
      type="button"
      onClick={handleCopy}
      title="Copiar link público da campanha"
      className={className || defaultClasses}
    >
      {copied ? (
        <>
          <Check className="h-3.5 w-3.5 text-emerald-400 animate-scale-in" />
          <span className="text-[11px] text-emerald-400 font-bold">Copiado!</span>
        </>
      ) : (
        <>
          <Copy className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-[11px]">Copiar Link</span>
        </>
      )}
    </button>
  );
}
