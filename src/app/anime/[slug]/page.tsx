import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Breadcrumbs from "@/components/Breadcrumbs";
import JsonLd from "@/components/JsonLd";
import MasonryFeed from "@/components/MasonryFeed";
import FollowButton from "@/components/FollowButton";
import { getAnimeBySlug, getArtworkCards, getCharactersForAnime } from "@/lib/content";
import { absoluteUrl, artworkAlt } from "@/lib/site";

export async function generateMetadata(props: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const params = await props.params;
  const anime = await getAnimeBySlug(params.slug);
  if (!anime) return { title: "Anime not found", robots: { index: false, follow: false } };
  const title = `${anime.name} Anime Artwork`;
  const description = `Explore ${anime.count} curated ${anime.name} artwork${anime.count === 1 ? "" : "s"} featuring ${anime.characters} character${anime.characters === 1 ? "" : "s"} on AniPins.`;
  const images = await getArtworkCards({ anime: params.slug, limit: 1 });
  return { title, description, alternates: { canonical: `/anime/${params.slug}` }, openGraph: { title: `${title} | AniPins`, description, url: `/anime/${params.slug}`, images: images[0]?.thumb ? [{ url: `/api/img/${images[0].thumb}`, alt: artworkAlt(images[0]) }] : undefined }, twitter: { card: "summary_large_image", title, description, images: images[0]?.thumb ? [`/api/img/${images[0].thumb}`] : undefined } };
}

export default async function AnimePage(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  const anime = await getAnimeBySlug(params.slug);
  if (!anime) notFound();
  const [artworks, characters] = await Promise.all([getArtworkCards({ anime: params.slug, limit: 36 }), getCharactersForAnime(params.slug)]);
  return (
    <section className="w-full px-3 pt-28 sm:px-4 md:px-6 md:pt-32 xl:px-8">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Anime", href: "/anime" }, { label: anime.name }]} />
      <JsonLd data={{ "@context": "https://schema.org", "@type": "CollectionPage", name: `${anime.name} anime artwork`, url: absoluteUrl(`/anime/${params.slug}`), description: `Curated artwork from ${anime.name}.`, mainEntity: { "@type": "ItemList", itemListElement: artworks.map((art: any, index: number) => ({ "@type": "ListItem", position: index + 1, name: art.title || art.character_name, url: absoluteUrl(`/a/${art.id}`), image: absoluteUrl(`/api/img/${art.thumb}`) })) } }} />
      <p className="text-[12px] uppercase tracking-[0.25em] text-fog">Anime</p>
      <h1 className="mt-1 font-display text-4xl font-semibold md:text-5xl">{anime.name}</h1>
      <div className="mt-3 flex flex-wrap items-center gap-3"><p className="text-sm text-fog">{anime.count} artworks · {anime.characters} characters</p><FollowButton kind="anime" value={params.slug} label={anime.name} /></div>
      {characters.length ? <div className="mt-5 flex flex-wrap items-center gap-2"><span className="mr-1 text-xs text-fog">Characters:</span>{characters.map((item: any) => <Link key={item.slug} href={`/c/${item.slug}`} className="chip">{item.name}</Link>)}</div> : null}
      <div className="mt-8"><MasonryFeed query={{ anime: params.slug }} initialItems={artworks} initialHasMore={artworks.length === 36} /></div>
    </section>
  );
}
