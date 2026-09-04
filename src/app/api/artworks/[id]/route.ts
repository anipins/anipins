import { NextRequest, NextResponse } from "next/server";
import { row, rows, run } from "@/lib/db";
import { getUser } from "@/lib/auth";
export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const id = parseInt(params.id);
  const art = await row("SELECT * FROM artworks WHERE id=? AND published=1", id);
  if (!art) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await run("UPDATE artworks SET views = views + 1 WHERE id=?", id);

  const u = await getUser();
  const lc = await row("SELECT COUNT(*) AS c FROM likes WHERE artwork_id=?", id);
  const liked = u ? !!(await row("SELECT id FROM likes WHERE user_id=? AND artwork_id=?", u.id, id)) : false;

  const related = await rows(
    `SELECT id, title, character_name, anime_name, thumb, width, height FROM artworks
     WHERE published=1 AND id != ? AND (character_slug = ? OR anime_slug = ?)
     ORDER BY CASE WHEN character_slug = ? THEN 0 ELSE 1 END, views DESC LIMIT 12`,
    id, art.character_slug, art.anime_slug, art.character_slug
  );
  const prev = await row("SELECT id FROM artworks WHERE published=1 AND id < ? ORDER BY id DESC LIMIT 1", id);
  const next = await row("SELECT id FROM artworks WHERE published=1 AND id > ? ORDER BY id ASC LIMIT 1", id);

  return NextResponse.json({ art, related, prevId: prev?.id ?? null, nextId: next?.id ?? null, likeCount: lc?.c ?? 0, liked });
}
