"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import ArtCard from "./ArtCard";

function createFeedSeed() {
  return Math.floor(Math.random() * 2_147_483_646) + 1;
}

export default function MasonryFeed({ query = {}, randomize = false }: { query?: Record<string, string>; randomize?: boolean }) {
  const [items, setItems] = useState<any[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [initial, setInitial] = useState(true);
  const sentinel = useRef<HTMLDivElement>(null);
  const randomSeed = useRef(createFeedSeed());
  const key = JSON.stringify(query);

  useEffect(() => { setItems([]); setPage(0); setHasMore(true); setInitial(true); }, [key]);

  const load = useCallback(async (p: number, reset: boolean, forceFresh = false) => {
    setLoading(true);
    const sp = new URLSearchParams({ ...query, page: String(p), limit: "20" });
    if (randomize) {
      sp.set("sort", "random");
      sp.set("seed", String(randomSeed.current));
    }
    const r = await fetch(`/api/artworks?${sp}`, { cache: forceFresh ? "no-store" : "default" });
    const d = await r.json();
    setItems(prev => reset ? d.items : [...prev, ...d.items]);
    setHasMore(d.hasMore);
    setLoading(false);
    setInitial(false);
  }, [key, randomize]);

  useEffect(() => { load(0, true); }, [load]);

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
