import { NextResponse } from "next/server";
import { rows } from "@/lib/db";
export const dynamic = "force-dynamic";

export async function GET() {
  const chars = await rows(
    `SELECT character_name AS name, character_slug AS slug, MIN(anime_name) AS anime, COUNT(*) AS count,
       (SELECT thumb FROM artworks a2 WHERE a2.character_slug = a.character_slug AND a2.published=1 ORDER BY views DESC LIMIT 1) AS cover
     FROM artworks a WHERE published=1 GROUP BY character_slug, character_name ORDER BY count DESC, name ASC`
  );
  const animes = await rows(
    `SELECT anime_name AS name, anime_slug AS slug, COUNT(*) AS count, COUNT(DISTINCT character_slug) AS characters,
       (SELECT thumb FROM artworks a2 WHERE a2.anime_slug = a.anime_slug AND a2.published=1 ORDER BY views DESC LIMIT 1) AS cover
     FROM artworks a WHERE published=1 GROUP BY anime_slug, anime_name ORDER BY count DESC, name ASC`
  );
  return NextResponse.json({ characters: chars, animes });
}
