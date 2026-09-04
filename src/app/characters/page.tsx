"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function Characters() {
  const [chars, setChars] = useState<any[] | null>(null);
  useEffect(() => { fetch("/api/meta").then(r => r.json()).then(d => setChars(d.characters)); }, []);
  return (
    <section className="mx-auto max-w-[1400px] px-4 md:px-8 pt-28 md:pt-32">
      <h1 className="font-display text-3xl font-semibold md:text-4xl">Characters</h1>
      <p className="mt-1 mb-8 text-sm text-fog">Every character with artwork on AniPins.</p>
      {!chars ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => <div key={i} className="skeleton h-64 rounded-2xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {chars.map((c, i) => (
            <motion.div key={c.slug} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              transition={{ duration: 0.5, delay: (i % 4) * 0.06 }}>
              <Link href={`/c/${c.slug}`} className="group block overflow-hidden rounded-2xl bg-soft hairline">
                <div className="aspect-[4/5] overflow-hidden">
                  {c.cover && <img src={`/api/img/${c.cover}`} alt={c.name} loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />}
                </div>
                <div className="p-4">
                  <p className="font-medium">{c.name}</p>
                  <p className="mt-0.5 text-xs text-fog">{c.anime} · {c.count} artwork{c.count > 1 ? "s" : ""}</p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </section>
  );
}
