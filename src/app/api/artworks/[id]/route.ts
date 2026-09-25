import { after, NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { row, rows, run } from "@/lib/db";
import { COOKIE, getUser } from "@/lib/auth";
import { recordActivity } from "@/lib/activity";
import { publicMediaUrl } from "@/lib/media";
export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const id = parseInt(params.id);
  const token = (await cookies()).get(COOKIE)?.value || "";
  const art = await row(
    `SELECT a.*,
      (SELECT COUNT(*) FROM likes l WHERE l.artwork_id=a.id) AS like_count,
      (SELECT COUNT(*) FROM likes l JOIN sessions s ON s.user_id=l.user_id
       WHERE l.artwork_id=a.id AND s.token=? AND s.expires_at>?) AS user_likes,
      (SELECT MAX(p.id) FROM artworks p WHERE p.published=1 AND p.id<a.id) AS prev_id,
      (SELECT MIN(n.id) FROM artworks n WHERE n.published=1 AND n.id>a.id) AS next_id
     FROM artworks a WHERE a.id=? AND a.published=1`,
    token, Date.now(), id,
  );
  if (!art) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const discoveryMultiplier = ((id + 1) * 48_271) % 2_147_483_647 || 1;
  const related = await rows(
      `SELECT id, title, character_name, character_slug, anime_name, anime_slug, gender, category, thumb, width, height
       FROM artworks
       WHERE published=1 AND id != ?
       ORDER BY
         CASE WHEN character_slug = ? THEN 0 WHEN anime_slug = ? THEN 1 ELSE 2 END,
         ((CAST(id AS BIGINT) * ?) % 2147483647), id
       LIMIT 36`,
      id, art.character_slug || "", art.anime_slug || "", discoveryMultiplier,
    );

  after(async () => {
    const user = await getUser();
    await Promise.allSettled([
      run("UPDATE artworks SET views = views + 1 WHERE id=?", id),
      user ? recordActivity(user.id, id, "view") : Promise.resolve(),
    ]);
  });

  return NextResponse.json({
    art: { ...art, thumb_url: publicMediaUrl(art.thumb), original_url: publicMediaUrl(art.orig) },
    related: related.map((item: any) => ({ ...item, thumb_url: publicMediaUrl(item.thumb) })),
    prevId: art.prev_id ?? null,
    nextId: art.next_id ?? null,
    likeCount: art.like_count ?? 0,
    liked: Number(art.user_likes || 0) > 0,
  }, { headers: { "Cache-Control": "private, no-store" } });
}
