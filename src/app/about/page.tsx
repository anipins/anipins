import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "About", description: "About AniPins, an independent place to discover, save and download anime artwork.", alternates: { canonical: "/about" } };

export default function AboutPage() {
  return <section className="mx-auto max-w-3xl px-6 pt-28 text-sm leading-7 text-fog md:pt-32">
    <p className="text-xs uppercase tracking-[.28em] text-gold">About AniPins</p>
    <h1 className="mt-3 font-display text-4xl font-semibold text-paper md:text-5xl">Artwork discovery, made personal.</h1>
    <p className="mt-6">AniPins is an independent discovery platform for browsing anime and manhua artwork, following favorite characters and series, and keeping private collections in sync across the website and native Android app.</p>
    <p className="mt-4">The feed is designed to feel fresh on every visit while still learning from the artwork you view, like, save and download. Artwork pages include clear source context, reporting tools and copyright removal support.</p>
    <div className="mt-8 flex flex-wrap gap-3"><Link href="/explore" className="rounded-full bg-gold px-5 py-2.5 font-medium text-ink">Explore artwork</Link><Link href="/support" className="rounded-full border border-paper/15 px-5 py-2.5 text-paper">Get support</Link></div>
  </section>;
}
