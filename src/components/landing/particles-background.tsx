"use client";

import { useEffect, useRef } from "react";

type ParticlesBackgroundProps = {
  className?: string;
  count?: number;
};

type Particle = {
  x: number;
  y: number;
  size: number;
  speed: number;
  drift: number;
  opacity: number;
  phase: number;
};

/**
 * Partículas flotantes sutiles — puntos de luz que suben lentamente.
 * Decorativo, canvas con requestAnimationFrame, respeta prefers-reduced-motion.
 */
export function ParticlesBackground({
  className = "",
  count = 18,
}: ParticlesBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let width = 0;
    let height = 0;
    let raf = 0;
    let time = 0;

    const particles: Particle[] = Array.from({ length: count }, () => ({
      x: Math.random(),
      y: Math.random(),
      size: 0.8 + Math.random() * 1.6,
      speed: 0.02 + Math.random() * 0.04,
      drift: (Math.random() - 0.5) * 0.02,
      opacity: 0.1 + Math.random() * 0.2,
      phase: Math.random() * Math.PI * 2,
    }));

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const rect = parent.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    const observer = new ResizeObserver(resize);
    if (canvas.parentElement) observer.observe(canvas.parentElement);

    const draw = () => {
      time += 0.016;
      ctx.clearRect(0, 0, width, height);

      for (const p of particles) {
        // Movimiento vertical lento + deriva horizontal
        p.y -= p.speed * 0.01;
        p.x += p.drift * 0.01;

        // Reset cuando sale por arriba
        if (p.y < -0.05) {
          p.y = 1.05;
          p.x = Math.random();
        }

        // Opacidad pulsante sutil
        const alpha = p.opacity * (0.7 + 0.3 * Math.sin(time * 0.5 + p.phase));

        const x = p.x * width;
        const y = p.y * height;

        ctx.beginPath();
        ctx.arc(x, y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(139, 92, 246, ${alpha.toFixed(3)})`;
        ctx.fill();
      }

      raf = requestAnimationFrame(draw);
    };

    if (reduced) {
      // Frame estático para reduced-motion
      ctx.clearRect(0, 0, width, height);
      for (const p of particles) {
        ctx.beginPath();
        ctx.arc(p.x * width, p.y * height, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(139, 92, 246, ${p.opacity.toFixed(3)})`;
        ctx.fill();
      }
    } else {
      raf = requestAnimationFrame(draw);
    }

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
    };
  }, [count]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 ${className}`}
    />
  );
}