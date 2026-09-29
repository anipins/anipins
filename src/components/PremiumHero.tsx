import Image from "next/image";
import Link from "next/link";

export default function PremiumHero() {
  return (
    <section aria-labelledby="anipins-hero-title" className="relative mx-auto mt-2 h-[300px] max-w-[1400px] overflow-hidden rounded-3xl border border-gold/20 bg-black px-6 sm:h-[340px] sm:px-9 md:h-[390px] md:px-12">
      <Image src="/brand/anipins-flow-hero-v2.webp" alt="" fill priority sizes="(max-width: 768px) 100vw, 1400px" className="object-cover object-center" aria-hidden="true" />
      <div className="absolute inset-0 bg-gradient-to-r from-black via-black/84 to-black/10" />
      <div className="relative z-10 flex h-full max-w-xl flex-col justify-center">
        <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-gold sm:text-xs">AniPins reference library</p>
        <h1 id="anipins-hero-title" className="mt-3 font-display text-3xl font-semibold leading-[1.05] text-paper sm:text-4xl md:text-5xl">Find the frame that starts your next sketch.</h1>
        <p className="mt-4 max-w-md text-sm leading-6 text-paper/70 md:text-base">Curated anime artwork references for character study, drawing practice and creative inspiration.</p>
        <div className="mt-6"><Link href="/explore" className="btn-primary">Explore references <span aria-hidden="true">→</span></Link></div>
      </div>
    </section>
  );
}
