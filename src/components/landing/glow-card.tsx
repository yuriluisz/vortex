"use client";

import { useRef } from "react";

type GlowCardProps = {
  children: React.ReactNode;
  className?: string;
};

/**
 * Card com glow radial sutil que acompanha a posição do mouse.
 * O estilo do glow vem da classe `.glow-card` no globals.css.
 * Usa lerp + requestAnimationFrame para suavizar o movimento.
 */
export function GlowCard({ children, className = "" }: GlowCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);
  const currentRef = useRef({ x: 0.5, y: 0.5 });
  const targetRef = useRef({ x: 0.5, y: 0.5 });

  const animate = () => {
    const element = ref.current;
    if (!element) return;

    // Lerp suave (spring-like)
    currentRef.current.x += (targetRef.current.x - currentRef.current.x) * 0.12;
    currentRef.current.y += (targetRef.current.y - currentRef.current.y) * 0.12;

    element.style.setProperty("--gx", `${currentRef.current.x}px`);
    element.style.setProperty("--gy", `${currentRef.current.y}px`);

    rafRef.current = requestAnimationFrame(animate);
  };

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const element = ref.current;
    if (!element) return;
    const rect = element.getBoundingClientRect();
    targetRef.current.x = event.clientX - rect.left;
    targetRef.current.y = event.clientY - rect.top;
  };

  const onPointerEnter = () => {
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(animate);
  };

  const onPointerLeave = () => {
    cancelAnimationFrame(rafRef.current);
    const element = ref.current;
    if (!element) return;
    // Reset to center on leave
    targetRef.current.x = element.offsetWidth / 2;
    targetRef.current.y = element.offsetHeight / 2;
    rafRef.current = requestAnimationFrame(animate);
    // Stop after settling
    setTimeout(() => cancelAnimationFrame(rafRef.current), 100);
  };

  return (
    <div
      ref={ref}
      onPointerMove={onPointerMove}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
      className={`glow-card ${className}`}
    >
      {children}
    </div>
  );
}
