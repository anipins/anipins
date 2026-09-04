"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";

export default function Hero() {
  const [arts, setArts] = useState<any[]>([]);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    fetch("/api/artworks?featured=1&limit=8").then(r => r.json()).then(d => setArts(d.items || []));
  }, []);

  useEffect(() => {
    if (arts.length < 2) return;
    const t = setInterval(() => setIdx(i => (i + 1) % arts.length), 4200);
    return () => clearInterval(t);
  }, [arts.length]);

  const stack = arts.length ? [0, 1, 2].map(o => arts[(idx + o) % arts.length]).filter(Boolean) : [];

  return (
    <section className="relative overflow-hidden pt-32 pb-16 md:pt-40 md:pb-24">
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[500px] w-[900px] -translate-x-1/2 rounded-full bg-white/[0.035] blur-3xl" />
      <div className="mx-auto grid max-w-[1400px] items-center gap-14 px-6 md:grid-cols-2 md:px-10">
        <div>
          <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.6 }}
            className="text-[12px] uppercase tracking-[0.3em] text-fog">Anime artwork curated for inspiration</motion.p>
          <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="mt-4 font-display text-6xl font-semibold tracking-tight md:text-8xl">
            Ani<span className="text-fog">Pins</span>
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.32, duration: 0.6 }}
            className="mt-4 font-display text-xl text-paper/80 md:text-2xl">Discover. Save. Create.</motion.p>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.44, duration: 0.6 }}
            className="mt-8 flex flex-wrap gap-3">
            <Link href="/explore" className="btn-primary">Explore Artwork</Link>
            <Link href="/characters" className="btn-ghost">Browse Characters</Link>
          </motion.div>
        </div>

        <div className="relative mx-auto h-[420px] w-full max-w-[360px] md:h-[520px]">
          <AnimatePresence mode="popLayout">
            {stack.map((a, i) => (
              <motion.div
                key={`${a.id}-${i === 0 ? idx : "b" + i}`}
                initial={i === 0 ? { opacity: 0, x: 60, rotate: 4, scale: 0.96 } : false}
                animate={{
                  opacity: 1 - i * 0.28, x: i * 26, y: i * -14, rotate: i * 3.5,
                  scale: 1 - i * 0.06, zIndex: 10 - i,
                  transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
                }}
                exit={{ opacity: 0, x: -70, rotate: -5, transition: { duration: 0.5 } }}
                className="absolute inset-0 overflow-hidden rounded-3xl hairline shadow-[0_30px_80px_rgba(0,0,0,0.55)]"
              >
                <img src={`/api/img/${a.thumb}`} alt={a.character_name} className="h-full w-full object-cover" />
                {i === 0 && (
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent p-5">
                    <p className="font-medium">{a.character_name}</p>
                    <p className="text-sm text-white/60">{a.anime_name}</p>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
          {arts.length > 1 && (
            <div className="absolute -bottom-9 left-1/2 flex -translate-x-1/2 gap-1.5">
              {arts.map((_, i) => (
                <button key={i} onClick={() => setIdx(i)}
                  className={`h-1 rounded-full transition-all duration-400 ${i === idx ? "w-6 bg-paper" : "w-2.5 bg-white/25 hover:bg-white/50"}`} />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
