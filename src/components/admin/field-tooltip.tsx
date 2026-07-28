"use client";

import { useState, useRef, useEffect } from "react";
import { Info } from "lucide-react";
import { useRouter } from "next/navigation";

interface FieldTooltipProps {
  /** Texto explicativo exibido no popover ao passar o mouse */
  tooltip: string;
  /** ID da seção na documentação (ex: "slug-url") — usado para montar /admin/docs#anchor */
  docsAnchor: string;
}

export function FieldTooltip({ tooltip, docsAnchor }: FieldTooltipProps) {
  const router = useRouter();
  const [visible, setVisible] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const show = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setVisible(true);
  };

  const hide = () => {
    timeoutRef.current = setTimeout(() => setVisible(false), 200);
  };

  // Fechar ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setVisible(false);
      }
    };
    if (visible) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [visible]);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    router.push(`/admin/docs#${docsAnchor}`);
  };

  return (
    <div ref={containerRef} className="relative inline-flex items-center ml-1.5">
      <button
        type="button"
        onMouseEnter={show}
        onMouseLeave={hide}
        onClick={handleClick}
        className="flex items-center justify-center h-4 w-4 rounded-full text-muted-foreground/50 hover:text-primary hover:bg-primary/10 transition-all duration-200 cursor-help"
        aria-label="Ver informações sobre este campo"
      >
        <Info className="h-3.5 w-3.5" />
      </button>

      {/* Popover */}
      {visible && (
        <div
          ref={popoverRef}
          onMouseEnter={show}
          onMouseLeave={hide}
          className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 animate-in fade-in zoom-in-95 duration-200"
        >
          <div className="rounded-xl border border-border bg-popover px-4 py-3 shadow-xl">
            <p className="text-xs text-popover-foreground leading-relaxed">
              {tooltip}
            </p>
            <div className="mt-2 pt-2 border-t border-border">
              <button
                type="button"
                onClick={handleClick}
                className="text-[10px] font-medium text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
              >
                <Info className="h-2.5 w-2.5" />
                Ver na documentação →
              </button>
            </div>
          </div>
          {/* Seta do popover */}
          <div className="absolute left-1/2 -translate-x-1/2 -bottom-1.5 w-3 h-3 rotate-45 border-r border-b border-border bg-popover" />
        </div>
      )}
    </div>
  );
}
