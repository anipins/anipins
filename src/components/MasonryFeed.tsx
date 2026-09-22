"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import ArtCard from "./ArtCard";

function createFeedSeed() {
  return Math.floor(Math.random() * 2_147_483_646) + 1;
}

export default function MasonryFeed({ query = {}, randomize = false, initialItems = [], initialHasMore = true }: { query?: Record<string, string>; randomize?: boolean; initialItems?: any[]; initialHasMore?: boolean }) {
  const [items, setItems] = useState<any[]>(initialItems);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loading, setLoading] = useState(false);
  const [initial, setInitial] = useState(initialItems.length === 0);
  const sentinel = useRef<HTMLDivElement>(null);
  const randomSeed = useRef(createFeedSeed());
  const key = JSON.stringify(query);

  const load = useCallback(async (p: number, reset: boolean, forceFresh = false) => {
    setLoading(true);
    const sp = new URLSearchParams({ ...query, page: String(p), limit: "20" });
    if (randomize) {
      if (!sp.has("sort")) sp.set("sort", "random");
      sp.set("seed", String(randomSeed.current));
    }
    const r = await fetch(`/api/artworks?${sp}`, { cache: forceFresh ? "no-store" : "default" });
    const d = await r.json();
    setItems(prev => {
      if (reset) return d.items;
      const existing = new Set(prev.map(item => item.id));
      return [...prev, ...d.items.filter((item: any) => !existing.has(item.id))];
    });
    setHasMore(d.hasMore);
    setLoading(false);
    setInitial(false);
  }, [key, randomize]);

  useEffect(() => {
    if (initialItems.length === 0) load(0, true);
  }, [load, initialItems.length]);

  useEffect(() => {
    const refresh = () => {
      if (randomize) randomSeed.current = createFeedSeed();
      setPage(0);
      setHasMore(true);
      load(0, true, true);
    };
    window.addEventListener("anipins:refresh", refresh);
    return () => window.removeEventListener("anipins:refresh", refresh);
  }, [load, randomize]);

  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const obs = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore && !loading && !initial) {
        const next = page + 1;
        setPage(next);
        load(next, false);
      }
    }, { rootMargin: "900px" });
    obs.observe(el);
    return () => obs.disconnect();
  }, [hasMore, loading, page, initial, load]);

  return (
    <div>
      {initial ? (
        <div className="masonry">
          {Array.from({ length: 8 }).map((_, i) => (
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
