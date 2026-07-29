"use client";

interface PlanBadgeProps {
  plan: "FREE" | "PRO" | "ULTRA";
  className?: string;
}

export function PlanBadge({ plan, className = "" }: PlanBadgeProps) {
  if (plan === "FREE") {
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider text-muted-foreground bg-muted border border-border ${className}`}>
        Grátis
      </span>
    );
  }

  if (plan === "PRO") {
    return (
      <span
        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-500 border border-blue-500/50 shadow-[0_0_10px_rgba(59,130,246,0.4)] animate-pulse ${className}`}
      >
        Pro
      </span>
    );
  }

  if (plan === "ULTRA") {
    return (
      <span
        className={`relative inline-flex items-center justify-center rounded-full p-[1px] text-[10px] font-bold uppercase tracking-wider ${className}`}
      >
        {/* Animated Gradient Background (Border) */}
        <span
          className="absolute inset-0 rounded-full bg-[length:200%_auto]"
          style={{
            backgroundImage: "linear-gradient(90deg, #3b82f6, #8b5cf6, #06b6d4, #3b82f6)",
            animation: "smooth-shift 3s linear infinite",
          }}
        ></span>
        {/* Blurred Glow behind */}
        <span
          className="absolute inset-0 rounded-full blur-[4px] opacity-60 bg-[length:200%_auto]"
          style={{
            backgroundImage: "linear-gradient(90deg, #3b82f6, #8b5cf6, #06b6d4, #3b82f6)",
            animation: "smooth-shift 3s linear infinite",
          }}
        ></span>
        {/* Inner dark pill with White text */}
        <span className="relative z-10 flex items-center bg-zinc-950 px-2 py-0.5 rounded-full text-white shadow-inner">
          Ultra
        </span>
        <style jsx>{`
          @keyframes smooth-shift {
            0% {
              background-position: 0% 50%;
            }
            100% {
              background-position: 200% 50%;
            }
          }
        `}</style>
      </span>
    );
  }

  return null;
}
