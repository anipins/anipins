import FeaturedSlider from "@/components/FeaturedSlider";
import FilterChips from "@/components/FilterChips";
import MasonryFeed from "@/components/MasonryFeed";
import TrendingRow from "@/components/TrendingRow";

export default function Home() {
  return (
    <div className="pt-28 md:pt-32">
      <FeaturedSlider />
      <section className="mx-auto max-w-[1600px] px-4 md:px-8 pt-14">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="font-display text-2xl font-semibold md:text-3xl">The Feed</h2>
            <p className="mt-1 text-sm text-fog">Fresh artwork, endlessly.</p>
          </div>
          <FilterChips />
        </div>
        <MasonryFeed />
      </section>
      <TrendingRow />
    </div>
  );
}
