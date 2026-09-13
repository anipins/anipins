import type { MetadataRoute } from "next";
import { getAnime, getArtworkSitemapRows, getCharacters } from "@/lib/content";
import { absoluteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";

function validDate(value: unknown) {
  const date = value ? new Date(String(value)) : new Date();
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [anime, characters, artworks] = await Promise.all([getAnime(), getCharacters(), getArtworkSitemapRows()]);
  const staticPages = [
    ["/", 1, "daily"], ["/explore", 0.9, "daily"], ["/trending", 0.9, "daily"],
    ["/anime", 0.8, "daily"], ["/characters", 0.8, "daily"],
    ["/about", 0.5, "monthly"], ["/support", 0.5, "monthly"],
    ["/privacy", 0.3, "monthly"], ["/terms", 0.3, "monthly"], ["/copyright", 0.3, "monthly"], ["/delete-account", 0.3, "monthly"],
  ] as const;
  return [
    ...staticPages.map(([path, priority, changeFrequency]) => ({ url: absoluteUrl(path), lastModified: new Date(), priority, changeFrequency })),
    ...anime.map((item: any) => ({ url: absoluteUrl(`/anime/${item.slug}`), lastModified: validDate(item.updated_at), changeFrequency: "weekly" as const, priority: 0.7 })),
    ...characters.map((item: any) => ({ url: absoluteUrl(`/c/${item.slug}`), lastModified: validDate(item.updated_at), changeFrequency: "weekly" as const, priority: 0.7 })),
    ...artworks.map((item: any) => ({ url: absoluteUrl(`/a/${item.id}`), lastModified: validDate(item.created_at), changeFrequency: "monthly" as const, priority: 0.6 })),
  ];
}
