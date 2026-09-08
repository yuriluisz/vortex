import React from "react";

interface PageTransitionProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

/**
 * PageTransition
 * 
 * Envolve a página com animação de entrada fluida e acelerada por hardware (CSS).
 * Compatível com Server e Client Components no Next.js 16 App Router.
 */
export function PageTransition({
  children,
  className = "",
  ...props
}: PageTransitionProps) {
  return (
    <div
      className={`animate-page-enter w-full flex-1 flex flex-col min-h-0 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
