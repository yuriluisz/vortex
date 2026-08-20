"use client";

import React, { useEffect, useState, useTransition, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";

function NavigationProgressBarInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isNavigating, setIsNavigating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [, startTransition] = useTransition();

  // Reset and pulse progress on route / search parameter changes
  useEffect(() => {
    let t1: NodeJS.Timeout;
    let t2: NodeJS.Timeout;
    let t3: NodeJS.Timeout;

    startTransition(() => {
      setProgress(30);
      setIsNavigating(true);

      t1 = setTimeout(() => setProgress(80), 80);
      t2 = setTimeout(() => setProgress(100), 200);
      t3 = setTimeout(() => {
        setIsNavigating(false);
        setProgress(0);
      }, 360);
    });

    return () => {
      if (t1) clearTimeout(t1);
      if (t2) clearTimeout(t2);
      if (t3) clearTimeout(t3);
    };
  }, [pathname, searchParams]);

  if (!isNavigating && progress === 0) {
    return null;
  }

  return (
    <div
      aria-hidden="true"
      className="fixed top-0 left-0 right-0 z-[9999] pointer-events-none h-[2px] bg-transparent"
    >
      <div
        className="h-full bg-gradient-to-r from-primary/80 via-primary to-accent transition-all duration-200 ease-out shadow-[0_0_12px_rgba(var(--primary),0.8)]"
        style={{
          width: `${progress}%`,
          opacity: progress === 100 ? 0 : 1,
          transition: progress === 100 ? "width 150ms ease-out, opacity 150ms ease-in" : "width 200ms ease-out",
        }}
      />
    </div>
  );
}

export function NavigationProgress() {
  return (
    <Suspense fallback={null}>
      <NavigationProgressBarInner />
    </Suspense>
  );
}
