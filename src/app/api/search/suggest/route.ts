import { NextRequest, NextResponse } from "next/server";
import { rows } from "@/lib/db";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get("q") || "").trim().toLowerCase();
  if (!q) return NextResponse.json({ suggestions: [] });
  const like = `%${q}%`;
  const chars = await rows("SELECT DISTINCT character_name AS label, character_slug AS slug FROM artworks WHERE published=1 AND lower(character_name) LIKE ? LIMIT 5", like);
  const animes = await rows("SELECT DISTINCT anime_name AS label, anime_slug AS slug FROM artworks WHERE published=1 AND lower(anime_name) LIKE ? LIMIT 5", like);
  const tagRows = await rows("SELECT tags FROM artworks WHERE published=1 AND lower(tags) LIKE ? LIMIT 20", like);
  const tagSet = new Set<string>();
  for (const r of tagRows) for (const t of String(r.tags).split(",")) {
    const tt = t.trim(); if (tt && tt.toLowerCase().includes(q)) tagSet.add(tt);
  }
  const suggestions = [
    ...chars.map((c: any) => ({ type: "character", label: c.label, href: `/c/${c.slug}` })),
    ...animes.map((a: any) => ({ type: "anime", label: a.label, href: `/anime/${a.slug}` })),
    ...[...tagSet].slice(0, 4).map((t) => ({ type: "tag", label: t, href: `/search?q=${encodeURIComponent(t)}` })),
  ].slice(0, 9);
  return NextResponse.json({ suggestions });
}
