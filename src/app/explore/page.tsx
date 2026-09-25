"use client";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import FilterChips from "@/components/FilterChips";
import MasonryFeed from "@/components/MasonryFeed";

function ExploreInner() {
  const sp = useSearchParams();
  const query: Record<string, string> = {};
  const sort = sp.get("sort"); const category = sp.get("category");
  if (sort) query.sort = sort;
  if (category) query.category = category;
  const title = category || (sort ? sort.charAt(0).toUpperCase() + sort.slice(1) : "Explore");
  return (
    <section className="w-full px-3 pt-28 sm:px-4 md:px-6 md:pt-32 xl:px-8">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold md:text-4xl">{title}</h1>
          <p className="mt-1 text-sm text-fog">Browse the full AniPins gallery.</p>
        </div>
        <FilterChips />
      </div>
      <MasonryFeed query={query} />
    </section>
  );
}

export default function Explore() {
  return <Suspense><ExploreInner /></Suspense>;
}
