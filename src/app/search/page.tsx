import MasonryFeed from "@/components/MasonryFeed";
import { getArtworkCards } from "@/lib/content";
import { unstable_cache } from "next/cache";

const getInitialSearchCards = unstable_cache(
  () => getArtworkCards({ sort: "latest", limit: 36 }),
  ["public-search-initial-v1"],
  { revalidate: 10 },
);

type SearchParams = Record<string, string | string[] | undefined>;

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] || "" : value || "";
}

export default async function SearchPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const q = firstParam(params.q);
  const gender = firstParam(params.gender);
  const wallpapers = firstParam(params.wallpapers) === "1";
  const base = `/search?q=${encodeURIComponent(q)}`;
  const showDefaultFeed = !q && !gender && !wallpapers;
  // Search used to show a blank skeleton and wait for hydration plus an API
  // round-trip even when the user only opened the Search tab. Render the
  // public default feed on the server; filtered/typed searches still use the
  // existing API path and authorization rules.
  const initialItems = showDefaultFeed ? await getInitialSearchCards() : [];
  const feedQuery = { ...(q ? { q } : {}), ...(gender ? { gender } : {}), ...(wallpapers ? { wallpaper: "1" } : {}) };

  return (
    <section className="w-full px-3 pt-28 sm:px-4 md:px-6 md:pt-32 xl:px-8">
      <h1 className="font-display text-3xl font-semibold md:text-4xl">
        {q ? <>Results for <span className="text-fog">“{q}”</span></> : "Search"}
      </h1>
      <p className="mt-1 text-sm text-fog">Search by character, anime, tags or category. Close spellings are suggested automatically.</p>
      <div className="mb-6 mt-4 flex gap-2 overflow-x-auto no-scrollbar"><a href={base} className={`chip ${!gender && !wallpapers ? "chip-on" : ""}`}>All</a>{["Male","Female","Non-binary"].map(g=><a key={g} href={`${base}&gender=${encodeURIComponent(g)}`} className={`chip ${gender===g && !wallpapers ? "chip-on" : ""}`}>{g}</a>)}<a href={`${base}&wallpapers=1`} className={`chip ${wallpapers ? "chip-on" : ""}`}>Wallpapers</a></div>
      <MasonryFeed
        query={feedQuery}
        initialItems={initialItems}
        initialHasMore={initialItems.length === 36}
        emptyMessage={q ? `No artwork matched “${q}”. Try another spelling, character, anime, or tag.` : "Start by searching for a character, anime, or tag."}
        emptyAction={q ? { href: "/explore", label: "Explore all artwork" } : undefined}
      />
    </section>
  );
}
