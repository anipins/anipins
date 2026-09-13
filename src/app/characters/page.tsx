import type { Metadata } from "next";
import Link from "next/link";
import Breadcrumbs from "@/components/Breadcrumbs";
import JsonLd from "@/components/JsonLd";
import { getCharacters } from "@/lib/content";
import { absoluteUrl, artworkAlt } from "@/lib/site";

export const metadata: Metadata = {
  title: "Anime Characters",
  description: "Browse anime characters on AniPins and discover curated artwork for every character.",
  alternates: { canonical: "/characters" },
  openGraph: { title: "Anime Characters | AniPins", description: "Browse every anime character with artwork on AniPins.", url: "/characters" },
};
export const dynamic = "force-dynamic";

export default async function Characters() {
  const chars = await getCharacters();
  return (
    <section className="mx-auto max-w-[1400px] px-4 pt-28 md:px-8 md:pt-32">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Characters" }]} />
      <JsonLd data={{ "@context": "https://schema.org", "@type": "CollectionPage", name: "Anime characters", url: absoluteUrl("/characters"), mainEntity: { "@type": "ItemList", itemListElement: chars.map((c: any, i: number) => ({ "@type": "ListItem", position: i + 1, name: c.name, url: absoluteUrl(`/c/${c.slug}`) })) } }} />
      <h1 className="font-display text-3xl font-semibold md:text-4xl">Characters</h1>
      <p className="mb-8 mt-1 text-sm text-fog">Every character with published artwork on AniPins.</p>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {chars.map((c: any) => (
          <Link key={c.slug} href={`/c/${c.slug}`} className="group block overflow-hidden rounded-2xl bg-soft hairline">
            <div className="aspect-[4/5] overflow-hidden">{c.cover ? <img src={`/api/img/${c.cover}`} alt={artworkAlt({ character_name: c.name, anime_name: c.anime })} loading="lazy" width="640" height="800" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" /> : null}</div>
            <div className="p-4"><h2 className="font-medium">{c.name}</h2><p className="mt-0.5 text-xs text-fog">{c.anime} · {c.count} artwork{c.count > 1 ? "s" : ""}</p></div>
          </Link>
        ))}
      </div>
    </section>
  );
}
