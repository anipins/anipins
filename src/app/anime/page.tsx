"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function AnimeIndex() {
  const [animes, setAnimes] = useState<any[] | null>(null);
  useEffect(() => { fetch("/api/meta").then(r => r.json()).then(d => setAnimes(d.animes)); }, []);
  return (
    <section className="mx-auto max-w-[1400px] px-4 md:px-8 pt-28 md:pt-32">
      <h1 className="font-display text-3xl font-semibold md:text-4xl">Anime</h1>
      <p className="mt-1 mb-8 text-sm text-fog">Collections by series.</p>
      {!animes ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton h-56 rounded-2xl" />)}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {animes.map((a, i) => (
            <motion.div key={a.slug} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              transition={{ duration: 0.5, delay: (i % 3) * 0.07 }}>
              <Link href={`/anime/${a.slug}`} className="group relative block h-60 overflow-hidden rounded-2xl hairline">
                {a.cover && <img src={`/api/img/${a.cover}`} alt={a.name} loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
                <div className="absolute bottom-0 p-5">
                  <p className="font-display text-xl font-semibold">{a.name}</p>
                  <p className="mt-0.5 text-xs text-white/60">{a.count} artworks · {a.characters} characters</p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </section>
  );
}
