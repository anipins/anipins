import { NextRequest, NextResponse } from "next/server";
import { rows } from "@/lib/db";
import { getUser, isAdmin } from "@/lib/auth";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const u = await getUser();
  if (!isAdmin(u)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const sp = req.nextUrl.searchParams;
  const q = (sp.get("q") || "").trim().toLowerCase();
  const sort = sp.get("sort") || "latest";
  const filter = sp.get("filter") || "all";
  let where = "1=1";
  const args: any[] = [];
  if (q) {
    where += " AND (lower(character_name) LIKE ? OR lower(anime_name) LIKE ? OR lower(tags) LIKE ? OR lower(title) LIKE ?)";
    const like = `%${q}%`; args.push(like, like, like, like);
  }
  if (filter === "published") where += " AND published=1";
  if (filter === "unpublished") where += " AND published=0";
  if (filter === "featured") where += " AND featured=1";
  let order = "id DESC";
  if (sort === "views") order = "views DESC";
  if (sort === "downloads") order = "downloads DESC";
  if (sort === "oldest") order = "id ASC";
  const items = await rows(
    `SELECT id,title,character_name,anime_name,category,tags,featured,published,thumb,views,downloads,created_at FROM artworks WHERE ${where} ORDER BY ${order} LIMIT 200`,
    ...args);
  return NextResponse.json({ items });
}
