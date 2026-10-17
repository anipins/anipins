import { NextResponse } from "next/server";
import { row, rows } from "@/lib/db";
import { getUser, isAdmin } from "@/lib/auth";
export const dynamic = "force-dynamic";

export async function GET() {
  const u = await getUser();
  if (!isAdmin(u)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const [totals, mostViewed, mostDownloaded, recent, takedowns] = await Promise.all([
    row(`SELECT COUNT(*) AS artworks, COUNT(DISTINCT character_slug) AS characters,
      COUNT(DISTINCT anime_slug) AS anime, COALESCE(SUM(downloads),0) AS downloads,
      COALESCE(SUM(views),0) AS views FROM artworks`),
    row("SELECT id,title,character_name,thumb,views FROM artworks ORDER BY views DESC LIMIT 1"),
    row("SELECT id,title,character_name,thumb,downloads FROM artworks ORDER BY downloads DESC LIMIT 1"),
    rows("SELECT id,title,character_name,anime_name,thumb,created_at,published FROM artworks ORDER BY id DESC LIMIT 8"),
    rows("SELECT * FROM takedowns ORDER BY id DESC LIMIT 20"),
  ]);
  return NextResponse.json({ totals, mostViewed, mostDownloaded, recent, takedowns });
}
