import { NextRequest, NextResponse } from "next/server";
import { row, rows, run } from "@/lib/db";
import { getUser } from "@/lib/auth";
import { recordActivity } from "@/lib/activity";
import { publicMediaUrl } from "@/lib/media";
export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const id = parseInt(params.id);
  const [art, user] = await Promise.all([
    row("SELECT * FROM artworks WHERE id=? AND published=1", id),
    getUser(),
  ]);
  if (!art) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const discoveryMultiplier = ((id + 1) * 48_271) % 2_147_483_647 || 1;
  const [social, related, adjacent] = await Promise.all([
    row(
      `SELECT COUNT(*) AS c,
       SUM(CASE WHEN user_id=? THEN 1 ELSE 0 END) AS user_likes
       FROM likes WHERE artwork_id=?`,
      user?.id || -1, id,
    ),
    rows(
      `SELECT id, title, character_name, character_slug, anime_name, anime_slug, gender, category, thumb, width, height
       FROM artworks
       WHERE published=1 AND id != ?
         AND (character_slug = ? OR anime_slug = ?)
       ORDER BY
         CASE WHEN character_slug = ? THEN 0 ELSE 1 END,
         views DESC, id DESC
       LIMIT 36`,
      id, art.character_slug || "", art.anime_slug || "", art.character_slug || "",
    ),
    row(
      `SELECT MAX(CASE WHEN id < ? THEN id END) AS prev_id,
       MIN(CASE WHEN id > ? THEN id END) AS next_id
       FROM artworks WHERE published=1`,
      id, id,
    ),
    run("UPDATE artworks SET views = views + 1 WHERE id=?", id),
    user ? recordActivity(user.id, id, "view") : Promise.resolve(),
  ]);

  return NextResponse.json({
    art: { ...art, thumb_url: publicMediaUrl(art.thumb), original_url: publicMediaUrl(art.orig) },
    related: related.map((item: any) => ({ ...item, thumb_url: publicMediaUrl(item.thumb) })),
    prevId: adjacent?.prev_id ?? null,
    nextId: adjacent?.next_id ?? null,
    likeCount: social?.c ?? 0,
    liked: Number(social?.user_likes || 0) > 0,
  }, { headers: { "Cache-Control": "private, no-store" } });
}
