import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Breadcrumbs from "@/components/Breadcrumbs";
import JsonLd from "@/components/JsonLd";
import MasonryFeed from "@/components/MasonryFeed";
import { getArtworkCards, getCharacter, getCharactersForAnime } from "@/lib/content";
import { absoluteUrl, artworkAlt } from "@/lib/site";

export async function generateMetadata(props: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const params = await props.params;
  const character = await getCharacter(params.slug);
  if (!character) return { title: "Character not found", robots: { index: false, follow: false } };
  const title = `${character.name} Anime Artwork`;
  const description = `Browse ${character.count} ${character.name} artwork${character.count === 1 ? "" : "s"} from ${character.anime}. Save and download anime art on AniPins.`;
  const images = await getArtworkCards({ character: params.slug, limit: 1 });
  return {
    title,
    description,
    alternates: { canonical: `/c/${params.slug}` },
    openGraph: { title: `${title} | AniPins`, description, url: `/c/${params.slug}`, images: images[0]?.thumb ? [{ url: `/api/img/${images[0].thumb}`, alt: artworkAlt(images[0]) }] : undefined },
    twitter: { card: "summary_large_image", title, description, images: images[0]?.thumb ? [`/api/img/${images[0].thumb}`] : undefined },
  };
}

export default async function CharacterPage(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  const character = await getCharacter(params.slug);
  if (!character) notFound();
  const [artworks, related] = await Promise.all([
    getArtworkCards({ character: params.slug, limit: 20 }),
    getCharactersForAnime(character.anime_slug),
  ]);
  return (
    <section className="mx-auto max-w-[1600px] px-4 pt-28 md:px-8 md:pt-32">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Characters", href: "/characters" }, { label: character.name }]} />
      <JsonLd data={{ "@context": "https://schema.org", "@type": "CollectionPage", name: `${character.name} anime artwork`, url: absoluteUrl(`/c/${params.slug}`), description: `Curated ${character.name} artwork from ${character.anime}.`, mainEntity: { "@type": "ItemList", itemListElement: artworks.map((art: any, index: number) => ({ "@type": "ListItem", position: index + 1, name: art.title || art.character_name, url: absoluteUrl(`/a/${art.id}`), image: absoluteUrl(`/api/img/${art.thumb}`) })) } }} />
      <p className="text-[12px] uppercase tracking-[0.25em] text-fog">Character</p>
      <h1 className="mt-1 font-display text-4xl font-semibold md:text-5xl">{character.name}</h1>
      <p className="mt-2 text-sm text-fog"><Link href={`/anime/${character.anime_slug}`} className="underline decoration-white/20 underline-offset-4 hover:text-paper">{character.anime}</Link> · {character.count} artwork{character.count > 1 ? "s" : ""}</p>
      {related.length > 1 ? <div className="mt-5 flex flex-wrap items-center gap-2"><span className="mr-1 text-xs text-fog">Related:</span>{related.filter((item: any) => item.slug !== params.slug).slice(0, 8).map((item: any) => <Link key={item.slug} href={`/c/${item.slug}`} className="chip">{item.name}</Link>)}</div> : null}
      <div className="mt-8"><MasonryFeed query={{ character: params.slug }} initialItems={artworks} initialHasMore={artworks.length === 20} /></div>
    </section>
  );
}
