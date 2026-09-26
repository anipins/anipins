"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import ArtCard from "./ArtCard";

function createFeedSeed() {
  return Math.floor(Math.random() * 2_147_483_646) + 1;
}

function shuffled(items: any[]) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

const memoryCache = new Map<string, { items: any[]; hasMore: boolean; savedAt: number }>();
const CACHE_TTL = 2 * 60 * 1000;

export default function MasonryFeed({ query = {}, randomize = false, initialItems = [], initialHasMore = true, eagerLoad = false }: { query?: Record<string, string>; randomize?: boolean; initialItems?: any[]; initialHasMore?: boolean; eagerLoad?: boolean }) {
  const [items, setItems] = useState<any[]>(initialItems);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [initial, setInitial] = useState(initialItems.length === 0);
  const sentinel = useRef<HTMLDivElement>(null);
  const inFlight = useRef(new Set<string>());
  const randomSeed = useRef(createFeedSeed());
  const key = JSON.stringify(query);

  // Shuffle the already-rendered pool after hydration. This is instant and
  // gives each visit a new order without an expensive SQL RANDOM() query.
  useEffect(() => {
    if (randomize && initialItems.length > 1) setItems(shuffled(initialItems));
  }, [randomize, initialItems]);

  const load = useCallback(async (p: number, reset: boolean, forceFresh = false, silent = false) => {
    const requestKey = `${key}:${randomize ? randomSeed.current : "fixed"}:${p}`;
    if (inFlight.current.has(requestKey)) return;
    const cached = !forceFresh ? memoryCache.get(requestKey) : undefined;
    if (cached && Date.now() - cached.savedAt < CACHE_TTL) {
      setItems(prev => reset ? cached.items : [...prev, ...cached.items.filter(item => !prev.some(existing => existing.id === item.id))]);
      setHasMore(cached.hasMore);
      setInitial(false);
      return;
    }
    inFlight.current.add(requestKey);
    if (!silent) setLoading(true);
    setLoadError(false);
    const sp = new URLSearchParams({ ...query, page: String(p), limit: "20" });
    if (randomize) {
      if (!sp.has("sort")) sp.set("sort", "random");
      sp.set("seed", String(randomSeed.current));
    }
    try {
      const r = await fetch(`/api/artworks?${sp}`, { cache: forceFresh ? "no-store" : "default" });
      if (!r.ok) throw new Error(`Artwork request failed (${r.status})`);
      const d = await r.json();
      memoryCache.set(requestKey, { items: d.items, hasMore: d.hasMore, savedAt: Date.now() });
      setItems(prev => {
        if (reset) return d.items;
        const existing = new Set(prev.map(item => item.id));
        return [...prev, ...d.items.filter((item: any) => !existing.has(item.id))];
      });
      setHasMore(d.hasMore);
      setInitial(false);
    } catch {
      if (!silent) setLoadError(true);
    } finally {
      inFlight.current.delete(requestKey);
      if (!silent) setLoading(false);
    }
  }, [key, randomize]);

  useEffect(() => {
    if (initialItems.length === 0) load(0, true);
  }, [load, initialItems.length]);

  // Detail pages arrive with 36 server-rendered recommendations. Fetch the
  // first independent discovery batch in the background so more cards are
  // already present before a fast scroller reaches the sentinel.
  useEffect(() => {
    if (!eagerLoad || initialItems.length === 0) return;
    const timer = window.setTimeout(() => load(0, false, false, true), 150);
    return () => window.clearTimeout(timer);
  }, [eagerLoad, initialItems.length, load]);

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
    }, { rootMargin: "500px" });
    obs.observe(el);
    return () => obs.disconnect();
  }, [hasMore, loading, page, initial, load]);

  useEffect(() => {
    const hide = (event: Event) => {
      const id = Number((event as CustomEvent).detail?.id);
      if (id) setItems(current => current.filter(item => item.id !== id));
    };
    window.addEventListener("anipins:hide-art", hide);
    return () => window.removeEventListener("anipins:hide-art", hide);
  }, []);

  return (
    <div className="w-full max-w-none">
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
      {loadError && !loading && <div className="py-5 text-center"><button type="button" className="chip" onClick={() => load(page, false, true)}>Retry loading more</button></div>}
    </div>
  );
}
