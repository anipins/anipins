import { NextRequest, NextResponse } from "next/server";
import { rows } from "@/lib/db";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get("q") || "").trim().toLowerCase();
  if (!q) {
    const trending = await rows("SELECT character_name AS label, character_slug AS slug, SUM(views + downloads * 3) AS score FROM artworks WHERE published=1 GROUP BY character_name, character_slug ORDER BY score DESC LIMIT 6");
    return NextResponse.json({ suggestions: trending.map((x: any) => ({ type: "trending", label: x.label, href: `/c/${x.slug}` })) });
  }
  const like = `%${q}%`;
  const chars = await rows("SELECT DISTINCT character_name AS label, character_slug AS slug FROM artworks WHERE published=1 AND lower(character_name) LIKE ? LIMIT 5", like);
  const animes = await rows("SELECT DISTINCT anime_name AS label, anime_slug AS slug FROM artworks WHERE published=1 AND lower(anime_name) LIKE ? LIMIT 5", like);
  const tagRows = await rows("SELECT tags FROM artworks WHERE published=1 AND lower(tags) LIKE ? LIMIT 20", like);
  const tagSet = new Set<string>();
  for (const r of tagRows) for (const t of String(r.tags).split(",")) {
    const tt = t.trim(); if (tt && tt.toLowerCase().includes(q)) tagSet.add(tt);
  }
  let suggestions = [
    ...chars.map((c: any) => ({ type: "character", label: c.label, href: `/c/${c.slug}` })),
    ...animes.map((a: any) => ({ type: "anime", label: a.label, href: `/anime/${a.slug}` })),
    ...[...tagSet].slice(0, 4).map((t) => ({ type: "tag", label: t, href: `/search?q=${encodeURIComponent(t)}` })),
  ].slice(0, 9);
  if (suggestions.length < 4) {
    const pool = await rows("SELECT character_name, character_slug, anime_name, anime_slug, MAX(views) AS score FROM artworks WHERE published=1 GROUP BY character_name, character_slug, anime_name, anime_slug ORDER BY score DESC LIMIT 300");
    const distance = (a: string, b: string) => {
      const dp = Array.from({ length: b.length + 1 }, (_, i) => i);
      for (let i = 1; i <= a.length; i++) { let prev = dp[0]; dp[0] = i; for (let j = 1; j <= b.length; j++) { const old = dp[j]; dp[j] = Math.min(dp[j] + 1, dp[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1)); prev = old; } }
      return dp[b.length];
    };
    const fuzzy = pool.flatMap((x: any) => [
      { type: "character", label: x.character_name, href: `/c/${x.character_slug}`, score: distance(q, String(x.character_name).toLowerCase()) },
      { type: "anime", label: x.anime_name, href: `/anime/${x.anime_slug}`, score: distance(q, String(x.anime_name).toLowerCase()) },
    ]).filter((x: any) => x.score <= Math.max(2, Math.floor(q.length / 3))).sort((a: any, b: any) => a.score - b.score);
    const seen = new Set(suggestions.map((x: any) => `${x.type}:${x.label}`));
    for (const item of fuzzy) if (!seen.has(`${item.type}:${item.label}`)) { suggestions.push(item); seen.add(`${item.type}:${item.label}`); if (suggestions.length >= 9) break; }
  }
  return NextResponse.json({ suggestions });
}
