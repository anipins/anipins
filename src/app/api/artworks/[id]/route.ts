import { after, NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { row, rows, run } from "@/lib/db";
import { COOKIE, getUser } from "@/lib/auth";
import { recordActivity } from "@/lib/activity";
import { publicMediaUrl, publicOriginalUrl, publicThumbnailUrl } from "@/lib/media";
import { canAccessPremium } from "@/lib/billing";
import { isWallpaperArtwork, nonWallpaperFilter, wallpaperFilter } from "@/lib/wallpaper-feed-utils";
import { ARTWORK_DETAIL_PRELOAD_COUNT } from "@/lib/content";
export const dynamic = "force-dynamic";

const RELATED_ARTWORK_INITIAL_COUNT = ARTWORK_DETAIL_PRELOAD_COUNT;

export async function GET(_req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const id = parseInt(params.id);
  const token = (await cookies()).get(COOKIE)?.value || "";
  // Public pins do not need to wait for an account/session lookup. Resolve the
  // pin first; only premium pins require an authenticated user before response.
  const art = await row(
    `SELECT a.*,
      (SELECT COUNT(*) FROM likes l WHERE l.artwork_id=a.id) AS like_count,
      (SELECT COUNT(*) FROM likes l JOIN sessions s ON s.user_id=l.user_id
       WHERE l.artwork_id=a.id AND s.token=? AND s.expires_at>?) AS user_likes
     FROM artworks a WHERE a.id=? AND a.published=1`,
    token, Date.now(), id,
  );
  if (!art) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const premiumOnly = Number(art.premium || 0) === 1;
  const user = premiumOnly ? await getUser() : null;
  if (Number(art.premium || 0) && (!user || !(await canAccessPremium(user)))) return NextResponse.json({ error: "AniPins Premium is required." }, { status: 403 });
  const relatedFilter = isWallpaperArtwork(art) ? wallpaperFilter() : nonWallpaperFilter();

  const premiumFlag = premiumOnly ? 1 : 0;
  // Load recommendations and adjacent-pin IDs concurrently. The previous
  // query recalculated previous/next IDs for every recommendation row.
  const [related, adjacent] = await Promise.all([
    rows(
      `SELECT id, title, character_name, character_slug, anime_name, anime_slug, gender, category, tags, orig, thumb, width, height, views, downloads,
         COALESCE(premium, 0) AS premium
       FROM artworks
       WHERE published=1 AND COALESCE(premium, 0)=? AND ${relatedFilter} AND id != ?
       ORDER BY CASE WHEN ((? <> '' AND character_slug = ?) OR (? <> '' AND anime_slug = ?)) THEN 0 ELSE 1 END, id DESC
       LIMIT ?`,
      premiumFlag, id, art.character_slug || "", art.character_slug || "", art.anime_slug || "", art.anime_slug || "",
      RELATED_ARTWORK_INITIAL_COUNT,
    ),
    row(
      `SELECT MAX(CASE WHEN id < ? THEN id END) AS prev_id, MIN(CASE WHEN id > ? THEN id END) AS next_id
       FROM artworks WHERE published=1 AND COALESCE(premium, 0)=? AND ${relatedFilter}`,
      id, id, premiumFlag,
    ),
  ]);
  after(async () => {
    // View activity is non-blocking; still resolve a public viewer's account
    // here so personalized recommendations continue to receive view signals.
    const activityUser = user || await getUser();
    await Promise.allSettled([
      run("UPDATE artworks SET views = views + 1 WHERE id=?", id),
      activityUser ? recordActivity(activityUser.id, id, "view") : Promise.resolve(),
    ]);
  });

  return NextResponse.json({
    art: {
      ...art,
      thumb_url: premiumOnly ? publicMediaUrl(art.thumb) : publicThumbnailUrl(art.thumb),
      original_url: premiumOnly ? publicMediaUrl(art.orig) : publicOriginalUrl(art.orig),
    },
    related: related.map((item: any) => {
      const { prev_id: _prevId, next_id: _nextId, ...card } = item;
      return {
        ...card,
        thumb_url: premiumOnly ? publicMediaUrl(item.thumb) : publicThumbnailUrl(item.thumb),
        orig_url: premiumOnly ? publicMediaUrl(item.orig) : publicOriginalUrl(item.orig),
      };
    }),
    prevId: adjacent?.prev_id ?? null,
    nextId: adjacent?.next_id ?? null,
    likeCount: art.like_count ?? 0,
    liked: Number(art.user_likes || 0) > 0,
  }, { headers: { "Cache-Control": "private, no-store" } });
}
