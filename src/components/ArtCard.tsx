"use client";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useRef, useState } from "react";
import SaveMenu from "./SaveMenu";
import ShareMenu from "./ShareMenu";
import Tilt from "./Tilt";
import { toast } from "./Toaster";
import { artworkAlt } from "@/lib/site";
import ReportArtwork from "./ReportArtwork";
import DownloadButton from "./DownloadButton";

export function openArtwork(id: number, art?: any) {
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("anipins:open-art", { detail: { id, art } }));
}

export default function ArtCard({ art, index = 0, priority }: { art: any; index?: number; priority?: boolean }) {
  const [save, setSave] = useState(false);
  const [share, setShare] = useState(false);
  const [imageReady, setImageReady] = useState(false);
  const reduceMotion = useReducedMotion();
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const suppressOpen = useRef(false);
  const ratio = art.width && art.height ? art.height / art.width : 1.3;
  // A landscape image in a two-column phone masonry grid can become a tiny
  // strip. Premium cards must retain a comfortable tap target instead.
  const premiumLandscape = Boolean(art.premium) && ratio < 0.9;
  const hideArtwork = async () => {
    window.dispatchEvent(new CustomEvent("anipins:hide-art", { detail: { id: art.id } }));
    try { await fetch("/api/hides", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ artworkId: art.id }) }); } catch {}
    toast("We’ll show fewer artworks like this");
  };

  return (
    <>
      <motion.div
        className={`art-card ${premiumLandscape ? "art-card--premium-landscape" : ""}`}
        initial={reduceMotion ? false : { opacity: 0, y: 18 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.14 }}
        transition={{ duration: 0.38, delay: reduceMotion ? 0 : (index % 8) * 0.025, ease: [0.22, 1, 0.36, 1] }}
      >
        <Tilt max={3.5} className="group relative overflow-hidden rounded-2xl bg-soft hairline hover:border-gold-dim transition-colors duration-200">
          <button
            onTouchStart={event => {
              const touch = event.touches[0];
              touchStart.current = { x: touch.clientX, y: touch.clientY };
              suppressOpen.current = false;
            }}
            onTouchMove={event => {
              const start = touchStart.current;
              const touch = event.touches[0];
              if (start && Math.hypot(touch.clientX - start.x, touch.clientY - start.y) > 12) suppressOpen.current = true;
            }}
            onTouchEnd={() => {
              touchStart.current = null;
              if (suppressOpen.current) window.setTimeout(() => { suppressOpen.current = false; }, 250);
            }}
            onTouchCancel={() => { touchStart.current = null; suppressOpen.current = false; }}
            onClick={() => { if (!suppressOpen.current) openArtwork(art.id, art); }}
            className="block w-full touch-pan-y text-left cursor-zoom-in">
            <div style={{ aspectRatio: `1 / ${ratio}`, minHeight: premiumLandscape ? "clamp(180px, 44vw, 360px)" : undefined }} className={`relative w-full overflow-hidden bg-soft ${imageReady ? "" : "skeleton"}`}>
              <Image
                src={art.thumb_url || `/api/img/${art.thumb}`}
                alt={artworkAlt(art)}
                fill
                sizes="(max-width: 639px) 50vw, (max-width: 1023px) 33vw, (max-width: 1439px) 25vw, 20vw"
                priority={priority ?? index < 2}
                loading={priority ?? index < 2 ? "eager" : "lazy"}
                onLoad={() => setImageReady(true)}
                className={`object-cover transition-opacity duration-200 group-hover:scale-[1.025] ${imageReady ? "opacity-100" : "opacity-0"}`}
              />
            </div>
          </button>
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          <div className="absolute inset-x-0 bottom-0 translate-y-2 p-3.5 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
            <p className="text-sm font-medium leading-tight">{art.character_name}</p>
            <p className="text-xs text-white/60">{art.anime_name}</p>
            <div className="mt-2.5 flex items-center gap-1.5 pointer-events-auto">
              <button onClick={() => setSave(true)} title="Save" className="grid h-8 w-8 place-items-center rounded-full bg-white/15 backdrop-blur hover:bg-gold hover:text-ink transition-colors">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M6 4h12v17l-6-4.5L6 21z" strokeLinejoin="round"/></svg>
              </button>
              <DownloadButton artworkId={art.id} className="grid h-8 w-8 place-items-center rounded-full bg-white/15 text-[0] backdrop-blur hover:bg-gold hover:text-ink transition-colors" />
              <button onClick={() => setShare(true)} title="Share" className="grid h-8 w-8 place-items-center rounded-full bg-white/15 backdrop-blur hover:bg-gold hover:text-ink transition-colors">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="6" cy="12" r="2.4"/><circle cx="18" cy="6" r="2.4"/><circle cx="18" cy="18" r="2.4"/><path d="m8.2 10.9 7.6-3.8m-7.6 6 7.6 3.8"/></svg>
              </button>
              <Link href={`/visual-search?artworkId=${art.id}`} title="Find visually similar artwork" className="grid h-8 w-8 place-items-center rounded-full bg-white/15 backdrop-blur hover:bg-gold hover:text-ink transition-colors">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 3v3m0 12v3M3 12h3m12 0h3M6.3 6.3l2.1 2.1m7.2 7.2 2.1 2.1m0-11.4-2.1 2.1m-7.2 7.2-2.1 2.1"/><circle cx="12" cy="12" r="3"/></svg>
              </Link>
              <button onClick={hideArtwork} title="Not interested" className="grid h-8 w-8 place-items-center rounded-full bg-white/15 backdrop-blur hover:bg-red-500/80 transition-colors">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M5 5l14 14M19 5 5 19"/></svg>
              </button>
              <Link href={`/a/${art.id}`} title="Open full page" className="ml-auto grid h-8 w-8 place-items-center rounded-full bg-gold text-ink hover:bg-gold-bright transition-colors">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M7 17 17 7m0 0H9m8 0v8"/></svg>
              </Link>
            </div>
          </div>
          <div className="absolute right-3 top-3 hidden rounded-full bg-black/65 px-2.5 py-1.5 backdrop-blur group-hover:block pointer-events-auto"><ReportArtwork artworkId={art.id} compact /></div>
        </Tilt>
      </motion.div>
      <AnimatePresence>
        {save && <SaveMenu artworkId={art.id} onClose={() => setSave(false)} />}
        {share && <ShareMenu url={typeof location !== "undefined" ? `${location.origin}/a/${art.id}` : `/a/${art.id}`} title={art.character_name} onClose={() => setShare(false)} />}
      </AnimatePresence>
    </>
  );
}
