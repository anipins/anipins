"use client";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import SaveMenu from "./SaveMenu";
import ShareMenu from "./ShareMenu";
import Tilt from "./Tilt";
import { toast } from "./Toaster";

export function openArtwork(id: number) {
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("anipins:open-art", { detail: { id } }));
}

export default function ArtCard({ art, index = 0 }: { art: any; index?: number }) {
  const [save, setSave] = useState(false);
  const [share, setShare] = useState(false);
  const [imageReady, setImageReady] = useState(false);
  const ratio = art.width && art.height ? art.height / art.width : 1.3;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "80px" }}
        transition={{ duration: 0.5, delay: Math.min(index % 8, 5) * 0.05, ease: [0.22, 1, 0.36, 1] }}
      >
        <Tilt max={3.5} className="group relative overflow-hidden rounded-2xl bg-soft hairline hover:border-gold-dim transition-colors duration-300">
          <button onClick={() => openArtwork(art.id)} className="block w-full text-left cursor-zoom-in">
            <div style={{ aspectRatio: `1 / ${ratio}` }} className={`relative w-full overflow-hidden bg-soft ${imageReady ? "" : "skeleton"}`}>
              <Image
                src={`/api/img/${art.thumb}`}
                alt={art.title || art.character_name}
                fill
                sizes="(max-width: 639px) 50vw, (max-width: 1023px) 33vw, (max-width: 1439px) 25vw, 20vw"
                priority={index < 4}
                onLoad={() => setImageReady(true)}
                className={`object-cover transition-[opacity,transform] duration-500 ease-out group-hover:scale-[1.04] ${imageReady ? "opacity-100" : "opacity-0"}`}
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
              <a href={`/api/artworks/${art.id}/download`} onClick={() => toast("Download started")} title="Download" className="grid h-8 w-8 place-items-center rounded-full bg-white/15 backdrop-blur hover:bg-gold hover:text-ink transition-colors">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 4v11m0 0 4-4m-4 4-4-4M5 20h14"/></svg>
              </a>
              <button onClick={() => setShare(true)} title="Share" className="grid h-8 w-8 place-items-center rounded-full bg-white/15 backdrop-blur hover:bg-gold hover:text-ink transition-colors">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="6" cy="12" r="2.4"/><circle cx="18" cy="6" r="2.4"/><circle cx="18" cy="18" r="2.4"/><path d="m8.2 10.9 7.6-3.8m-7.6 6 7.6 3.8"/></svg>
              </button>
              <Link href={`/a/${art.id}`} title="Open full page" className="ml-auto grid h-8 w-8 place-items-center rounded-full bg-gold text-ink hover:bg-gold-bright transition-colors">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M7 17 17 7m0 0H9m8 0v8"/></svg>
              </Link>
            </div>
          </div>
        </Tilt>
      </motion.div>
      <AnimatePresence>
        {save && <SaveMenu artworkId={art.id} onClose={() => setSave(false)} />}
        {share && <ShareMenu url={typeof location !== "undefined" ? `${location.origin}/a/${art.id}` : `/a/${art.id}`} title={art.character_name} onClose={() => setShare(false)} />}
      </AnimatePresence>
    </>
  );
}
