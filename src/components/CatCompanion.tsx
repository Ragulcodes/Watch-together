"use client";
import { useEffect, useRef } from "react";

/**
 * A little cat that rests in the bottom-left corner and follows the cursor with
 * its eyes. Decorative + non-interactive (pointer-events-none) so it never
 * blocks the UI. Blink / tail / float are CSS; pupil tracking is JS.
 */
export function CatCompanion() {
  const leftPupil = useRef<SVGGElement>(null);
  const rightPupil = useRef<SVGGElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    let mx = 0, my = 0;

    const apply = () => {
      raf = 0;
      for (const ref of [leftPupil, rightPupil]) {
        const g = ref.current;
        if (!g) continue;
        const r = g.getBoundingClientRect();
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;
        const dx = mx - cx;
        const dy = my - cy;
        const ang = Math.atan2(dy, dx);
        const dist = Math.hypot(dx, dy);
        const reach = Math.min(3.6, dist / 45); // how far the pupil slides
        g.style.transform = `translate(${Math.cos(ang) * reach}px, ${Math.sin(ang) * reach}px)`;
      }
    };
    const onMove = (e: MouseEvent) => {
      mx = e.clientX;
      my = e.clientY;
      if (!raf) raf = requestAnimationFrame(apply);
    };

    window.addEventListener("mousemove", onMove);
    return () => {
      window.removeEventListener("mousemove", onMove);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div aria-hidden className="hidden sm:block fixed bottom-3 left-3 z-40 pointer-events-none select-none">
      <svg width="132" height="164" viewBox="0 0 132 164" fill="none" className="cat-float" xmlns="http://www.w3.org/2000/svg">
        {/* tail */}
        <g className="cat-tail">
          <path
            d="M104 132 C128 126 126 96 110 92 C122 104 112 120 96 122 Z"
            fill="#23232f"
          />
        </g>
        {/* body */}
        <ellipse cx="66" cy="132" rx="42" ry="30" fill="#2b2b3a" />
        <ellipse cx="66" cy="140" rx="26" ry="16" fill="#34344a" />
        {/* front paws */}
        <ellipse cx="50" cy="156" rx="11" ry="7" fill="#2b2b3a" />
        <ellipse cx="82" cy="156" rx="11" ry="7" fill="#2b2b3a" />
        {/* head */}
        <circle cx="66" cy="74" r="38" fill="#2f2f40" />
        {/* ears */}
        <path d="M40 48 L30 12 L64 40 Z" fill="#2b2b3a" />
        <path d="M92 48 L102 12 L68 40 Z" fill="#2b2b3a" />
        <path d="M40 44 L34 22 L54 38 Z" fill="#7c5cff" opacity="0.65" />
        <path d="M92 44 L98 22 L78 38 Z" fill="#7c5cff" opacity="0.65" />
        {/* eyes (blink together) */}
        <g className="cat-eyes">
          <ellipse cx="52" cy="72" rx="10" ry="12.5" fill="#f3f4f9" />
          <ellipse cx="80" cy="72" rx="10" ry="12.5" fill="#f3f4f9" />
          <g ref={leftPupil} className="cat-pupil">
            <ellipse cx="52" cy="73" rx="4.6" ry="6.6" fill="#16161f" />
            <circle cx="50.4" cy="70" r="1.5" fill="#ffffff" />
          </g>
          <g ref={rightPupil} className="cat-pupil">
            <ellipse cx="80" cy="73" rx="4.6" ry="6.6" fill="#16161f" />
            <circle cx="78.4" cy="70" r="1.5" fill="#ffffff" />
          </g>
        </g>
        {/* nose */}
        <path d="M66 86 L61 82 L71 82 Z" fill="#ef7aa6" />
        {/* mouth */}
        <path d="M66 86 C66 92 60 93 57 90" stroke="#1b1b26" strokeWidth="1.6" fill="none" strokeLinecap="round" />
        <path d="M66 86 C66 92 72 93 75 90" stroke="#1b1b26" strokeWidth="1.6" fill="none" strokeLinecap="round" />
        {/* whiskers */}
        <g stroke="#c9cad6" strokeWidth="1.2" strokeLinecap="round" opacity="0.7">
          <line x1="44" y1="84" x2="20" y2="80" />
          <line x1="44" y1="88" x2="22" y2="90" />
          <line x1="88" y1="84" x2="112" y2="80" />
          <line x1="88" y1="88" x2="110" y2="90" />
        </g>
      </svg>
    </div>
  );
}
