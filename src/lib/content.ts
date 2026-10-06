import { row, rows } from "@/lib/db";
import { publicMediaUrl } from "@/lib/media";
import { premiumArtworkFilter } from "@/lib/premium-artwork";

export const ARTWORK_CARD_COLUMNS =
  "id, title, character_name, character_slug, anime_name, anime_slug, description, tags, gender, category, featured, thumb, width, height, views, downloads, created_at";

export async function getArtworkCards(options: {
  limit?: number;
  sort?: "latest" | "trending" | "popular" | "featured" | "random";
  character?: string;
  anime?: string;
  excludeId?: number;
  /** Use only in authenticated member-only server views. */
  premium?: boolean;
} = {}) {
  const { limit = 20, sort = "latest", character, anime, excludeId, premium = false } = options;
  // Server-rendered public pages must use the same separation as the feed API:
  // premium-only artwork is visible only through the member library.
  let where = `published=1 AND ${premiumArtworkFilter(premium)}`;
  const args: any[] = [];
  if (character) { where += " AND character_slug=?"; args.push(character); }
  if (anime) { where += " AND anime_slug=?"; args.push(anime); }
  if (excludeId) { where += " AND id!=?"; args.push(excludeId); }
  if (sort === "featured") where += " AND featured=1";

  let order = "created_at DESC, id DESC";
  if (sort === "trending") order = "views DESC, downloads DESC, id DESC";
  if (sort === "popular") order = "downloads DESC, views DESC, id DESC";
  if (sort === "featured") order = "views DESC, id DESC";
  if (sort === "random") order = "RANDOM()";
  // The home page renders page zero on the server, while MasonryFeed obtains
  // later pages through /api/artworks. Use the same balanced latest ordering
  // in both places so no card is repeated or skipped at that hand-off.
  const balancedLatest = sort === "latest" && !character && !anime && !excludeId;
  const items = balancedLatest
    ? await rows(
      `SELECT ${ARTWORK_CARD_COLUMNS} FROM (
        SELECT ${ARTWORK_CARD_COLUMNS},
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
      LIMIT ?`,
      ...args, limit,
    )
    : await rows(`SELECT ${ARTWORK_CARD_COLUMNS} FROM artworks WHERE ${where} ORDER BY ${order} LIMIT ?`, ...args, limit);
  return items.map((item: any) => ({ ...item, thumb_url: publicMediaUrl(item.thumb) }));
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
       (SELECT thumb FROM artworks a2 WHERE a2.character_slug=a.character_slug AND a2.published=1 AND COALESCE(a2.premium, 0)=0 ORDER BY views DESC, id DESC LIMIT 1) AS cover,
      MAX(created_at) AS updated_at
     FROM artworks a WHERE published=1 AND COALESCE(a.premium, 0)=0
     GROUP BY character_slug ORDER BY count DESC, name ASC`,
  );
}

export async function getAnime() {
  return rows(
    `SELECT MIN(anime_name) AS name, anime_slug AS slug, COUNT(*) AS count,
      COUNT(DISTINCT character_slug) AS characters,
       (SELECT thumb FROM artworks a2 WHERE a2.anime_slug=a.anime_slug AND a2.published=1 AND COALESCE(a2.premium, 0)=0 ORDER BY views DESC, id DESC LIMIT 1) AS cover,
      MAX(created_at) AS updated_at
     FROM artworks a WHERE published=1 AND COALESCE(a.premium, 0)=0
     GROUP BY anime_slug ORDER BY count DESC, name ASC`,
  );
}

export async function getCharacter(slug: string) {
  return row(
    `SELECT MIN(character_name) AS name, character_slug AS slug, MIN(anime_name) AS anime,
      MIN(anime_slug) AS anime_slug, COUNT(*) AS count, MAX(created_at) AS updated_at
     FROM artworks WHERE published=1 AND COALESCE(premium, 0)=0 AND character_slug=? GROUP BY character_slug`,
    slug,
  );
}

export async function getAnimeBySlug(slug: string) {
  return row(
    `SELECT MIN(anime_name) AS name, anime_slug AS slug, COUNT(*) AS count,
      COUNT(DISTINCT character_slug) AS characters, MAX(created_at) AS updated_at
     FROM artworks WHERE published=1 AND COALESCE(premium, 0)=0 AND anime_slug=? GROUP BY anime_slug`,
    slug,
  );
}

export async function getCharactersForAnime(animeSlug: string) {
  return rows(
    `SELECT MIN(character_name) AS name, character_slug AS slug, COUNT(*) AS count
     FROM artworks WHERE published=1 AND COALESCE(premium, 0)=0 AND anime_slug=?
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
