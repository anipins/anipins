import { row, rows } from "@/lib/db";
import { publicMediaUrl, publicOriginalUrl, publicThumbnailUrl } from "@/lib/media";
import { premiumArtworkFilter } from "@/lib/premium-artwork";
import { nonWallpaperFilter, wallpaperFilter } from "@/lib/wallpaper-feed-utils";

export const ARTWORK_CARD_COLUMNS =
  "id, title, character_name, character_slug, anime_name, anime_slug, description, tags, gender, category, premium, featured, orig, thumb, width, height, views, downloads, created_at";

function shuffle<T>(items: T[]) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swap]] = [copy[swap], copy[index]];
  }
  return copy;
}

export async function getArtworkCards(options: {
  limit?: number;
  sort?: "latest" | "trending" | "popular" | "featured" | "random";
  character?: string;
  anime?: string;
  excludeId?: number;
  /** Use only in authenticated member-only server views. */
  premium?: boolean;
  /** Wallpapers belong to their own dedicated feed. */
  wallpaper?: boolean;
} = {}) {
  const { limit = 20, sort = "latest", character, anime, excludeId, premium = false, wallpaper = false } = options;
  // Server-rendered public pages must use the same separation as the feed API:
  // premium-only artwork is visible only through the member library.
  let where = `published=1 AND ${premiumArtworkFilter(premium)} AND ${wallpaper ? wallpaperFilter() : nonWallpaperFilter()}`;
  const args: any[] = [];
  if (character) { where += " AND character_slug=?"; args.push(character); }
  if (anime) { where += " AND anime_slug=?"; args.push(anime); }
  if (excludeId) { where += " AND id!=?"; args.push(excludeId); }
  if (sort === "featured") where += " AND featured=1";

  let order = "created_at DESC, id DESC";
  if (sort === "trending") order = "views DESC, downloads DESC, id DESC";
  if (sort === "popular") order = "downloads DESC, views DESC, id DESC";
  if (sort === "featured") order = "views DESC, id DESC";
  let items: any[];
  if (sort === "random") {
    // ORDER BY RANDOM() scans and sorts the entire library before returning a
    // single card. Start at a random position in the indexed id order and
    // wrap once instead. The result remains fresh (and is shuffled below),
    // while the database reads only this screenful of artwork.
    const total = Number((await row(`SELECT COUNT(*) AS count FROM artworks WHERE ${where}`, ...args))?.count || 0);
    if (!total) return [];
    const take = Math.min(limit, total);
    const offset = Math.floor(Math.random() * total);
    const firstTake = Math.min(take, total - offset);
    const first = await rows(`SELECT ${ARTWORK_CARD_COLUMNS} FROM artworks WHERE ${where} ORDER BY id ASC LIMIT ? OFFSET ?`, ...args, firstTake, offset);
    const second = firstTake < take
      ? await rows(`SELECT ${ARTWORK_CARD_COLUMNS} FROM artworks WHERE ${where} ORDER BY id ASC LIMIT ?`, ...args, take - firstTake)
      : [];
    items = shuffle([...first, ...second]);
  } else {
    items = await rows(`SELECT ${ARTWORK_CARD_COLUMNS} FROM artworks WHERE ${where} ORDER BY ${order} LIMIT ?`, ...args, limit);
  }
  return items.map((item: any) => ({
    ...item,
    // Premium artwork is stored in a separate private bucket. It must travel
    // through the authorized application route, never the public R2 shortcut.
    thumb_url: premium ? publicMediaUrl(item.thumb) : publicThumbnailUrl(item.thumb),
    orig_url: premium ? publicMediaUrl(item.orig) : publicOriginalUrl(item.orig),
  }));
}

/** Low-detail cards for the public Premium sales page. The image route returns
 * an intentionally blurred derivative, never the member original. */
export async function getPremiumPreviewCards(limit = 3) {
  return rows(
    `SELECT id, title FROM artworks
     WHERE published=1 AND COALESCE(premium, 0)=1
     ORDER BY featured DESC, created_at DESC, id DESC LIMIT ?`,
    limit,
  );
}

export async function getCharacters() {
  return rows(
    `SELECT MIN(character_name) AS name, character_slug AS slug, MIN(anime_name) AS anime,
      MIN(anime_slug) AS anime_slug, COUNT(*) AS count,
       (SELECT thumb FROM artworks a2 WHERE a2.character_slug=a.character_slug AND a2.published=1 AND COALESCE(a2.premium, 0)=0 AND ${nonWallpaperFilter()} ORDER BY views DESC, id DESC LIMIT 1) AS cover,
      MAX(created_at) AS updated_at
     FROM artworks a WHERE published=1 AND COALESCE(a.premium, 0)=0 AND ${nonWallpaperFilter()}
     GROUP BY character_slug ORDER BY count DESC, name ASC`,
  );
}

export async function getAnime() {
  return rows(
    `SELECT MIN(anime_name) AS name, anime_slug AS slug, COUNT(*) AS count,
      COUNT(DISTINCT character_slug) AS characters,
       (SELECT thumb FROM artworks a2 WHERE a2.anime_slug=a.anime_slug AND a2.published=1 AND COALESCE(a2.premium, 0)=0 AND ${nonWallpaperFilter()} ORDER BY views DESC, id DESC LIMIT 1) AS cover,
      MAX(created_at) AS updated_at
     FROM artworks a WHERE published=1 AND COALESCE(a.premium, 0)=0 AND ${nonWallpaperFilter()}
     GROUP BY anime_slug ORDER BY count DESC, name ASC`,
  );
}

export async function getCharacter(slug: string) {
  return row(
    `SELECT MIN(character_name) AS name, character_slug AS slug, MIN(anime_name) AS anime,
      MIN(anime_slug) AS anime_slug, COUNT(*) AS count, MAX(created_at) AS updated_at
     FROM artworks WHERE published=1 AND COALESCE(premium, 0)=0 AND ${nonWallpaperFilter()} AND character_slug=? GROUP BY character_slug`,
    slug,
  );
}

export async function getAnimeBySlug(slug: string) {
  return row(
    `SELECT MIN(anime_name) AS name, anime_slug AS slug, COUNT(*) AS count,
      COUNT(DISTINCT character_slug) AS characters, MAX(created_at) AS updated_at
     FROM artworks WHERE published=1 AND COALESCE(premium, 0)=0 AND ${nonWallpaperFilter()} AND anime_slug=? GROUP BY anime_slug`,
    slug,
  );
}

export async function getCharactersForAnime(animeSlug: string) {
  return rows(
    `SELECT MIN(character_name) AS name, character_slug AS slug, COUNT(*) AS count
     FROM artworks WHERE published=1 AND COALESCE(premium, 0)=0 AND ${nonWallpaperFilter()} AND anime_slug=?
     GROUP BY character_slug ORDER BY count DESC, name ASC`,
    animeSlug,
  );
}

export async function getArtwork(id: number) {
  return row("SELECT * FROM artworks WHERE id=? AND published=1 AND COALESCE(premium, 0)=0", id);
}

export async function getArtworkSitemapRows() {
  return rows("SELECT id, created_at FROM artworks WHERE published=1 AND COALESCE(premium, 0)=0 ORDER BY id DESC");
}
