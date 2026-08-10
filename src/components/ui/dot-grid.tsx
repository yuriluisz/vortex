"use client";

import { useEffect, useRef } from "react";

/**
 * Fundo minimalista de bolinhas em canvas que reagem ao mouse.
 * As bolinhas próximas ao cursor acendem e crescem suavemente,
 * com uma onda idle sutil quando o mouse está parado.
 */
export function DotGrid() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const SPACING = 25;
    const INFLUENCE_RADIUS = 120;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    let width = 0;
    let height = 0;
    let raf = 0;
    let time = 0;

    // Posição atual (suavizada) e alvo do mouse
    const mouse = { x: -9999, y: -9999, tx: -9999, ty: -9999 };

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

    const onPointerMove = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.tx = event.clientX - rect.left;
      mouse.ty = event.clientY - rect.top;
    };

    const onPointerLeave = () => {
      mouse.tx = -9999;
      mouse.ty = -9999;
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    document.documentElement.addEventListener(
      "pointerleave",
      onPointerLeave
    );

    const draw = () => {
      time += 0.016;

      // Interpolação suave do cursor (lerp)
      mouse.x += (mouse.tx - mouse.x) * 0.12;
      mouse.y += (mouse.ty - mouse.y) * 0.12;

      ctx.clearRect(0, 0, width, height);

      const cols = Math.ceil(width / SPACING) + 1;
      const rows = Math.ceil(height / SPACING) + 1;

      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const x = i * SPACING;
          const y = j * SPACING;

          // Onda idle para opacidade
          const waveAlpha = reduced
            ? 0
            : (Math.sin(time * 0.5 + (x + y) * 0.01) + 1) * 0.08;
            
          // Onda idle para tamanho
          const waveRadius = reduced
            ? 0
            : (Math.sin(time * 0.8 + (x * 0.02) - (y * 0.02)) + 1) * 0.6;

          const dx = x - mouse.x;
          const dy = y - mouse.y;
          const dist = Math.hypot(dx, dy);
          const influence = Math.max(0, 1 - dist / INFLUENCE_RADIUS);
          const eased = influence * influence * influence; // easing cúbico (mais concentrado)

          let drawX = x;
          let drawY = y;

          if (dist > 0 && influence > 0) {
            const force = eased * 12; // Repulsão suave
            drawX += (dx / dist) * force;
            drawY += (dy / dist) * force;
          }

          const alpha = 0.15 + waveAlpha + eased * 0.8;
          const radius = 0.8 + waveRadius + eased * 4.0;

          ctx.beginPath();
          ctx.arc(drawX, drawY, radius, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(139, 92, 246, ${alpha.toFixed(3)})`; // Violeta vibrante
          ctx.fill();
        }
      }

      raf = requestAnimationFrame(draw);
    };

    if (reduced) {
      // Frame estático único para usuários com reduced-motion
      time = 0;
      const staticDraw = () => {
        ctx.clearRect(0, 0, width, height);
        const cols = Math.ceil(width / SPACING) + 1;
        const rows = Math.ceil(height / SPACING) + 1;
        for (let i = 0; i < cols; i++) {
          for (let j = 0; j < rows; j++) {
            ctx.beginPath();
            ctx.arc(i * SPACING, j * SPACING, 1.1, 0, Math.PI * 2);
            ctx.fillStyle = "rgba(139, 92, 246, 0.15)";
            ctx.fill();
          }
        }
      };
      staticDraw();
    } else {
      raf = requestAnimationFrame(draw);
    }

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      window.removeEventListener("pointermove", onPointerMove);
      document.documentElement.removeEventListener(
        "pointerleave",
        onPointerLeave
      );
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0"
    />
  );
}