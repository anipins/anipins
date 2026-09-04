"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { openArtwork } from "./ArtCard";
import { toast } from "./Toaster";

export default function FeaturedSlider() {
  const [arts, setArts] = useState<any[]>([]);
  const [idx, setIdx] = useState(0);
  const [dir, setDir] = useState(1);

  useEffect(() => {
    fetch("/api/artworks?featured=1&limit=8").then(r => r.json()).then(d => setArts(d.items || []));
  }, []);

  useEffect(() => {
    if (arts.length < 2) return;
    const t = setInterval(() => { setDir(1); setIdx(i => (i + 1) % arts.length); }, 5200);
    return () => clearInterval(t);
  }, [arts.length]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === "INPUT") return;
      if (e.key === "ArrowLeft") { setDir(-1); setIdx(i => (i - 1 + arts.length) % arts.length); }
      if (e.key === "ArrowRight") { setDir(1); setIdx(i => (i + 1) % arts.length); }
    };
    if (arts.length > 1) window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [arts.length]);

  if (!arts.length) return <div className="skeleton mx-auto mt-8 h-[420px] max-w-[1300px] rounded-3xl" />;
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
      <div className="relative flex items-stretch gap-4 h-[380px] md:h-[480px]">
        {[prevA, nextA].map((side, i) => (
          <button key={i} onClick={() => { setDir(i === 0 ? -1 : 1); setIdx(arts.indexOf(side)); }}
            className={`hidden lg:block relative w-[12%] overflow-hidden rounded-3xl opacity-40 hover:opacity-70 transition-opacity duration-300 ${i === 0 ? "order-first" : "order-last"}`}>
            <img src={`/api/img/${side.thumb}`} alt="" className="h-full w-full object-cover" />
          </button>
        ))}
        <div className="relative flex-1 overflow-hidden rounded-3xl hairline">
          <AnimatePresence mode="popLayout" custom={dir}>
            <motion.div key={a.id} custom={dir}
              initial={{ x: dir * 80, opacity: 0, scale: 1.02 }}
              animate={{ x: 0, opacity: 1, scale: 1 }}
              exit={{ x: dir * -80, opacity: 0 }}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              drag="x" dragConstraints={{ left: 0, right: 0 }} dragElastic={0.12}
              onDragEnd={(_, info) => {
                if (info.offset.x < -70) { setDir(1); setIdx(i => (i + 1) % arts.length); }
                else if (info.offset.x > 70) { setDir(-1); setIdx(i => (i - 1 + arts.length) % arts.length); }
              }}
              className="absolute inset-0 cursor-grab active:cursor-grabbing">
              <img src={`/api/img/${a.orig}`} alt={a.character_name} className="h-full w-full object-cover" draggable={false} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
              <motion.div initial={{ y: 24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2, duration: 0.5 }}
                className="absolute inset-x-0 bottom-0 p-6 md:p-9">
                <p className="text-[11px] uppercase tracking-[0.3em] text-gold">{a.category || a.anime_name}</p>
                <h3 className="mt-1.5 font-display text-3xl md:text-5xl font-semibold">{a.character_name}</h3>
                <p className="mt-1 text-sm text-white/60">{a.anime_name}</p>
                <div className="mt-5 flex flex-wrap gap-3">
                  <button onClick={() => openArtwork(a.id)} className="btn-primary !py-2.5">View Artwork</button>
                  <a href={`/api/artworks/${a.id}/download`} onClick={() => toast("Download started")} className="btn-ghost !py-2.5 !bg-black/30 backdrop-blur">Download</a>
                </div>
              </motion.div>
            </motion.div>
          </AnimatePresence>
          <div className="absolute right-5 top-5 flex gap-2">
            <button onClick={() => { setDir(-1); setIdx(i => (i - 1 + arts.length) % arts.length); }}
              className="grid h-10 w-10 place-items-center rounded-full bg-black/40 backdrop-blur hover:bg-gold hover:text-ink transition-colors">←</button>
            <button onClick={() => { setDir(1); setIdx(i => (i + 1) % arts.length); }}
              className="grid h-10 w-10 place-items-center rounded-full bg-black/40 backdrop-blur hover:bg-gold hover:text-ink transition-colors">→</button>
          </div>
        </div>
      </div>
      <div className="mt-4 flex justify-center gap-1.5">
        {arts.map((_, i) => (
          <button key={i} onClick={() => { setDir(i > idx ? 1 : -1); setIdx(i); }}
            className={`h-1 rounded-full transition-all duration-400 ${i === idx ? "w-7 bg-gold" : "w-2.5 bg-white/20 hover:bg-white/40"}`} />
        ))}
      </div>
    </section>
  );
}
