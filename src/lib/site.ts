export const SITE_NAME = "AniPins";
export const DEFAULT_SITE_URL = "https://anipins-three.vercel.app";

export function getSiteUrl() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  return (configured || DEFAULT_SITE_URL).replace(/\/$/, "");
}

export function absoluteUrl(path = "/") {
  return new URL(path, `${getSiteUrl()}/`).toString();
}

export function artworkAlt(art: any) {
  const subject = art.title || art.character_name || "Anime artwork";
  const series = art.anime_name ? ` from ${art.anime_name}` : "";
  return `${subject}${series} — anime artwork on AniPins`;
}
