"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

function Counter({ value }: { value: number }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    let raf: number; const start = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / 900);
      setN(Math.round(value * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return <>{n.toLocaleString()}</>;
}

function Spark({ seed, height = 26 }: { seed: number; height?: number }) {
  const pts = Array.from({ length: 12 }, (_, i) => {
    const v = Math.abs(Math.sin(seed * 3.7 + i * 1.3)) * 0.7 + Math.abs(Math.cos(seed + i * 0.9)) * 0.3;
    return `${(i / 11) * 100},${height - v * height * 0.85 - 2}`;
  }).join(" ");
  return (
    <svg viewBox={`0 0 100 ${height}`} className="w-full" style={{ height }} preserveAspectRatio="none">
      <polyline points={pts} fill="none" stroke="url(#sg)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <defs>
        <linearGradient id="sg" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#8F6F35" /><stop offset="1" stopColor="#E8C878" />
        </linearGradient>
      </defs>
    </svg>
  );
}

const ICONS: Record<string, JSX.Element> = {
  art: <path d="M4 5h16v14H4zM4 15l4-4 3 3 5-5 4 4" strokeLinejoin="round" />,
  chars: <><circle cx="9" cy="8" r="3.2" /><path d="M3.5 19c.7-3.2 2.8-5 5.5-5s4.8 1.8 5.5 5" /><circle cx="17" cy="9" r="2.4" /><path d="M15.5 14.4c2.3.2 4 1.7 4.6 4.6" /></>,
  anime: <><rect x="3" y="5" width="18" height="13" rx="2" /><path d="M10 9.5v4l3.6-2z" /></>,
  dl: <path d="M12 4v10m0 0 4-4m-4 4-4-4M5 19h14" strokeLinecap="round" strokeLinejoin="round" />,
  views: <><path d="M2.5 12S6 5.8 12 5.8 21.5 12 21.5 12 18 18.2 12 18.2 2.5 12 2.5 12Z" /><circle cx="12" cy="12" r="2.8" /></>,
};

export default function AdminOverview() {
  const [data, setData] = useState<any>(null);
  const [now, setNow] = useState("");
  useEffect(() => {
    fetch("/api/admin/stats").then(r => r.json()).then(setData);
    setNow(new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" }));
  }, []);
  if (!data || data.error) return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
      {Array.from({ length: 5 }).map((_, i) => <div key={i} className="skeleton h-36 rounded-2xl" />)}
    </div>
  );
  const t = data.totals;
  const stats = [
    { label: "Total Artwork", value: t.artworks, icon: "art", hint: "published & drafts" },
    { label: "Characters", value: t.characters, icon: "chars", hint: "unique characters" },
    { label: "Anime", value: t.anime, icon: "anime", hint: "series covered" },
    { label: "Downloads", value: t.downloads, icon: "dl", hint: "all-time" },
    { label: "Views", value: t.views, icon: "views", hint: "all-time" },
  ];

  return (
    <div className="space-y-12">
      {/* header */}
      <div className="relative overflow-hidden rounded-3xl border border-line bg-gradient-to-br from-panel via-panel to-[#161310] p-7 md:p-9">
        <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-gold/[0.07] blur-3xl" />
        <div className="pointer-events-none absolute right-8 top-1/2 hidden -translate-y-1/2 md:block opacity-[0.16]">
          <img src="/brand/ap-symbol-transparent.svg" alt="" className="h-36 w-36" />
        </div>
        <p className="text-[11px] uppercase tracking-[0.3em] text-gold/80">Dashboard</p>
        <h1 className="mt-2 font-display text-3xl font-semibold md:text-4xl">Welcome back<span className="text-gold">.</span></h1>
        <p className="mt-2 text-sm text-fog">{now} — here's how AniPins is doing.</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/admin/upload" className="btn-primary !py-2.5">+ Upload artwork</Link>
          <Link href="/admin/manage" className="btn-ghost !py-2.5">Manage artwork</Link>
        </div>
      </div>

      {/* stat cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {stats.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="group relative overflow-hidden rounded-2xl border border-line bg-panel p-5 transition-all duration-300 hover:-translate-y-1 hover:border-gold/40 hover:shadow-[0_18px_40px_rgba(0,0,0,0.5)]">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/60 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            <div className="flex items-start justify-between">
              <span className="grid h-9 w-9 place-items-center rounded-xl border border-gold/25 bg-gold/[0.08] text-gold">
                <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.7">{ICONS[s.icon]}</svg>
              </span>
            </div>
            <p className="mt-4 font-display text-[28px] font-semibold leading-none tracking-tight"><Counter value={s.value} /></p>
            <p className="mt-2 text-[10px] uppercase tracking-[0.18em] text-fog">{s.label}</p>
            <div className="mt-3 opacity-60 transition-opacity duration-300 group-hover:opacity-100"><Spark seed={i + 1} /></div>
            <p className="mt-1 text-[10px] text-fog/60">{s.hint}</p>
          </motion.div>
        ))}
      </div>

      {/* highlights */}
      <div className="grid gap-4 md:grid-cols-2">
        {[{ h: "Most Viewed", a: data.mostViewed, m: `${data.mostViewed?.views ?? 0} views`, ic: "views" },
          { h: "Most Downloaded", a: data.mostDownloaded, m: `${data.mostDownloaded?.downloads ?? 0} downloads`, ic: "dl" }].map(({ h, a, m, ic }, i) => (
          <motion.div key={h} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 + i * 0.1, duration: 0.45 }}
            className="group relative overflow-hidden rounded-2xl border border-line bg-panel transition-colors hover:border-gold/40">
            {a && <img src={`/api/img/${a.thumb}`} alt="" className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-[0.08] blur-[2px] transition-opacity duration-500 group-hover:opacity-[0.14]" />}
            <div className="relative p-6">
              <div className="flex items-center gap-2">
                <span className="grid h-7 w-7 place-items-center rounded-lg border border-gold/25 bg-gold/[0.08] text-gold">
                  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.7">{ICONS[ic]}</svg>
                </span>
                <p className="text-[11px] uppercase tracking-[0.25em] text-gold/80">{h}</p>
              </div>
              {a ? (
                <Link href={`/a/${a.id}`} className="mt-4 flex items-center gap-4">
                  <img src={`/api/img/${a.thumb}`} className="h-20 w-20 rounded-xl border border-line object-cover shadow-lg" alt="" />
                  <div>
                    <p className="font-display text-lg font-medium group-hover:text-gold transition-colors">{a.title || a.character_name}</p>
                    <p className="mt-0.5 text-sm text-fog">{a.character_name}</p>
                    <p className="mt-1.5 inline-flex rounded-full border border-gold/30 bg-gold/10 px-2.5 py-0.5 text-[11px] text-gold">{m}</p>
                  </div>
                </Link>
              ) : <p className="mt-4 text-sm text-fog">No data yet.</p>}
            </div>
          </motion.div>
        ))}
      </div>

      {/* recent uploads */}
      <div>
        <div className="mb-5 flex items-center gap-3">
          <h2 className="font-display text-xl font-semibold">Recently uploaded</h2>
          <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent" />
          <Link href="/admin/manage" className="text-sm text-gold hover:text-gold-bright transition-colors">Open manager →</Link>
        </div>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-8">
          {data.recent.map((a: any, i: number) => (
            <motion.div key={a.id} initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5 + i * 0.05, duration: 0.35 }}>
              <Link href={`/a/${a.id}`} className="group relative block overflow-hidden rounded-xl border border-line transition-all duration-300 hover:-translate-y-1 hover:border-gold/50 hover:shadow-[0_12px_30px_rgba(0,0,0,0.5)]">
                <img src={`/api/img/${a.thumb}`} className="aspect-square w-full object-cover transition-transform duration-500 group-hover:scale-105" alt="" />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                <p className="pointer-events-none absolute bottom-1.5 left-2 right-2 truncate text-[10px] font-medium opacity-0 transition-opacity duration-300 group-hover:opacity-100">{a.character_name}</p>
                {!a.published && <span className="absolute left-1.5 top-1.5 rounded-md border border-gold/40 bg-black/80 px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-gold">Draft</span>}
              </Link>
            </motion.div>
          ))}
        </div>
      </div>

      {/* takedowns */}
      {data.takedowns?.length > 0 && (
        <div>
          <div className="mb-5 flex items-center gap-3">
            <h2 className="font-display text-xl font-semibold">Takedown requests</h2>
            <span className="rounded-full border border-gold/30 bg-gold/10 px-2.5 py-0.5 text-xs text-gold">{data.takedowns.length}</span>
            <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent" />
          </div>
          <div className="space-y-2">
            {data.takedowns.map((td: any) => (
              <div key={td.id} className="rounded-xl border border-line bg-panel p-4 text-sm transition-colors hover:border-gold/30">
                <p className="text-fog"><span className="font-medium text-paper">{td.name || "Anonymous"}</span> · {td.email} · <span className="text-fog/60">{td.created_at}</span></p>
                {td.artwork_url && <p className="mt-1 text-fog">URL: <span className="text-gold/80">{td.artwork_url}</span></p>}
                <p className="mt-1.5">{td.reason}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
