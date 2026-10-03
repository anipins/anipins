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
      fetch("/api/admin/downloads").then(r => r.json()),
    ]).then(([arts, meta, downloadHistory]) => setData({ arts: arts.items || [], meta, downloads: downloadHistory.downloads || [] }));
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
      <div className="rounded-2xl border border-line bg-panel p-6">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div><p className="text-[11px] uppercase tracking-widest text-gold/80">Signed-in download history</p><p className="mt-1 text-sm text-fog">Only you can see which member downloaded each artwork.</p></div>
          <span className="text-xs text-fog">Latest 100 records</span>
        </div>
        {data.downloads.length ? <div className="mt-5 overflow-x-auto"><table className="w-full min-w-[650px] text-left text-sm"><thead className="border-b border-line text-[10px] uppercase tracking-widest text-fog"><tr><th className="pb-3 font-medium">Member</th><th className="pb-3 font-medium">Artwork</th><th className="pb-3 font-medium text-right">Downloads</th><th className="pb-3 pl-5 font-medium">Last downloaded</th></tr></thead><tbody>{data.downloads.map((item: any) => <tr key={`${item.user_id}-${item.artwork_id}`} className="border-b border-line/60 last:border-0"><td className="py-3 pr-4"><p className="text-paper">{item.name || "Member"}</p><p className="max-w-[220px] truncate text-xs text-fog">{item.email}</p></td><td className="py-3 pr-4"><p>{item.title || item.character_name}</p><p className="text-xs text-fog">{item.anime_name}</p></td><td className="py-3 text-right tabular-nums text-gold">{item.download_count}</td><td className="py-3 pl-5 text-xs text-fog">{new Date(item.updated_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</td></tr>)}</tbody></table></div> : <p className="mt-5 text-sm text-fog">No signed-in downloads yet. Future downloads will appear here.</p>}
      </div>
    </div>
  );
}
