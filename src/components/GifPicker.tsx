"use client";
import { useEffect, useState } from "react";
import { Search } from "lucide-react";

type GifResult = { id: string; preview: string; url: string };

export function GifPicker({
  type,
  onPick,
}: {
  type: "gifs" | "stickers";
  onPick: (url: string) => void;
}) {
  const [q, setQ] = useState("");
  const [items, setItems] = useState<GifResult[]>([]);
  const [configured, setConfigured] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancel = false;
    setLoading(true);
    const t = setTimeout(() => {
      fetch(`/api/giphy?type=${type}&q=${encodeURIComponent(q)}`)
        .then((r) => r.json())
        .then((d) => {
          if (cancel) return;
          setConfigured(d.configured !== false);
          setItems(d.results || []);
        })
        .catch(() => {
          if (!cancel) setItems([]);
        })
        .finally(() => {
          if (!cancel) setLoading(false);
        });
    }, 350);
    return () => {
      cancel = true;
      clearTimeout(t);
    };
  }, [q, type]);

  if (!configured) {
    return (
      <div className="px-3 py-6 text-center text-xs text-muted">
        {type === "stickers" ? "Stickers" : "GIF search"} isn&rsquo;t set up yet —
        add a <span className="text-white">GIPHY_API_KEY</span>.
      </div>
    );
  }

  return (
    <div className="px-3 pb-2">
      <div className="relative mb-2">
        <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" />
        <input
          className="input pl-8"
          placeholder={`Search ${type}…`}
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>
      <div className="grid grid-cols-3 gap-1 max-h-48 overflow-y-auto">
        {loading && items.length === 0 ? (
          <div className="col-span-3 text-center text-xs text-muted py-6">Loading…</div>
        ) : items.length === 0 ? (
          <div className="col-span-3 text-center text-xs text-muted py-6">No results</div>
        ) : (
          items.map((it) => (
            <button
              key={it.id}
              type="button"
              onClick={() => onPick(it.url)}
              className="rounded-lg overflow-hidden hover:ring-2 hover:ring-accent/60 transition"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={it.preview || it.url}
                alt=""
                loading="lazy"
                className="w-full h-20 object-cover bg-black/30"
              />
            </button>
          ))
        )}
      </div>
      <p className="text-[10px] text-muted text-center mt-1.5">Powered by GIPHY</p>
    </div>
  );
}
