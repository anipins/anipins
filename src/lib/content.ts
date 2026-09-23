import { row, rows } from "@/lib/db";
import { publicMediaUrl } from "@/lib/media";

export const ARTWORK_CARD_COLUMNS =
  "id, title, character_name, character_slug, anime_name, anime_slug, description, tags, gender, category, featured, thumb, width, height, views, downloads, created_at";

export async function getArtworkCards(options: {
  limit?: number;
  sort?: "latest" | "trending" | "popular" | "featured" | "random";
  character?: string;
  anime?: string;
  excludeId?: number;
} = {}) {
  const { limit = 20, sort = "latest", character, anime, excludeId } = options;
  let where = "published=1";
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
  const items = await rows(`SELECT ${ARTWORK_CARD_COLUMNS} FROM artworks WHERE ${where} ORDER BY ${order} LIMIT ?`, ...args, limit);
  return items.map((item: any) => ({ ...item, thumb_url: publicMediaUrl(item.thumb) }));
}

export async function getCharacters() {
  return rows(
    `SELECT character_name AS name, character_slug AS slug, MIN(anime_name) AS anime,
      MIN(anime_slug) AS anime_slug, COUNT(*) AS count,
      (SELECT thumb FROM artworks a2 WHERE a2.character_slug=a.character_slug AND a2.published=1 ORDER BY views DESC, id DESC LIMIT 1) AS cover,
      MAX(created_at) AS updated_at
     FROM artworks a WHERE published=1
     GROUP BY character_slug, character_name ORDER BY count DESC, name ASC`,
  );
}

export async function getAnime() {
  return rows(
    `SELECT anime_name AS name, anime_slug AS slug, COUNT(*) AS count,
      COUNT(DISTINCT character_slug) AS characters,
      (SELECT thumb FROM artworks a2 WHERE a2.anime_slug=a.anime_slug AND a2.published=1 ORDER BY views DESC, id DESC LIMIT 1) AS cover,
      MAX(created_at) AS updated_at
     FROM artworks a WHERE published=1
     GROUP BY anime_slug, anime_name ORDER BY count DESC, name ASC`,
  );
}

export async function getCharacter(slug: string) {
  return row(
    `SELECT character_name AS name, character_slug AS slug, MIN(anime_name) AS anime,
      MIN(anime_slug) AS anime_slug, COUNT(*) AS count, MAX(created_at) AS updated_at
     FROM artworks WHERE published=1 AND character_slug=? GROUP BY character_slug, character_name`,
    slug,
  );
}

export async function getAnimeBySlug(slug: string) {
  return row(
    `SELECT anime_name AS name, anime_slug AS slug, COUNT(*) AS count,
      COUNT(DISTINCT character_slug) AS characters, MAX(created_at) AS updated_at
     FROM artworks WHERE published=1 AND anime_slug=? GROUP BY anime_slug, anime_name`,
    slug,
  );
}

export async function getCharactersForAnime(animeSlug: string) {
  return rows(
    `SELECT character_name AS name, character_slug AS slug, COUNT(*) AS count
     FROM artworks WHERE published=1 AND anime_slug=?
     GROUP BY character_slug, character_name ORDER BY count DESC, name ASC`,
    animeSlug,
  );
}

export async function getArtwork(id: number) {
  return row("SELECT * FROM artworks WHERE id=? AND published=1", id);
}

export async function getArtworkSitemapRows() {
  return rows("SELECT id, created_at FROM artworks WHERE published=1 ORDER BY id DESC");
}
