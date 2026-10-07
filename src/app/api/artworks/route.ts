import { NextRequest, NextResponse } from "next/server";
import { rows } from "@/lib/db";
import { getUser } from "@/lib/auth";
import { publicMediaUrl } from "@/lib/media";
import { ensurePremiumArtworkSchema, premiumArtworkFilter } from "@/lib/premium-artwork";
import { canAccessPremium } from "@/lib/billing";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const clientItems = (items: any[]) => items.map(item => ({ ...item, thumb_url: publicMediaUrl(item.thumb), orig_url: publicMediaUrl(item.orig) }));
const publicBrowseHeaders = { "Cache-Control": "public, max-age=5, s-maxage=10, stale-while-revalidate=45" };

export async function GET(req: NextRequest) {
  await ensurePremiumArtworkSchema();
  const sp = req.nextUrl.searchParams;
  const page = Math.max(0, parseInt(sp.get("page") || "0"));
  const limit = Math.min(40, parseInt(sp.get("limit") || "20"));
  const q = (sp.get("q") || "").trim().toLowerCase();
  const character = sp.get("character") || "";
  const anime = sp.get("anime") || "";
  const category = sp.get("category") || "";
  const gender = sp.get("gender") || "";
  const wallpaper = sp.get("wallpaper") === "1";
  const orientation = sp.get("orientation") || "";
  const sort = sp.get("sort") || "latest";
  const rawSeed = parseInt(sp.get("seed") || "1", 10);
  const seed = Number.isFinite(rawSeed) && rawSeed > 0 ? rawSeed % 2_147_483_647 : 1;
  const featured = sp.get("featured");
  const premiumOnly = sp.get("premium") === "1";
  // Browse feeds must stay independent of an account session. Resolving a
  // session and hidden-items query for every scroll request made authenticated
  // browsing slower and could stall the complete feed. Account data is only
  // needed for Following and the optional For You route.
  const needsUser = sort === "following" || sort === "for-you" || premiumOnly;
  const user = needsUser ? await getUser() : null;
  if (premiumOnly && (!user || !(await canAccessPremium(user)))) return NextResponse.json({ error: "AniPins Premium is required." }, { status: 403 });

  let where = `published = 1 AND ${premiumArtworkFilter(premiumOnly)}`;
  const args: any[] = [];
  if (q) {
    where += " AND (lower(character_name) LIKE ? OR lower(anime_name) LIKE ? OR lower(tags) LIKE ? OR lower(title) LIKE ? OR lower(category) LIKE ?)";
    const like = `%${q}%`;
    args.push(like, like, like, like, like);
  }
  if (character) { where += " AND character_slug = ?"; args.push(character); }
  if (anime) { where += " AND anime_slug = ?"; args.push(anime); }
  if (category) { where += " AND category = ?"; args.push(category); }
  if (gender) { where += " AND lower(gender) = ?"; args.push(gender.toLowerCase()); }
  // Wallpaper is a deliberate publishing category. Do not treat every
  // portrait artwork as a wallpaper: that would make this section misleading.
  if (wallpaper) {
    where += " AND (lower(category) = 'wallpapers' OR lower(tags) LIKE ?)";
    args.push("%wallpaper%");
  }
  if (orientation === "phone") where += " AND height > width";
  if (orientation === "desktop") where += " AND width >= height";
  if (featured === "1") { where += " AND featured = 1"; }

  const cols = "id, title, character_name, character_slug, anime_name, anime_slug, tags, gender, category, premium, featured, orig, thumb, width, height, views, downloads";
  if (sort === "following") {
    if (!user) return NextResponse.json({ items: [], hasMore: false, guest: true }, { headers: { "Cache-Control": "private, no-store" } });
    const followed = await rows("SELECT kind, value FROM follows WHERE user_id=?", user.id);
    if (!followed.length) return NextResponse.json({ items: [], hasMore: false, emptyFollows: true }, { headers: { "Cache-Control": "private, no-store" } });
    const characterValues = followed.filter((f: any) => f.kind === "character").map((f: any) => f.value);
    const animeValues = followed.filter((f: any) => f.kind === "anime").map((f: any) => f.value);
    const clauses: string[] = [];
    const followArgs: any[] = [];
    if (characterValues.length) { clauses.push(`character_slug IN (${characterValues.map(() => "?").join(",")})`); followArgs.push(...characterValues); }
    if (animeValues.length) { clauses.push(`anime_slug IN (${animeValues.map(() => "?").join(",")})`); followArgs.push(...animeValues); }
    const items = await rows(`SELECT ${cols} FROM artworks WHERE published=1 AND ${premiumArtworkFilter(false)} AND id NOT IN (SELECT artwork_id FROM hidden_artworks WHERE user_id=?) AND (${clauses.join(" OR ")}) ORDER BY created_at DESC, id DESC LIMIT ? OFFSET ?`, user.id, ...followArgs, limit + 1, page * limit);
    return NextResponse.json({ items: clientItems(items.slice(0, limit)), hasMore: items.length > limit }, { headers: { "Cache-Control": "private, no-store" } });
  }
  // The home page already server-renders its first personal discovery set.
  // For later pages, use the fast indexed feed below instead of repeatedly
  // sorting hundreds of rows in a serverless request. This is what makes
  // continuous scrolling reliable for signed-in users.
  if (sort === "for-you" && page === 0) {
    if (user) {
      const signals = await rows(
        `SELECT i.kind, i.strength, a.character_slug, a.anime_slug, a.gender, a.category
         FROM interactions i JOIN artworks a ON a.id=i.artwork_id WHERE i.user_id=? ORDER BY i.updated_at DESC LIMIT 250`, user.id,
      );
      if (signals.length) {
        const preferences = new Map<string, number>();
        const kindWeight: Record<string, number> = { view: 1, like: 5, save: 7, download: 4 };
        const add = (key: string, value: number) => preferences.set(key, (preferences.get(key) || 0) + value);
        for (const signal of signals) {
          const weight = (kindWeight[signal.kind] || 1) * Math.min(4, 1 + Math.log2(Math.max(1, signal.strength)));
          if (signal.character_slug) add(`c:${signal.character_slug}`, weight * 3);
          if (signal.anime_slug) add(`a:${signal.anime_slug}`, weight * 1.8);
          if (signal.gender) add(`g:${signal.gender}`, weight * 0.35);
          if (signal.category) add(`k:${signal.category}`, weight * 0.6);
        }
        const candidates = await rows(`SELECT ${cols} FROM artworks WHERE ${where} ORDER BY created_at DESC, id DESC LIMIT 700`, ...args);
        const seeded = (id: number) => ((id * ((seed * 48271) % 2147483647 || 1)) % 2147483647) / 2147483647;
        candidates.sort((a, b) => {
          const score = (x: any) => (preferences.get(`c:${x.character_slug}`) || 0) + (preferences.get(`a:${x.anime_slug}`) || 0) + (preferences.get(`g:${x.gender}`) || 0) + (preferences.get(`k:${x.category}`) || 0) + seeded(x.id) * 2;
          return score(b) - score(a);
        });
        const start = page * limit;
        return NextResponse.json(
          { items: clientItems(candidates.slice(start, start + limit)), hasMore: candidates.length > start + limit, personalized: true },
          { headers: { "Cache-Control": "private, no-store" } },
        );
      }
    }
    // New and signed-out visitors still receive a varied discovery feed.
    const multiplier = (seed * 48_271) % 2_147_483_647 || 1;
    const fallback = await rows(`SELECT ${cols} FROM artworks WHERE ${where} ORDER BY ((CAST(id AS BIGINT) * ?) % 2147483647), id LIMIT ? OFFSET ?`, ...args, multiplier, limit + 1, page * limit);
    return NextResponse.json({ items: clientItems(fallback.slice(0, limit)), hasMore: fallback.length > limit, personalized: false }, { headers: { "Cache-Control": "private, no-store" } });
  }

  let order = "created_at DESC, id DESC";
  if (sort === "popular") order = "downloads DESC, views DESC";
  if (sort === "trending") order = "views DESC, downloads DESC";
  if (sort === "random") {
    const multiplier = (seed * 48_271) % 2_147_483_647 || 1;
    order = "((CAST(id AS BIGINT) * ?) % 2147483647), id";
    args.push(multiplier);
  }

  // Listing surfaces use the optimized thumbnail. Full originals are reserved
  // for the artwork detail and download routes so the homepage stays fast.
  // Keep the main Latest feed useful after a large wallpaper upload. Wallpapers
  // still appear there, but every fourth slot is reserved for them so recent
  // character-reference artwork remains discoverable. Dedicated wallpaper,
  // search, category and collection pages always retain their natural order.
  const balanceLatest = sort === "latest" && !q && !character && !anime && !category && !gender && !wallpaper && !orientation && featured !== "1";
  const items = balanceLatest
    ? await rows(
      `SELECT ${cols} FROM (
        SELECT ${cols},
          CASE WHEN lower(category) = 'wallpapers' OR lower(tags) LIKE '%wallpaper%' THEN 1 ELSE 0 END AS is_wallpaper,
          ROW_NUMBER() OVER (
            PARTITION BY CASE WHEN lower(category) = 'wallpapers' OR lower(tags) LIKE '%wallpaper%' THEN 1 ELSE 0 END
            ORDER BY created_at DESC, id DESC
          ) AS segment_rank
        FROM artworks WHERE ${where}
      ) balanced
      ORDER BY CASE
        WHEN is_wallpaper = 1 THEN ((segment_rank - 1) * 4) + 3
        ELSE (((segment_rank - 1) / 3) * 4) + ((segment_rank - 1) % 3)
      END, is_wallpaper ASC
      LIMIT ? OFFSET ?`,
      ...args, limit + 1, page * limit,
    )
    : await rows(
      `SELECT ${cols}
       FROM artworks WHERE ${where} ORDER BY ${order} LIMIT ? OFFSET ?`,
      ...args, limit + 1, page * limit,
    );
  const hasMore = items.length > limit;
  const responseHeaders = !premiumOnly && sort !== "following" && sort !== "for-you"
    ? publicBrowseHeaders
    : { "Cache-Control": "private, no-store" };
  return NextResponse.json(
    { items: clientItems(items.slice(0, limit)), hasMore },
    // Anonymous browsing is shared for just ten seconds. Images remain
    // immutable, while a new upload becomes visible on every feed quickly.
    { headers: responseHeaders },
  );
}
