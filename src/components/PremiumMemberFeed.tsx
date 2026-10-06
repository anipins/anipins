"use client";

import { useState } from "react";
import FeaturedSlider from "@/components/FeaturedSlider";
import MasonryFeed from "@/components/MasonryFeed";
import ScrollReveal from "@/components/ScrollReveal";

const FILTERS = [
  { label: "Latest", query: { sort: "latest" } },
  { label: "Trending", query: { sort: "trending" } },
  { label: "Popular", query: { sort: "popular" } },
  { label: "Wallpapers", query: { sort: "latest", wallpaper: "1" } },
  { label: "Male Characters", query: { sort: "latest", category: "Male Characters" } },
  { label: "Female Characters", query: { sort: "latest", category: "Female Characters" } },
];

type Props = { featured: any[]; latest: any[] };

/**
 * The member landing page intentionally mirrors Home while every request is
 * explicitly tagged premium=1. It must never link to public browse routes.
 */
export default function PremiumMemberFeed({ featured, latest }: Props) {
  const [filter, setFilter] = useState(0);
  const query = { premium: "1", ...FILTERS[filter].query };

  return (
    <main className="pt-28 md:pt-32">
      <div className="mx-auto mb-7 max-w-[1400px] px-4 md:px-8">
        <div className="rounded-2xl border border-gold/30 bg-gold/10 px-4 py-3 text-sm text-fog">
          <span className="mr-2 font-semibold uppercase tracking-[.18em] text-gold">AniPins Premium</span>
          Member-only artwork. This feed never mixes with the public Home feed.
        </div>
      </div>
      <FeaturedSlider initialArts={featured} premium />
      <section className="w-full px-3 pb-16 pt-12 sm:px-4 md:px-6 xl:px-8">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <ScrollReveal>
            <div className="flex items-center gap-3"><span className="badge-gold">Premium</span><h1 className="font-display text-2xl font-semibold md:text-3xl">Discover exclusive artwork</h1></div>
            <p className="mt-1 text-sm text-fog">Your private AniPins collection—Premium artwork only, continuously loaded as you explore.</p>
          </ScrollReveal>
          <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
            {FILTERS.map((item, index) => <button key={item.label} type="button" onClick={() => setFilter(index)} className={`chip whitespace-nowrap ${filter === index ? "chip-on" : ""}`}>{item.label}</button>)}
          </div>
        </div>
        <MasonryFeed key={JSON.stringify(query)} query={query} initialItems={filter === 0 ? latest : []} initialHasMore={filter === 0 ? latest.length === 36 : true} />
      </section>
    </main>
  );
}
