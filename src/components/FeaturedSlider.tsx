"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { openArtwork } from "./ArtCard";
import { artworkAlt } from "@/lib/site";
import DownloadButton from "./DownloadButton";

function FeaturedImage({ art, priority = false, sizes }: { art: any; priority?: boolean; sizes: string }) {
  const [sharpReady, setSharpReady] = useState(false);
  const previewSrc = art.thumb_url || `/api/img/${art.thumb}`;
  // Paint the cacheable preview immediately, then fade in a sharp source for
  // public featured artwork. This replaces the old duplicate blurred image,
  // which was expensive to decode while scrolling on phones.
  const sharpSrc = !art.premium && (art.orig_url || (art.orig ? `/api/img/${art.orig}` : ""));

  return (
    <div className="absolute inset-0 overflow-hidden bg-[radial-gradient(circle_at_50%_20%,rgba(198,161,91,0.18),transparent_48%),#080808]">
      <Image
        src={previewSrc}
        alt={artworkAlt(art)}
        fill
        sizes={sizes}
        priority={priority}
        loading={priority ? "eager" : "lazy"}
        className={`object-contain transition-opacity duration-300 ${sharpReady ? "opacity-0" : "opacity-100"}`}
      />
      {sharpSrc && <Image
        src={sharpSrc}
        alt=""
        aria-hidden="true"
        fill
        sizes={sizes}
        quality={82}
        loading={priority ? "eager" : "lazy"}
        onLoad={() => setSharpReady(true)}
        className={`object-contain transition-opacity duration-300 ${sharpReady ? "opacity-100" : "opacity-0"}`}
      />}
    </div>
  );
}

export default function FeaturedSlider({ initialArts = [], premium = false }: { initialArts?: any[]; premium?: boolean }) {
  const [arts, setArts] = useState<any[]>(initialArts);
  const [idx, setIdx] = useState(0);
  const [dir, setDir] = useState(1);

  useEffect(() => {
    if (initialArts.length === 0) {
      const params = new URLSearchParams({ featured: "1", limit: "8" });
      if (premium) params.set("premium", "1");
      fetch(`/api/artworks?${params}`, { cache: "no-store" }).then(r => r.ok ? r.json() : null).then(d => setArts(d?.items || []));
    }
  }, [initialArts.length, premium]);

  // A refresh must settle on one featured artwork. Auto-advancing here made
  // the first few seconds of an Android WebView refresh look like repeated
  // page reloads, particularly while images were still decoding. Visitors can
  // still use the arrows, side previews, dots, and keyboard to browse.

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === "INPUT") return;
      if (e.key === "ArrowLeft") { setDir(-1); setIdx(i => (i - 1 + arts.length) % arts.length); }
      if (e.key === "ArrowRight") { setDir(1); setIdx(i => (i + 1) % arts.length); }
    };
    if (arts.length > 1) window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [arts.length]);

  if (!arts.length) {
    if (premium) return <section className="mx-auto max-w-[1400px] px-4 md:px-8"><div className="rounded-3xl border border-gold/25 bg-panel px-6 py-16 text-center"><p className="font-display text-2xl text-paper">Your Premium featured carousel is ready.</p><p className="mt-2 text-sm text-fog">Featured Premium uploads will appear here—public artwork never will.</p></div></section>;
    return <div className="skeleton mx-auto mt-8 h-[420px] max-w-[1300px] rounded-3xl" />;
  }
  const a = arts[idx];
  const prevA = arts[(idx - 1 + arts.length) % arts.length];
  const nextA = arts[(idx + 1) % arts.length];

  return (
    <section className="mx-auto max-w-[1400px] px-4 md:px-8">
      <div className="mb-4 flex items-center gap-3">
        <span className="badge-gold">Featured</span>
        <div className="h-px flex-1 bg-white/10" />
        <span className="font-display text-sm text-fog tabular-nums">{String(idx + 1).padStart(2, "0")} / {String(arts.length).padStart(2, "0")}</span>
      </div>
      <div className="relative flex h-[390px] items-stretch gap-4 sm:h-[430px] md:h-[500px] lg:h-[540px]">
        {[prevA, nextA].map((side, i) => (
          <button key={i} onClick={() => { setDir(i === 0 ? -1 : 1); setIdx(arts.indexOf(side)); }}
            className={`hidden lg:block relative w-[12%] overflow-hidden rounded-3xl opacity-40 hover:opacity-70 transition-opacity duration-300 ${i === 0 ? "order-first" : "order-last"}`}>
            <Image src={side.thumb_url || `/api/img/${side.thumb}`} alt="" fill sizes="12vw" loading="lazy" className="object-cover" />
          </button>
        ))}
        <div className="relative flex-1 overflow-hidden rounded-3xl hairline">
          <AnimatePresence mode="popLayout" custom={dir}>
            <motion.div key={a.id} custom={dir}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.28, ease: "easeOut" }}
              className="absolute inset-0">
              <FeaturedImage art={a} priority sizes="(max-width: 1023px) 100vw, 76vw" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
              <motion.div initial={{ y: 14, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.12, duration: 0.32 }}
                className="absolute inset-x-0 bottom-0 p-6 md:p-9">
                <p className="text-[11px] uppercase tracking-[0.3em] text-gold">{a.category || a.anime_name}</p>
                <h3 className="mt-1.5 font-display text-3xl md:text-5xl font-semibold">{a.character_name}</h3>
                <p className="mt-1 text-sm text-white/60">{a.anime_name}</p>
                <div className="mt-5 flex flex-wrap gap-3">
                  <button onClick={() => openArtwork(a.id)} className="btn-primary !py-2.5">View Artwork</button>
                  <DownloadButton artworkId={a.id} className="btn-ghost !py-2.5 !bg-black/30 backdrop-blur" />
                </div>
              </motion.div>
            </motion.div>
          </AnimatePresence>
          <div className="absolute right-5 top-5 flex gap-2">
            <button onClick={() => { setDir(-1); setIdx(i => (i - 1 + arts.length) % arts.length); }}
              aria-label="Previous featured artwork"
              className="grid h-10 w-10 place-items-center rounded-full bg-black/40 backdrop-blur hover:bg-gold hover:text-ink transition-colors">←</button>
            <button onClick={() => { setDir(1); setIdx(i => (i + 1) % arts.length); }}
              aria-label="Next featured artwork"
              className="grid h-10 w-10 place-items-center rounded-full bg-black/40 backdrop-blur hover:bg-gold hover:text-ink transition-colors">→</button>
          </div>
        </div>
      </div>
      <div className="mt-4 flex justify-center gap-1.5">
        {arts.map((_, i) => (
          <button key={i} onClick={() => { setDir(i > idx ? 1 : -1); setIdx(i); }}
            aria-label={`Show featured artwork ${i + 1}`}
            className={`h-1 rounded-full transition-all duration-400 ${i === idx ? "w-7 bg-gold" : "w-2.5 bg-white/20 hover:bg-white/40"}`} />
        ))}
      </div>
    </section>
  );
}
