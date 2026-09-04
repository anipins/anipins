"use client";
import { useEffect, useState } from "react";

function Bars({ items, field }: { items: any[]; field: string }) {
  const max = Math.max(1, ...items.map(i => i[field]));
  return (
    <div className="space-y-2.5">
      {items.map(i => (
        <div key={i.label} className="flex items-center gap-3 text-sm">
          <span className="w-36 truncate text-fog">{i.label}</span>
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-soft">
            <div className="h-full rounded-full bg-gradient-to-r from-gold-deep to-gold transition-all duration-700" style={{ width: `${(i[field] / max) * 100}%` }} />
          </div>
          <span className="w-14 text-right tabular-nums text-paper">{i[field]}</span>
        </div>
      ))}
    </div>
  );
}

export default function Analytics() {
  const [data, setData] = useState<any>(null);
  useEffect(() => {
    Promise.all([
      fetch("/api/admin/artworks?sort=views").then(r => r.json()),
      fetch("/api/meta").then(r => r.json()),
    ]).then(([arts, meta]) => setData({ arts: arts.items || [], meta }));
  }, []);
  if (!data) return <div className="text-fog">Loading analytics…</div>;

  const topViews = data.arts.slice(0, 8).map((a: any) => ({ label: a.title || a.character_name, views: a.views, downloads: a.downloads }));
  const topDl = [...data.arts].sort((a: any, b: any) => b.downloads - a.downloads).slice(0, 8).map((a: any) => ({ label: a.title || a.character_name, views: a.views, downloads: a.downloads }));
  const chars = (data.meta.characters || []).slice(0, 8).map((c: any) => ({ label: c.name, count: c.count }));
  const animes = (data.meta.animes || []).slice(0, 8).map((a: any) => ({ label: a.name, count: a.count }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-semibold md:text-3xl">Analytics</h1>
        <p className="mt-1 text-sm text-fog">Real engagement data from the AniPins database.</p>
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-2xl bg-panel border border-line p-6">
          <p className="mb-5 text-[11px] uppercase tracking-widest text-gold/80">Most viewed artwork</p>
          <Bars items={topViews} field="views" />
        </div>
        <div className="rounded-2xl bg-panel border border-line p-6">
          <p className="mb-5 text-[11px] uppercase tracking-widest text-gold/80">Most downloaded artwork</p>
          <Bars items={topDl} field="downloads" />
        </div>
        <div className="rounded-2xl bg-panel border border-line p-6">
          <p className="mb-5 text-[11px] uppercase tracking-widest text-gold/80">Popular characters (artwork count)</p>
          <Bars items={chars} field="count" />
        </div>
        <div className="rounded-2xl bg-panel border border-line p-6">
          <p className="mb-5 text-[11px] uppercase tracking-widest text-gold/80">Popular anime (artwork count)</p>
          <Bars items={animes} field="count" />
        </div>
      </div>
    </div>
  );
}
