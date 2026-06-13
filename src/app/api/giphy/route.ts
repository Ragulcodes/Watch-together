import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

interface GiphyImage {
  url?: string;
}
interface GiphyItem {
  id: string;
  images?: Record<string, GiphyImage>;
}

// Proxies GIPHY search/trending so the API key stays server-side.
// `type=gifs` → regular GIFs; `type=stickers` → animated transparent stickers.
export async function GET(req: Request) {
  const key = process.env.GIPHY_API_KEY;
  if (!key) {
    return NextResponse.json({ configured: false, results: [] });
  }
  const url = new URL(req.url);
  const q = (url.searchParams.get("q") || "").trim();
  const type = url.searchParams.get("type") === "stickers" ? "stickers" : "gifs";
  const base = `https://api.giphy.com/v1/${type}`;
  const params = `api_key=${key}&limit=24&rating=pg-13&bundle=messaging_non_clips`;
  const endpoint = q
    ? `${base}/search?${params}&q=${encodeURIComponent(q)}`
    : `${base}/trending?${params}`;

  try {
    const r = await fetch(endpoint);
    const data = (await r.json()) as { data?: GiphyItem[] };
    const results = (data.data ?? [])
      .map((g) => ({
        id: g.id,
        preview:
          g.images?.fixed_width_small?.url || g.images?.preview_gif?.url || "",
        url: g.images?.fixed_width?.url || g.images?.original?.url || "",
      }))
      .filter((x) => x.url);
    return NextResponse.json({ configured: true, results });
  } catch {
    return NextResponse.json({ configured: true, results: [] });
  }
}
