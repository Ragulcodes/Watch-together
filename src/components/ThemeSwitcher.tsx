"use client";
import { useEffect, useRef, useState } from "react";
import { Palette, Check } from "lucide-react";

const THEMES = [
  { id: "violet", label: "Violet", color: "#7c5cff" },
  { id: "rose", label: "Rose", color: "#f43f5e" },
  { id: "sunset", label: "Sunset", color: "#fb923c" },
  { id: "ocean", label: "Ocean", color: "#38bdf8" },
  { id: "emerald", label: "Emerald", color: "#10b981" },
  { id: "gold", label: "Gold", color: "#eab308" },
  { id: "mono", label: "Mono", color: "#a1a1aa" },
] as const;

const STORAGE_KEY = "wt-theme";

export function ThemeSwitcher() {
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState("violet");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTheme(localStorage.getItem(STORAGE_KEY) || "violet");
  }, []);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  const apply = (id: string) => {
    setTheme(id);
    if (id === "violet") document.documentElement.removeAttribute("data-theme");
    else document.documentElement.setAttribute("data-theme", id);
    try {
      localStorage.setItem(STORAGE_KEY, id);
    } catch {
      /* ignore */
    }
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="btn-ghost p-2"
        aria-label="Change theme"
        title="Theme"
      >
        <Palette size={18} />
      </button>
      {open && (
        <div className="absolute right-0 mt-2 z-50 card p-1.5 w-44">
          {THEMES.map((t) => (
            <button
              key={t.id}
              onClick={() => apply(t.id)}
              className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-sm text-white hover:bg-white/10 transition"
            >
              <span
                className="w-3.5 h-3.5 rounded-full flex-shrink-0"
                style={{ background: t.color }}
              />
              <span className="flex-1 text-left">{t.label}</span>
              {theme === t.id && <Check size={14} className="text-accent" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
