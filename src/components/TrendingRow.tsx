"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function TrendingRow() {
  const [chars, setChars] = useState<any[]>([]);
  const [animes, setAnimes] = useState<any[]>([]);
  useEffect(() => {
    fetch("/api/meta").then(r => r.json()).then(d => { setChars((d.characters || []).slice(0, 10)); setAnimes((d.animes || []).slice(0, 8)); });
  }, []);
  if (!chars.length) return null;
  return (
    <>
      <section className="mx-auto mt-20 max-w-[1400px] px-4 md:px-8">
        <div className="mb-5 flex items-center gap-3">
          <h2 className="font-display text-2xl font-semibold md:text-3xl">Trending Characters</h2>
          <div className="h-px flex-1 bg-white/10" />
          <Link href="/characters" className="text-sm text-gold hover:text-gold-bright transition-colors">View all →</Link>
        </div>
        <div className="no-scrollbar flex gap-4 overflow-x-auto pb-2 snap-x">
          {chars.map((c, i) => (
            <motion.div key={c.slug} initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
              transition={{ duration: 0.5, delay: Math.min(i, 5) * 0.06 }} className="snap-start shrink-0">
              <Link href={`/c/${c.slug}`} className="group block w-40 md:w-48">
                <div className="relative overflow-hidden rounded-2xl hairline group-hover:border-gold-dim transition-colors aspect-[3/4]">
                  {c.cover && <img src={`/api/img/${c.cover}`} alt={c.name} loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                  <div className="absolute bottom-0 p-3.5">
                    <p className="text-sm font-medium">{c.name}</p>
                    <p className="text-[11px] text-white/55">{c.count} artworks</p>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>
      {animes.length > 0 && (
        <section className="mx-auto mt-16 max-w-[1400px] px-4 md:px-8">
          <div className="mb-5 flex items-center gap-3">
            <h2 className="font-display text-2xl font-semibold md:text-3xl">Trending Anime</h2>
            <div className="h-px flex-1 bg-white/10" />
            <Link href="/anime" className="text-sm text-gold hover:text-gold-bright transition-colors">View all →</Link>
          </div>
          <div className="no-scrollbar flex gap-4 overflow-x-auto pb-2 snap-x">
            {animes.map((a, i) => (
              <motion.div key={a.slug} initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
                transition={{ duration: 0.5, delay: Math.min(i, 5) * 0.06 }} className="snap-start shrink-0">
                <Link href={`/anime/${a.slug}`} className="group relative block h-36 w-64 overflow-hidden rounded-2xl hairline hover:border-gold-dim transition-colors">
                  {a.cover && <img src={`/api/img/${a.cover}`} alt={a.name} loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
                  <div className="absolute bottom-0 p-4">
                    <p className="font-display font-semibold">{a.name}</p>
                    <p className="text-[11px] text-white/55">{a.count} artworks · {a.characters} characters</p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
