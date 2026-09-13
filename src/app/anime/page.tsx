import type { Metadata } from "next";
import Link from "next/link";
import Breadcrumbs from "@/components/Breadcrumbs";
import JsonLd from "@/components/JsonLd";
import { getAnime } from "@/lib/content";
import { absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Anime Artwork by Series",
  description: "Explore curated anime artwork collections organized by anime series on AniPins.",
  alternates: { canonical: "/anime" },
  openGraph: { title: "Anime Artwork by Series | AniPins", description: "Browse anime artwork collections by series.", url: "/anime" },
};
export const dynamic = "force-dynamic";

export default async function AnimeIndex() {
  const animes = await getAnime();
  return (
    <section className="mx-auto max-w-[1400px] px-4 pt-28 md:px-8 md:pt-32">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Anime" }]} />
      <JsonLd data={{ "@context": "https://schema.org", "@type": "CollectionPage", name: "Anime artwork by series", url: absoluteUrl("/anime"), mainEntity: { "@type": "ItemList", itemListElement: animes.map((a: any, i: number) => ({ "@type": "ListItem", position: i + 1, name: a.name, url: absoluteUrl(`/anime/${a.slug}`) })) } }} />
      <h1 className="font-display text-3xl font-semibold md:text-4xl">Anime</h1>
      <p className="mb-8 mt-1 text-sm text-fog">Collections by series.</p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {animes.map((a: any) => (
          <Link key={a.slug} href={`/anime/${a.slug}`} className="group relative block h-60 overflow-hidden rounded-2xl hairline">
            {a.cover ? <img src={`/api/img/${a.cover}`} alt={`${a.name} anime artwork collection on AniPins`} loading="lazy" width="960" height="600" className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" /> : null}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
            <div className="absolute bottom-0 p-5"><h2 className="font-display text-xl font-semibold">{a.name}</h2><p className="mt-0.5 text-xs text-white/60">{a.count} artworks · {a.characters} characters</p></div>
          </Link>
        ))}
      </div>
    </section>
  );
}
