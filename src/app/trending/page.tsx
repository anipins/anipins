import FilterChips from "@/components/FilterChips";
import MasonryFeed from "@/components/MasonryFeed";

export default function Trending() {
  return (
    <section className="mx-auto max-w-[1600px] px-4 md:px-8 pt-28 md:pt-32">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold md:text-4xl">Trending</h1>
          <p className="mt-1 text-sm text-fog">What everyone is viewing right now.</p>
        </div>
        <FilterChips />
      </div>
      <MasonryFeed query={{ sort: "trending" }} />
    </section>
  );
}
