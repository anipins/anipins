import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "About", description: "About AniPins, an independent place to discover, save and download anime artwork.", alternates: { canonical: "/about" } };

export default function AboutPage() {
  return <section className="mx-auto max-w-3xl px-6 pt-28 text-sm leading-7 text-fog md:pt-32">
    <p className="text-xs uppercase tracking-[.28em] text-gold">About AniPins</p>
    <h1 className="mt-3 font-display text-4xl font-semibold text-paper md:text-5xl">Artwork discovery, made personal.</h1>
    <p className="mt-6">AniPins is an independent discovery platform for browsing anime and manhua artwork, following favorite characters and series, and keeping private collections in sync across the website and native Android app.</p>
    <p className="mt-4">The feed is designed to feel fresh on every visit while still learning from the artwork you view, like, save and download. Artwork pages include clear source context, reporting tools and copyright removal support.</p>
    <h2 className="mt-8 font-display text-2xl font-semibold text-paper">What AniPins is built for</h2>
    <p className="mt-3">AniPins brings character discovery, themed collections, high-quality downloads and a personalized visual feed into one focused experience. Visitors can browse without an account, while signed-in users can keep profiles, follows, likes, saves and collections synchronized across devices.</p>
    <h2 className="mt-8 font-display text-2xl font-semibold text-paper">Independent and community-minded</h2>
    <p className="mt-3">AniPins is independently operated and is not an official product of any anime studio, publisher or franchise owner. Characters and source material belong to their respective rights holders. Artwork publishing is limited to authorized administrators, and every visitor can report inaccurate, inappropriate or potentially infringing content.</p>
    <h2 className="mt-8 font-display text-2xl font-semibold text-paper">Our approach</h2>
    <p className="mt-3">The goal is a fast, respectful and useful artwork library: clear character and series information, responsive mobile design, straightforward privacy controls, and a removal process for creators and rights holders. AniPins will continue improving based on user feedback and responsible curation.</p>
    <div className="mt-8 flex flex-wrap gap-3"><Link href="/explore" className="rounded-full bg-gold px-5 py-2.5 font-medium text-ink">Explore artwork</Link><Link href="/support" className="rounded-full border border-paper/15 px-5 py-2.5 text-paper">Get support</Link><Link href="/copyright" className="rounded-full border border-paper/15 px-5 py-2.5 text-paper">Copyright help</Link></div>
  </section>;
}
