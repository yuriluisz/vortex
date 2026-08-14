"use client";

import { useEffect, useRef } from "react";

type AuroraBackgroundProps = {
  className?: string;
  intensity?: "subtle" | "moderate" | "intense";
};

/**
 * Aurora gradient animado — blobs de cor que flutuam lentamente.
 * Decorativo, GPU-friendly (transform + opacity), respeita prefers-reduced-motion.
 */
export function AuroraBackground({
  className = "",
  intensity = "moderate",
}: AuroraBackgroundProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (reduced) {
      // Estático para reduced-motion
      element.style.animation = "none";
    }
  }, []);

  const opacity =
    intensity === "subtle" ? "opacity-40" : intensity === "intense" ? "opacity-80" : "opacity-60";

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
    >
      {/* Blob 1 — primary */}
      <div
        className={`absolute -left-1/4 -top-1/4 h-[600px] w-[600px] rounded-full bg-primary/20 blur-[128px] animate-aurora-1 ${opacity}`}
      />
      {/* Blob 2 — accent */}
      <div
        className={`absolute -bottom-1/4 -right-1/4 h-[600px] w-[600px] rounded-full bg-accent/25 blur-[128px] animate-aurora-2 ${opacity}`}
      />
      {/* Blob 3 — chart-3 */}
      <div
        className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[400px] w-[400px] rounded-full bg-chart-3/15 blur-[100px] animate-aurora-3 ${opacity}`}
      />
    </div>
  );
}