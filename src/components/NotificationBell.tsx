"use client";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

declare global { interface Window { AniPinsAndroid?: { showNotification?: (title: string, body: string, url: string) => void } } }

export default function NotificationBell() {
  const [data, setData] = useState<any>({ notifications: [], unread: 0, guest: true });
  const [open, setOpen] = useState(false);
  const seen = useRef<number | null>(null);
  const load = useCallback(async () => {
    const r = await fetch("/api/notifications?limit=10", { cache: "no-store" });
    if (!r.ok) return;
    const next = await r.json();
    const newest = next.notifications?.find((n: any) => !n.read_at);
    if (newest && seen.current !== null && newest.id > seen.current && window.AniPinsAndroid?.showNotification) {
      window.AniPinsAndroid.showNotification(newest.title, newest.body, `/a/${newest.artwork_id}`);
    }
    if (next.notifications?.[0]) seen.current = Math.max(seen.current || 0, next.notifications[0].id);
    setData(next);
  }, []);
  useEffect(() => {
    load();
    const timer = window.setInterval(() => { if (document.visibilityState === "visible") load(); }, 60_000);
    return () => window.clearInterval(timer);
  }, [load]);
  if (data.guest) return null;
  const markAll = async () => { await fetch("/api/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ all: true }) }); load(); };
  return <div className="relative">
    <button type="button" onClick={() => setOpen(v => !v)} className="relative rounded-full p-2.5 text-fog hover:bg-paper/5 hover:text-gold" aria-label={`${data.unread} unread notifications`}>
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/></svg>
      {data.unread > 0 && <span className="absolute right-0 top-0 grid h-5 min-w-5 place-items-center rounded-full bg-gold px-1 text-[10px] font-bold text-ink">{Math.min(99, data.unread)}</span>}
    </button>
    {open && <div className="absolute right-0 top-full mt-2 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-2xl glass hairline shadow-2xl">
      <div className="flex items-center justify-between border-b border-paper/10 px-4 py-3"><strong className="text-sm">Notifications</strong>{data.unread > 0 && <button onClick={markAll} className="text-xs text-gold">Mark all read</button>}</div>
      <div className="max-h-96 overflow-y-auto">
        {data.notifications.length ? data.notifications.map((n: any) => <Link key={n.id} href={`/a/${n.artwork_id}`} onClick={async () => { setOpen(false); await fetch("/api/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: n.id }) }); }} className={`flex gap-3 border-b border-paper/5 p-3 hover:bg-paper/5 ${n.read_at ? "opacity-60" : ""}`}>
          <img src={`/api/img/${n.thumb}`} alt="" className="h-14 w-11 rounded-lg object-cover" />
          <span><span className="block text-sm font-medium">{n.title}</span><span className="mt-1 block text-xs text-fog">{n.body}</span></span>
        </Link>) : <p className="p-6 text-center text-sm text-fog">Follow a character or series to get alerts here.</p>}
      </div>
    </div>}
  </div>;
}
