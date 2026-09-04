"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import ArtCard from "./ArtCard";

export default function MasonryFeed({ query = {} }: { query?: Record<string, string> }) {
  const [items, setItems] = useState<any[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [initial, setInitial] = useState(true);
  const sentinel = useRef<HTMLDivElement>(null);
  const key = JSON.stringify(query);

  useEffect(() => { setItems([]); setPage(0); setHasMore(true); setInitial(true); }, [key]);

  const load = useCallback(async (p: number, reset: boolean) => {
    setLoading(true);
    const sp = new URLSearchParams({ ...query, page: String(p), limit: "20" });
    const r = await fetch(`/api/artworks?${sp}`);
    const d = await r.json();
    setItems(prev => reset ? d.items : [...prev, ...d.items]);
    setHasMore(d.hasMore);
    setLoading(false);
    setInitial(false);
  }, [key]);

  useEffect(() => { load(0, true); }, [key]);

  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const obs = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore && !loading && !initial) {
        const next = page + 1;
        setPage(next);
        load(next, false);
      }
    }, { rootMargin: "600px" });
    obs.observe(el);
    return () => obs.disconnect();
  }, [hasMore, loading, page, initial, load]);

  return (
    <div>
      {initial ? (
        <div className="masonry">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="skeleton rounded-2xl" style={{ height: 180 + ((i * 97) % 220) }} />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="py-24 text-center text-fog">No artwork found.</div>
      ) : (
        <div className="masonry">
          {items.map((a, i) => <ArtCard key={a.id} art={a} index={i} />)}
        </div>
      )}
      <div ref={sentinel} className="h-8" />
      {loading && !initial && <div className="py-6 text-center text-sm text-fog">Loading more…</div>}
    </div>
  );
}
