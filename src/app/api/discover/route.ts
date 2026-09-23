import { NextResponse } from "next/server";
import { rows } from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const [characters, anime] = await Promise.all([
    rows(`SELECT character_slug AS slug, character_name AS name, anime_name AS anime, COUNT(*) AS artwork_count
           FROM artworks
           WHERE published=1 AND character_slug IS NOT NULL AND character_slug <> ''
           GROUP BY character_slug, character_name, anime_name
           ORDER BY artwork_count DESC, name ASC
           LIMIT 24`),
    rows(`SELECT anime_slug AS slug, anime_name AS name, COUNT(*) AS artwork_count
           FROM artworks
           WHERE published=1 AND anime_slug IS NOT NULL AND anime_slug <> ''
           GROUP BY anime_slug, anime_name
           ORDER BY artwork_count DESC, name ASC
           LIMIT 24`),
  ]);
  return NextResponse.json({ characters, anime }, {
    headers: { "Cache-Control": "public, max-age=60, s-maxage=300, stale-while-revalidate=600" },
  });
}
