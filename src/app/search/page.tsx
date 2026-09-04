"use client";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import MasonryFeed from "@/components/MasonryFeed";

function SearchInner() {
  const q = useSearchParams().get("q") || "";
  return (
    <section className="mx-auto max-w-[1600px] px-4 md:px-8 pt-28 md:pt-32">
      <h1 className="font-display text-3xl font-semibold md:text-4xl">
        {q ? <>Results for <span className="text-fog">“{q}”</span></> : "Search"}
      </h1>
      <p className="mt-1 mb-6 text-sm text-fog">Search by character, anime, tags or category.</p>
      <MasonryFeed query={q ? { q } : {}} />
    </section>
  );
}

export default function SearchPage() {
  return <Suspense><SearchInner /></Suspense>;
}
