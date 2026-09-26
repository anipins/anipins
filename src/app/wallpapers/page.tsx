"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import MasonryFeed from "@/components/MasonryFeed";

const FILTERS = [
  { label: "All wallpapers", value: "" },
  { label: "Phone wallpapers", value: "phone" },
  { label: "Desktop wallpapers", value: "desktop" },
];

function WallpapersInner() {
  const searchParams = useSearchParams();
  const requested = searchParams.get("orientation");
  const orientation = requested === "phone" || requested === "desktop" ? requested : "";
  const query = { wallpaper: "1", ...(orientation ? { orientation } : {}) };

  return (
    <section className="w-full px-3 pt-28 sm:px-4 md:px-6 md:pt-32 xl:px-8">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.22em] text-gold">AniPins Wallpapers</p>
          <h1 className="mt-2 font-display text-3xl font-semibold md:text-4xl">Anime wallpapers</h1>
          <p className="mt-2 max-w-2xl text-sm text-fog">Download-ready anime wallpapers, selected separately from the regular artwork feed.</p>
        </div>
        <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1" aria-label="Wallpaper layout">
          {FILTERS.map(filter => {
            const href = filter.value ? `/wallpapers?orientation=${filter.value}` : "/wallpapers";
            return <Link key={filter.value || "all"} href={href} className={`chip whitespace-nowrap ${orientation === filter.value ? "chip-on" : ""}`}>{filter.label}</Link>;
          })}
        </div>
      </div>
      <MasonryFeed query={query} />
    </section>
  );
}

export default function Wallpapers() {
  return <Suspense><WallpapersInner /></Suspense>;
}
