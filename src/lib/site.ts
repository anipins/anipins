import { normalizeSiteUrl } from "./site-url.mjs";

export const SITE_NAME = "AniPins";
export const DEFAULT_SITE_URL = "https://anipins.com";

export function getSiteUrl() {
  return normalizeSiteUrl(process.env.NEXT_PUBLIC_SITE_URL, DEFAULT_SITE_URL);
}

export function absoluteUrl(path = "/") {
  return new URL(path, `${getSiteUrl()}/`).toString();
}

export function artworkAlt(art: any) {
  const subject = art.title || art.character_name || "Anime artwork";
  const series = art.anime_name ? ` from ${art.anime_name}` : "";
  return `${subject}${series} — anime artwork on AniPins`;
}
