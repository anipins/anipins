"use client";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import MasonryFeed from "@/components/MasonryFeed";

function SearchInner() {
  const q = useSearchParams().get("q") || "";
  const gender = useSearchParams().get("gender") || "";
  const wallpapers = useSearchParams().get("wallpapers") === "1";
  const base = `/search?q=${encodeURIComponent(q)}`;
  return (
    <section className="w-full px-3 pt-28 sm:px-4 md:px-6 md:pt-32 xl:px-8">
      <h1 className="font-display text-3xl font-semibold md:text-4xl">
        {q ? <>Results for <span className="text-fog">“{q}”</span></> : "Search"}
      </h1>
      <p className="mt-1 text-sm text-fog">Search by character, anime, tags or category. Close spellings are suggested automatically.</p>
      <div className="mb-6 mt-4 flex gap-2 overflow-x-auto no-scrollbar"><a href={base} className={`chip ${!gender && !wallpapers ? "chip-on" : ""}`}>All</a>{["Male","Female","Non-binary"].map(g=><a key={g} href={`${base}&gender=${encodeURIComponent(g)}`} className={`chip ${gender===g && !wallpapers ? "chip-on" : ""}`}>{g}</a>)}<a href={`${base}&wallpapers=1`} className={`chip ${wallpapers ? "chip-on" : ""}`}>Wallpapers</a></div>
      <MasonryFeed query={{ ...(q ? { q } : {}), ...(gender ? { gender } : {}), ...(wallpapers ? { wallpaper: "1" } : {}) }} />
    </section>
  );
}

export default function SearchPage() {
  return <Suspense><SearchInner /></Suspense>;
}
