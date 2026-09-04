import { NextRequest, NextResponse } from "next/server";
import { rows } from "@/lib/db";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const page = Math.max(0, parseInt(sp.get("page") || "0"));
  const limit = Math.min(40, parseInt(sp.get("limit") || "20"));
  const q = (sp.get("q") || "").trim().toLowerCase();
  const character = sp.get("character") || "";
  const anime = sp.get("anime") || "";
  const category = sp.get("category") || "";
  const sort = sp.get("sort") || "latest";
  const featured = sp.get("featured");

  let where = "published = 1";
  const args: any[] = [];
  if (q) {
    where += " AND (lower(character_name) LIKE ? OR lower(anime_name) LIKE ? OR lower(tags) LIKE ? OR lower(title) LIKE ? OR lower(category) LIKE ?)";
    const like = `%${q}%`;
    args.push(like, like, like, like, like);
  }
  if (character) { where += " AND character_slug = ?"; args.push(character); }
  if (anime) { where += " AND anime_slug = ?"; args.push(anime); }
  if (category) { where += " AND category = ?"; args.push(category); }
  if (featured === "1") { where += " AND featured = 1"; }

  let order = "created_at DESC, id DESC";
  if (sort === "popular") order = "downloads DESC, views DESC";
  if (sort === "trending") order = "views DESC, downloads DESC";

  const items = await rows(
    `SELECT id, title, character_name, character_slug, anime_name, anime_slug, tags, category, featured, thumb, width, height, views, downloads
     FROM artworks WHERE ${where} ORDER BY ${order} LIMIT ? OFFSET ?`,
    ...args, limit + 1, page * limit
  );
  const hasMore = items.length > limit;
  return NextResponse.json({ items: items.slice(0, limit), hasMore });
}
