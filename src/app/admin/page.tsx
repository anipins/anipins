"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

function Counter({ value }: { value: number }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    let raf: number; const start = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / 800);
      setN(Math.round(value * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return <>{n.toLocaleString()}</>;
}

export default function AdminOverview() {
  const [data, setData] = useState<any>(null);
  useEffect(() => { fetch("/api/admin/stats").then(r => r.json()).then(setData); }, []);
  if (!data || data.error) return <div className="text-fog">Loading stats…</div>;
  const t = data.totals;
  const stats = [
    { label: "Total Artwork", value: t.artworks },
    { label: "Characters", value: t.characters },
    { label: "Anime", value: t.anime },
    { label: "Downloads", value: t.downloads },
    { label: "Views", value: t.views },
  ];
  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-display text-2xl font-semibold md:text-3xl">Overview</h1>
        <p className="mt-1 text-sm text-fog">AniPins at a glance.</p>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {stats.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06, duration: 0.4 }}
            className="rounded-2xl bg-panel p-5 border border-line hover:border-gold-dim transition-colors">
            <p className="font-display text-3xl font-semibold text-paper"><Counter value={s.value} /></p>
            <p className="mt-1.5 text-[11px] uppercase tracking-widest text-fog">{s.label}</p>
            <div className="mt-3 h-px w-8 bg-gold/50" />
          </motion.div>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {[{ h: "Most Viewed", a: data.mostViewed, m: `${data.mostViewed?.views ?? 0} views` },
          { h: "Most Downloaded", a: data.mostDownloaded, m: `${data.mostDownloaded?.downloads ?? 0} downloads` }].map(({ h, a, m }) => (
          <div key={h} className="rounded-2xl bg-panel border border-line p-5">
            <p className="text-[11px] uppercase tracking-widest text-gold/80">{h}</p>
            {a ? (
              <Link href={`/a/${a.id}`} className="mt-3 flex items-center gap-4 group">
                <img src={`/api/img/${a.thumb}`} className="h-16 w-16 rounded-xl object-cover" alt="" />
                <div>
                  <p className="font-medium group-hover:text-gold transition-colors">{a.title || a.character_name}</p>
                  <p className="text-sm text-fog">{m}</p>
                </div>
              </Link>
            ) : <p className="mt-3 text-sm text-fog">No data yet.</p>}
          </div>
        ))}
      </div>

      <div>
        <h2 className="font-display text-xl font-semibold">Recently uploaded</h2>
        <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-8">
          {data.recent.map((a: any) => (
            <Link key={a.id} href={`/a/${a.id}`} className="group relative overflow-hidden rounded-xl border border-line hover:border-gold-dim transition-colors">
              <img src={`/api/img/${a.thumb}`} className="aspect-square w-full object-cover transition-transform duration-500 group-hover:scale-105" alt="" />
              {!a.published && <span className="absolute left-1.5 top-1.5 rounded bg-black/70 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-gold">Draft</span>}
            </Link>
          ))}
        </div>
      </div>

      {data.takedowns?.length > 0 && (
        <div>
          <h2 className="font-display text-xl font-semibold">Takedown requests</h2>
          <div className="mt-4 space-y-2">
            {data.takedowns.map((td: any) => (
              <div key={td.id} className="rounded-xl bg-panel border border-line p-4 text-sm">
                <p className="text-fog"><span className="text-paper">{td.name || "Anonymous"}</span> · {td.email} · {td.created_at}</p>
                {td.artwork_url && <p className="mt-1 text-fog">URL: {td.artwork_url}</p>}
                <p className="mt-1">{td.reason}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
