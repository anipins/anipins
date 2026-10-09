"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import ArtCard from "./ArtCard";
import { shouldLoadFromFeedSignal } from "@/lib/feed-pagination";

function createFeedSeed() { return Math.floor(Math.random() * 2_147_483_646) + 1; }
function shuffled(items: any[]) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [copy[i], copy[j]] = [copy[j], copy[i]]; }
  return copy;
}
const memoryCache = new Map<string, { items: any[]; hasMore: boolean; savedAt: number }>();
const CACHE_TTL = 15_000;
// A failed request must become actionable quickly. Waiting through four 25s
// attempts made a transient network problem look like an endless feed loader.
const REQUEST_TIMEOUT = 10_000;
const MAX_REQUEST_ATTEMPTS = 3;
type Props = { query?: Record<string, string>; randomize?: boolean; initialItems?: any[]; initialHasMore?: boolean; eagerLoad?: boolean; pageSize?: number };

export default function MasonryFeed({ query = {}, randomize = false, initialItems = [], initialHasMore = true, eagerLoad = false, pageSize = 36 }: Props) {
  const [items, setItems] = useState<any[]>(initialItems);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [initial, setInitial] = useState(initialItems.length === 0);
  const sentinel = useRef<HTMLDivElement>(null);
  const inFlight = useRef(false);
  const nextPage = useRef(initialItems.length ? 1 : 0);
  const nextCursor = useRef<string | null>(null);
  const visitorScrollArmed = useRef(false);
  const canPrimeShortFeed = useRef(initialItems.length === 0);
  const randomSeed = useRef(createFeedSeed());
  const mounted = useRef(true);
  const key = JSON.stringify(query);
  const queryRef = useRef(query);
  queryRef.current = query;

  useEffect(() => {
    // React development mode deliberately mounts, cleans up, and mounts again.
    // Resetting this flag on every mount prevents a later pagination response
    // from being discarded after that harmless development-mode cycle.
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);
  useEffect(() => {
    // router.refresh() supplies fresh server-rendered cards. Keep the client
    // grid in sync rather than leaving the original list on screen.
    if (!initialItems.length) return;
    setItems(randomize ? shuffled(initialItems) : initialItems);
    setHasMore(initialHasMore);
    nextPage.current = 1;
    // The initial server render does not expose a database-precision cursor.
    // A silent page-zero refresh below obtains one before later pages load.
    nextCursor.current = null;
    setInitial(false);
    setLoadError(false);
  }, [randomize, initialHasMore, initialItems]);

  const requestPage = useCallback(async (page: number, reset = false, forceFresh = false, silent = false, cursor: string | null = null) => {
    if (inFlight.current) return false;
    const requestKey = `${key}:${randomize ? randomSeed.current : "fixed"}:${cursor || `page-${page}`}`;
    const cached = forceFresh ? undefined : memoryCache.get(requestKey);
    const apply = (data: { items: any[]; hasMore: boolean; nextCursor?: string | null }) => {
      if (!mounted.current) return;
      setItems(previous => {
        if (reset) return data.items;
        const existing = new Set(previous.map(item => item.id));
        return [...previous, ...data.items.filter(item => !existing.has(item.id))];
      });
      setHasMore(data.hasMore); nextPage.current = page + 1; nextCursor.current = data.nextCursor || null; setInitial(false); setLoadError(false);
    };
    if (cached && Date.now() - cached.savedAt < CACHE_TTL) { apply(cached); return true; }
    inFlight.current = true;
    if (!silent) setLoading(true);
    setLoadError(false);
    // pageSize is the payload size for one request, not a feed limit. Pages keep
    // loading until the API explicitly reports that there is no more artwork.
    const params = new URLSearchParams({ ...queryRef.current, page: String(page), limit: String(pageSize) });
    if (cursor) { params.delete("page"); params.set("cursor", cursor); }
    if (randomize) { if (!params.has("sort")) params.set("sort", "random"); params.set("seed", String(randomSeed.current)); }
    try {
      let data: any;
      for (let attempt = 0; attempt < MAX_REQUEST_ATTEMPTS; attempt++) {
        const controller = new AbortController();
        const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
        try {
          const response = await fetch(`/api/artworks?${params}`, { cache: forceFresh ? "no-store" : "default", signal: controller.signal });
          if (!response.ok) throw new Error(`Artwork request failed (${response.status})`);
          data = await response.json();
          break;
        } catch (error) {
          if (attempt === MAX_REQUEST_ATTEMPTS - 1) throw error;
          await new Promise(resolve => window.setTimeout(resolve, 500 * 2 ** attempt));
        } finally { window.clearTimeout(timeout); }
      }
      if (!data?.items) throw new Error("Artwork response was incomplete");
      memoryCache.set(requestKey, { items: data.items, hasMore: data.hasMore, savedAt: Date.now() });
      apply(data);
      return true;
    } catch {
      if (mounted.current && !silent) setLoadError(true);
      return false;
    } finally {
      inFlight.current = false;
      if (mounted.current && !silent) setLoading(false);
    }
  }, [key, pageSize, randomize]);

  const loadNext = useCallback((force = false) => {
    if (!hasMore || inFlight.current) return;
    if (!force && !shouldLoadFromFeedSignal({ armed: visitorScrollArmed.current, canPrime: canPrimeShortFeed.current })) return;
    visitorScrollArmed.current = false;
    canPrimeShortFeed.current = false;
    void requestPage(nextPage.current, false, false, false, nextCursor.current);
  }, [hasMore, requestPage]);
  useEffect(() => { if (!initialItems.length) void requestPage(0, true); }, [initialItems.length, requestPage]);
  useEffect(() => {
    // Hydrate an exact server-issued cursor for the SSR cards. This avoids
    // offset drift if artwork is published between the server render and the
    // visitor's first infinite-scroll request.
    if (initialItems.length) void requestPage(0, true, false, true);
  }, [initialItems.length, requestPage]);
  useEffect(() => {
    if (!eagerLoad || !initialItems.length) return;
    const timer = window.setTimeout(() => { void requestPage(nextPage.current, false, false, true, nextCursor.current); }, 150);
    return () => window.clearTimeout(timer);
  }, [eagerLoad, initialItems.length, requestPage]);
  useEffect(() => {
    const refresh = () => { if (randomize) randomSeed.current = createFeedSeed(); nextPage.current = 0; nextCursor.current = null; canPrimeShortFeed.current = true; setHasMore(true); void requestPage(0, true, true); };
    window.addEventListener("anipins:refresh", refresh);
    return () => window.removeEventListener("anipins:refresh", refresh);
  }, [randomize, requestPage]);
  useEffect(() => {
    // IntersectionObserver reacts to layout changes as well as actual
    // scrolling. Arm pagination from physical input, so appending cards can
    // never fetch every subsequent page by itself.
    const arm = () => { visitorScrollArmed.current = true; };
    const armFromKey = (event: KeyboardEvent) => {
      if (["ArrowDown", "PageDown", "End", " "].includes(event.key)) arm();
    };
    window.addEventListener("wheel", arm, { passive: true });
    window.addEventListener("touchmove", arm, { passive: true });
    window.addEventListener("keydown", armFromKey);
    return () => {
      window.removeEventListener("wheel", arm);
      window.removeEventListener("touchmove", arm);
      window.removeEventListener("keydown", armFromKey);
    };
  }, []);
  useEffect(() => {
    const element = sentinel.current;
    if (!element) return;
    const observer = new IntersectionObserver(entries => { if (entries.some(entry => entry.isIntersecting)) loadNext(); }, { rootMargin: "800px 0px" });
    observer.observe(element);
    return () => observer.disconnect();
  }, [loadNext]);
  useEffect(() => {
    // Some mobile WebViews do not reliably notify IntersectionObserver after
    // masonry images change height. Keep the observer for efficient browsers,
    // but use the document scroll position as a dependable fallback.
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        const remaining = document.documentElement.scrollHeight - (window.scrollY + window.innerHeight);
        if (remaining < 1200) loadNext();
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    onScroll();
    return () => { window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", onScroll); };
  }, [loadNext]);
  useEffect(() => {
    const hide = (event: Event) => { const id = Number((event as CustomEvent).detail?.id); if (id) setItems(current => current.filter(item => item.id !== id)); };
    window.addEventListener("anipins:hide-art", hide);
    return () => window.removeEventListener("anipins:hide-art", hide);
  }, []);

  return <div className="w-full max-w-none">
    {initial ? <div className="masonry">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="skeleton rounded-2xl" style={{ height: 180 + ((i * 97) % 220) }} />)}</div>
      : !items.length ? <div className="py-24 text-center text-fog">No artwork found.</div>
      : <div className="masonry">{items.map((art, index) => <ArtCard key={art.id} art={art} index={index} />)}</div>}
    <div ref={sentinel} className="h-10" aria-hidden="true" />
    {loading && !initial && <div className="py-6 text-center text-sm text-fog">Loading more artwork…</div>}
    {loadError && !loading && <div className="py-5 text-center"><p className="mb-3 text-sm text-fog">More artwork could not load.</p><button type="button" className="chip" onClick={() => loadNext(true)}>Retry loading artwork</button></div>}
  </div>;
}
