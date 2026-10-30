import FeaturedSlider from "@/components/FeaturedSlider";
import FilterChips from "@/components/FilterChips";
import MasonryFeed from "@/components/MasonryFeed";
import JsonLd from "@/components/JsonLd";
import ScrollReveal from "@/components/ScrollReveal";
import { getArtworkCards } from "@/lib/content";
import { getSiteUrl } from "@/lib/site";
import type { Metadata } from "next";
import { unstable_cache } from "next/cache";
import { HOME_DISCOVERY_QUERY } from "@/lib/home-feed";

export const metadata: Metadata = { alternates: { canonical: "/" } };
export const dynamic = "force-dynamic";

// Keep the public first screen shared for a few seconds. This removes the
// database wake-up that made a first mobile visit feel slow without making a
// newly published image wait for a long revalidation window.
const getHomeFeatured = unstable_cache(
  () => getArtworkCards({ sort: "featured", limit: 8 }),
  ["public-home-featured-v1"],
  { revalidate: 10 },
);

// Keep the discovery set fresh but avoid a costly ORDER BY RANDOM() database
// query for every page open. Cards are shuffled in the client on each visit.
const getHomeDiscovery = unstable_cache(
  (seed: number) => getArtworkCards({ sort: "random", limit: 18, seed, compact: true }),
  ["public-home-discovery-v3"],
  { revalidate: 5 },
);

export default async function Home() {
  // A five-second public cache prevents concurrent visitors from each running
  // the costly random query; the rendered cards still rotate client-side.
  const discoverySeed = (Math.floor(Date.now() / 5000) % 2_147_483_646) + 1;
  const [featured, discovery] = await Promise.all([
    getHomeFeatured(),
    getHomeDiscovery(discoverySeed),
  ]);
  return (
    <div className="pt-24 md:pt-28">
      <JsonLd data={{ "@context": "https://schema.org", "@type": "CollectionPage", name: "AniPins anime artwork references", url: getSiteUrl(), description: "Discover, save and download curated anime character artwork references for drawing inspiration.", numberOfItems: discovery.length }} />
      <FeaturedSlider initialArts={featured} />
      <section className="w-full px-3 pt-12 sm:px-4 md:px-6 xl:px-8">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <ScrollReveal>
            <div className="flex items-center gap-3"><span className="badge-gold">Discover</span><h2 className="font-display text-2xl font-semibold md:text-3xl">Explore artwork</h2></div>
            <p className="mt-1 text-sm text-fog">Explore anime artwork, save inspiration, and discover your next favorite.</p>
          </ScrollReveal>
          <FilterChips />
        </div>
        <MasonryFeed query={HOME_DISCOVERY_QUERY} randomize initialItems={discovery} initialHasMore={discovery.length === 18} initialSeed={discoverySeed} />
      </section>
    </div>
  );
}
