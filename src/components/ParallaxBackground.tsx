"use client";
import { useEffect, useRef } from "react";

/**
 * Fixed, behind-everything aurora made of blurred colour fields. Each layer has
 * a `data-depth`; on mouse move they ease toward an offset scaled by depth,
 * producing parallax. Pointer-events-none so it never blocks the UI.
 */
export function ParallaxBackground() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const layers = Array.from(root.querySelectorAll<HTMLElement>("[data-depth]"));
    let targetX = 0, targetY = 0, curX = 0, curY = 0, raf = 0;

    const loop = () => {
      curX += (targetX - curX) * 0.07;
      curY += (targetY - curY) * 0.07;
      for (const l of layers) {
        const d = parseFloat(l.dataset.depth || "0");
        l.style.transform = `translate3d(${curX * d * 45}px, ${curY * d * 45}px, 0)`;
      }
      if (Math.abs(targetX - curX) > 0.0005 || Math.abs(targetY - curY) > 0.0005) {
        raf = requestAnimationFrame(loop);
      } else {
        raf = 0;
      }
    };
    const onMove = (e: MouseEvent) => {
      targetX = e.clientX / window.innerWidth - 0.5;
      targetY = e.clientY / window.innerHeight - 0.5;
      if (!raf) raf = requestAnimationFrame(loop);
    };

    window.addEventListener("mousemove", onMove);
    return () => {
      window.removeEventListener("mousemove", onMove);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div ref={ref} aria-hidden className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      <div
        data-depth="1.0"
        className="absolute -top-40 -left-32 w-[58vw] h-[58vw] rounded-full blur-3xl will-change-transform"
        style={{ background: "radial-gradient(circle, rgba(124,92,255,0.45), transparent 62%)" }}
      />
      <div
        data-depth="0.6"
        className="absolute top-0 right-[-12%] w-[52vw] h-[52vw] rounded-full blur-3xl will-change-transform"
        style={{ background: "radial-gradient(circle, rgba(34,211,238,0.30), transparent 62%)" }}
      />
      <div
        data-depth="1.4"
        className="absolute bottom-[-18%] left-1/3 w-[48vw] h-[48vw] rounded-full blur-3xl will-change-transform"
        style={{ background: "radial-gradient(circle, rgba(236,72,153,0.26), transparent 62%)" }}
      />
      <div
        data-depth="0.85"
        className="absolute bottom-[6%] right-[8%] w-[38vw] h-[38vw] rounded-full blur-3xl will-change-transform"
        style={{ background: "radial-gradient(circle, rgba(124,92,255,0.22), transparent 62%)" }}
      />
    </div>
  );
}
