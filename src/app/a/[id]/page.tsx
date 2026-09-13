import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ArtworkDetailClient from "@/components/ArtworkDetailClient";
import JsonLd from "@/components/JsonLd";
import { getArtwork, getArtworkCards } from "@/lib/content";
import { row } from "@/lib/db";
import { absoluteUrl, artworkAlt } from "@/lib/site";

export async function generateMetadata(props: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const params = await props.params;
  const id = Number(params.id);
  const art = Number.isInteger(id) ? await getArtwork(id) : null;
  if (!art) return { title: "Artwork not found", robots: { index: false, follow: false } };
  const title = `${art.title || art.character_name} — ${art.anime_name} Artwork`;
  const description = art.description || `View and download ${art.character_name} anime artwork from ${art.anime_name} on AniPins.`;
  const image = `/api/img/${art.orig || art.thumb}`;
  return {
    title,
    description,
    alternates: { canonical: `/a/${art.id}` },
    openGraph: { title: `${title} | AniPins`, description, type: "article", url: `/a/${art.id}`, images: [{ url: image, width: art.width || undefined, height: art.height || undefined, alt: artworkAlt(art) }] },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}

export default async function ArtworkPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const id = Number(params.id);
  if (!Number.isInteger(id)) notFound();
  const art = await getArtwork(id);
  if (!art) notFound();
  const [related, adjacent] = await Promise.all([
    getArtworkCards({ limit: 36, sort: "trending", excludeId: id }),
    row(`SELECT MAX(CASE WHEN id < ? THEN id END) AS prev_id, MIN(CASE WHEN id > ? THEN id END) AS next_id FROM artworks WHERE published=1`, id, id),
  ]);
  const initialData = { art, related, prevId: adjacent?.prev_id ?? null, nextId: adjacent?.next_id ?? null, likeCount: 0, liked: false };
  return (
    <>
      <JsonLd data={{
        "@context": "https://schema.org",
        "@type": "ImageObject",
        name: art.title || `${art.character_name} artwork`,
        caption: art.description || artworkAlt(art),
        contentUrl: absoluteUrl(`/api/img/${art.orig}`),
        thumbnailUrl: absoluteUrl(`/api/img/${art.thumb}`),
        width: art.width || undefined,
        height: art.height || undefined,
        representativeOfPage: true,
        creditText: art.creator_name || undefined,
        creator: art.creator_name ? { "@type": "Person", name: art.creator_name } : undefined,
        isPartOf: { "@type": "WebSite", name: "AniPins", url: absoluteUrl("/") },
        about: [{ "@type": "Thing", name: art.character_name }, { "@type": "CreativeWorkSeries", name: art.anime_name }],
      }} />
      <ArtworkDetailClient params={params} initialData={initialData} />
    </>
  );
}
