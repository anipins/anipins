import FeaturedSlider from "@/components/FeaturedSlider";
import FilterChips from "@/components/FilterChips";
import MasonryFeed from "@/components/MasonryFeed";
import TrendingRow from "@/components/TrendingRow";
import Link from "next/link";
import JsonLd from "@/components/JsonLd";
import { getAnime, getArtworkCards, getCharacters } from "@/lib/content";
import { getSiteUrl } from "@/lib/site";
import type { Metadata } from "next";
import { unstable_cache } from "next/cache";

export const metadata: Metadata = { alternates: { canonical: "/" } };
export const dynamic = "force-dynamic";

// The page remains runtime-rendered for the project's SQLite/Postgres
// compatibility, while its expensive public data queries stay warm.
const getHomeData = unstable_cache(
  () => Promise.all([
    getArtworkCards({ sort: "featured", limit: 8 }),
    getArtworkCards({ sort: "latest", limit: 36 }),
    getAnime(),
    getCharacters(),
  ]),
  ["home-data-v2"],
  { revalidate: 60, tags: ["home-artwork"] },
);

export default async function Home() {
  const [featured, latest, anime, characters] = await getHomeData();
  return (
    <div className="pt-28 md:pt-32">
      <JsonLd data={{ "@context": "https://schema.org", "@type": "CollectionPage", name: "AniPins anime artwork", url: getSiteUrl(), description: "Discover, save and download curated anime character artwork.", numberOfItems: latest.length }} />
      <FeaturedSlider initialArts={featured} />
      <section className="w-full px-3 pt-12 sm:px-4 md:px-6 xl:px-8">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="flex items-center gap-3"><span className="badge-gold">Latest</span><h2 className="font-display text-2xl font-semibold md:text-3xl">Discover artwork</h2></div>
            <p className="mt-1 text-sm text-fog">Fresh anime artwork, continuously loaded as you explore.</p>
          </div>
          <FilterChips />
        </div>
        <MasonryFeed query={{ sort: "latest" }} initialItems={latest} initialHasMore={latest.length === 36} />
      </section>
      <section className="w-full px-3 py-12 sm:px-4 md:px-6 xl:px-8" aria-labelledby="browse-anipins">
        <h2 id="browse-anipins" className="font-display text-2xl font-semibold md:text-3xl">Browse anime art by series and character</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-fog">Explore AniPins collections with direct links to artwork from popular anime series and characters. New uploads appear automatically in every collection.</p>
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl bg-soft p-5 hairline">
            <h3 className="font-display text-lg font-semibold">Popular anime series</h3>
            <div className="mt-4 flex flex-wrap gap-2">{anime.slice(0, 12).map((item: any) => <Link key={item.slug} href={`/anime/${item.slug}`} className="chip">{item.name} ({item.count})</Link>)}</div>
            <Link href="/anime" className="mt-5 inline-block text-sm text-gold hover:underline">View every anime collection →</Link>
          </div>
          <div className="rounded-2xl bg-soft p-5 hairline">
            <h3 className="font-display text-lg font-semibold">Popular characters</h3>
            <div className="mt-4 flex flex-wrap gap-2">{characters.slice(0, 12).map((item: any) => <Link key={item.slug} href={`/c/${item.slug}`} className="chip">{item.name} ({item.count})</Link>)}</div>
            <Link href="/characters" className="mt-5 inline-block text-sm text-gold hover:underline">View every character →</Link>
          </div>
        </div>
      </section>
      <TrendingRow />
    </div>
  );
}
