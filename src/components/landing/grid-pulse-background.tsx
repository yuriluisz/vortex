"use client";

import { useEffect, useRef } from "react";

type GridPulseBackgroundProps = {
  className?: string;
};

/**
 * Grid de líneas finas que pulsa suavemente — efecto radar.
 * Decorativo, GPU-friendly (transform + opacity), respeta prefers-reduced-motion.
 */
export function GridPulseBackground({ className = "" }: GridPulseBackgroundProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (reduced) {
      element.style.animation = "none";
    }
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
    >
      {/* Grid de líneas */}
      <div
        className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:48px_48px] animate-grid-pulse"
      />
      {/* Glow central */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[300px] w-[300px] rounded-full bg-primary/5 blur-[80px]" />
    </div>
  );
}