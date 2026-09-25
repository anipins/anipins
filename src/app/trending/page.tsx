import FilterChips from "@/components/FilterChips";
import MasonryFeed from "@/components/MasonryFeed";
import type { Metadata } from "next";
import Breadcrumbs from "@/components/Breadcrumbs";
import { getArtworkCards } from "@/lib/content";

export const metadata: Metadata = { title: "Trending Anime Artwork", description: "See the anime artwork people are viewing and downloading most on AniPins.", alternates: { canonical: "/trending" } };
export const dynamic = "force-dynamic";

export default async function Trending() {
  const items = await getArtworkCards({ sort: "trending", limit: 20 });
  return (
    <section className="w-full px-3 pt-28 sm:px-4 md:px-6 md:pt-32 xl:px-8">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Trending" }]} />
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold md:text-4xl">Trending</h1>
          <p className="mt-1 text-sm text-fog">What everyone is viewing right now.</p>
        </div>
        <FilterChips />
      </div>
      <MasonryFeed query={{ sort: "trending" }} initialItems={items} initialHasMore={items.length === 20} />
    </section>
  );
}
