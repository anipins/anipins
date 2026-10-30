"use client";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import ArtCard from "./ArtCard";
import { shouldLoadFromFeedSignal } from "@/lib/feed-pagination";
import { distributePinterestFeed } from "@/lib/pinterest-feed-layout";

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
type PinterestLayout = { leadingContent: ReactNode; mainColumnCount?: number; sideItemCount?: number; initialMainItemCount?: number; leadingHeight?: number };
type Props = { query?: Record<string, string>; randomize?: boolean; initialItems?: any[]; initialHasMore?: boolean; initialSeed?: number; eagerLoad?: boolean; pageSize?: number; emptyMessage?: string; emptyAction?: { href: string; label: string }; imagePriority?: boolean; maxColumns?: number; leadingContent?: ReactNode; leadingHeight?: number; leadingFillCount?: number; pinterestLayout?: PinterestLayout; layout?: "mobile" | "desktop" };

function columnsForWidth(width: number) {
  if (width >= 2200) return 7;
  if (width >= 1360) return 6;
  if (width >= 1024) return 4;
  if (width >= 640) return 3;
  return 2;
}

function distributeAcrossColumns(items: any[], columnCount: number, leadingHeight = 0, leadingFillCount = 0) {
  const columns = Array.from({ length: columnCount }, () => [] as any[]);
  // Each card already carries its intrinsic dimensions. Assigning the next
  // card to the shortest column gives us Pinterest-style vertical stacks
  // instead of CSS multi-column's visually uneven newspaper flow.
  const heights = Array.from({ length: columnCount }, (_, index) => index === 0 ? leadingHeight : 0);
  for (const [itemIndex, item] of items.entries()) {
    if (itemIndex < leadingFillCount) {
      columns[0].push(item);
      const width = Number(item.width) || 1;
      const height = Number(item.height) || width * 1.3;
      heights[0] += height / width;
      continue;
    }
    let target = 0;
    for (let index = 1; index < columnCount; index++) {
      if (heights[index] < heights[target]) target = index;
    }
    columns[target].push(item);
    const width = Number(item.width) || 1;
    const height = Number(item.height) || width * 1.3;
    heights[target] += height / width;
  }
  return columns;
}

export default function MasonryFeed({ query = {}, randomize = false, initialItems = [], initialHasMore = true, initialSeed, eagerLoad = false, pageSize = 36, emptyMessage = "No artwork found.", emptyAction, imagePriority, maxColumns, leadingContent, leadingHeight, leadingFillCount, pinterestLayout, layout }: Props) {
  const [items, setItems] = useState<any[]>(initialItems);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [initial, setInitial] = useState(initialItems.length === 0);
  const [columnCount, setColumnCount] = useState(2);
  const [activeLayout, setActiveLayout] = useState(!layout);
  const sentinel = useRef<HTMLDivElement>(null);
  const inFlight = useRef(false);
  const nextPage = useRef(initialItems.length ? 1 : 0);
  const nextCursor = useRef<string | null>(null);
  const visitorScrollArmed = useRef(false);
  const canPrimeShortFeed = useRef(initialItems.length === 0);
  const randomSeed = useRef(initialSeed ?? createFeedSeed());
  const mounted = useRef(true);
  const key = JSON.stringify(query);
  const queryRef = useRef(query);
  const renderedItemsRef = useRef(initialItems);
  queryRef.current = query;

  useEffect(() => {
    // React development mode deliberately mounts, cleans up, and mounts again.
    // Resetting this flag on every mount prevents a later pagination response
    // from being discarded after that harmless development-mode cycle.
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);
  useEffect(() => {
    if (!layout) { setActiveLayout(true); return; }
    const media = window.matchMedia(layout === "desktop" ? "(min-width: 1280px)" : "(max-width: 1279px)");
    const update = () => setActiveLayout(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, [layout]);
  useEffect(() => {
    const updateColumns = () => setColumnCount(columnsForWidth(window.innerWidth));
    updateColumns();
    window.addEventListener("resize", updateColumns);
    return () => window.removeEventListener("resize", updateColumns);
  }, []);
  useEffect(() => {
    // router.refresh() supplies fresh server-rendered cards. Keep the client
    // grid in sync rather than leaving the original list on screen.
    // The first effect runs during hydration too. Re-shuffling there caused
    // the server-rendered Home cards to jump as soon as the page became live.
    if (renderedItemsRef.current === initialItems) return;
    renderedItemsRef.current = initialItems;
    if (!initialItems.length) return;
    if (randomize && initialSeed) randomSeed.current = initialSeed;
    setItems(randomize ? shuffled(initialItems) : initialItems);
    setHasMore(initialHasMore);
    nextPage.current = 1;
    // The initial server render does not expose a database-precision cursor.
    // A silent page-zero refresh below obtains one before later pages load.
    nextCursor.current = null;
    setInitial(false);
    setLoadError(false);
  }, [randomize, initialHasMore, initialItems, initialSeed]);

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
  useEffect(() => { if (activeLayout && !initialItems.length) void requestPage(0, true); }, [activeLayout, initialItems.length, requestPage]);
  useEffect(() => {
    // Hydrate an exact server-issued cursor for ordinary SSR lists. Eager
    // feeds already start page 1 themselves; a simultaneous page-zero
    // hydration request used to occupy the single request slot and make the
    // Premium prefetch silently disappear.
    if (activeLayout && initialItems.length && !randomize && !eagerLoad) void requestPage(0, true, false, true);
  }, [activeLayout, eagerLoad, initialItems.length, randomize, requestPage]);
  useEffect(() => {
    if (!activeLayout || !eagerLoad || !initialItems.length) return;
    // Give the first visible thumbnails a minimal head start, then request
    // the next metadata page before the visitor can reach the feed boundary.
    // Images themselves remain lazy, so this does not download another screen.
    const timer = window.setTimeout(() => { void requestPage(nextPage.current, false, false, true, nextCursor.current); }, 120);
    return () => window.clearTimeout(timer);
  }, [activeLayout, eagerLoad, initialItems.length, requestPage]);
  useEffect(() => {
    if (!activeLayout) return;
    const refresh = () => { if (randomize) randomSeed.current = createFeedSeed(); nextPage.current = 0; nextCursor.current = null; canPrimeShortFeed.current = true; setHasMore(true); void requestPage(0, true, true); };
    window.addEventListener("anipins:refresh", refresh);
    return () => window.removeEventListener("anipins:refresh", refresh);
  }, [activeLayout, randomize, requestPage]);
  useEffect(() => {
    if (!activeLayout) return;
    // IntersectionObserver also reacts to layout changes. Arm pagination only
    // after the viewport actually moves, including scrollbar drags that do
    // not emit wheel, touchmove, or keyboard events.
    const arm = () => { visitorScrollArmed.current = true; };
    let lastScrollY = window.scrollY;
    const armFromScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY !== lastScrollY) {
        visitorScrollArmed.current = true;
        lastScrollY = currentScrollY;
      }
    };
    const armFromKey = (event: KeyboardEvent) => {
      if (["ArrowDown", "PageDown", "End", " "].includes(event.key)) arm();
    };
    window.addEventListener("wheel", arm, { passive: true });
    window.addEventListener("touchmove", arm, { passive: true });
    window.addEventListener("scroll", armFromScroll, { passive: true });
    window.addEventListener("keydown", armFromKey);
    return () => {
      window.removeEventListener("wheel", arm);
      window.removeEventListener("touchmove", arm);
      window.removeEventListener("scroll", armFromScroll);
      window.removeEventListener("keydown", armFromKey);
    };
  }, [activeLayout]);
  useEffect(() => {
    const element = sentinel.current;
    if (!activeLayout || !element) return;
    const observer = new IntersectionObserver(entries => { if (entries.some(entry => entry.isIntersecting)) loadNext(); }, { rootMargin: "1600px 0px" });
    observer.observe(element);
    return () => observer.disconnect();
  }, [activeLayout, loadNext]);
  useEffect(() => {
    // Some Android WebViews do not reliably notify IntersectionObserver after
    // masonry images change height. Keep the observer as the normal pagination
    // path; only the native app needs this per-scroll document-height fallback.
    if (!activeLayout || !window.AniPinsAndroid) return;
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        const remaining = document.documentElement.scrollHeight - (window.scrollY + window.innerHeight);
        if (remaining < 2000) loadNext();
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    onScroll();
    return () => { window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", onScroll); };
  }, [activeLayout, loadNext]);
  useEffect(() => {
    const hide = (event: Event) => { const id = Number((event as CustomEvent).detail?.id); if (id) setItems(current => current.filter(item => item.id !== id)); };
    window.addEventListener("anipins:hide-art", hide);
    return () => window.removeEventListener("anipins:hide-art", hide);
  }, []);

  const renderedColumnCount = maxColumns ? Math.min(columnCount, maxColumns) : columnCount;
  const renderColumns = (columns: any[][], count: number, startIndex = 0) => <div className="masonry-grid" style={{ "--masonry-columns": count } as React.CSSProperties}>
    {columns.map((column, columnIndex) => <div className="masonry-grid__column" key={columnIndex}>
      {column.map(art => <ArtCard key={art.id} art={art} index={startIndex + artworkIndex(art)} priority={imagePriority} />)}
    </div>)}
  </div>;
  const artworkIndex = (art: any) => items.indexOf(art);
  const renderGrid = (artwork: any[]) => {
    if (pinterestLayout) {
      const split = distributePinterestFeed(artwork, {
        totalColumns: renderedColumnCount,
        mainColumnCount: pinterestLayout.mainColumnCount || 4,
        sideItemCount: pinterestLayout.sideItemCount ?? 8,
        initialMainItemCount: pinterestLayout.initialMainItemCount ?? 6,
        leadingHeight: pinterestLayout.leadingHeight || 2.6,
      });
      const sideColumnCount = renderedColumnCount - split.mainColumnCount;
      return <div className="pinterest-feed-grid" style={{ "--masonry-columns": renderedColumnCount } as React.CSSProperties}>
        <div className="min-w-0" style={{ gridColumn: `span ${split.mainColumnCount}` }}>
          {pinterestLayout.leadingContent}
          <div className="mt-4">{renderColumns(split.mainColumns, split.mainColumnCount)}</div>
        </div>
        <div className="min-w-0" style={{ gridColumn: `span ${sideColumnCount}` }}>
          {renderColumns(split.sideColumns, sideColumnCount)}
        </div>
      </div>;
    }
    const columns = distributeAcrossColumns(artwork, renderedColumnCount, leadingContent ? leadingHeight || 2.4 : 0, leadingContent ? leadingFillCount || 0 : 0);
    return renderColumns(columns, renderedColumnCount);
  };

  return <div className="w-full max-w-none">
    {initial ? <div className="masonry-grid masonry-grid--loading" style={{ "--masonry-columns": renderedColumnCount } as React.CSSProperties}>{Array.from({ length: renderedColumnCount }).map((_, column) => <div className="masonry-grid__column" key={column}>{Array.from({ length: 4 }).map((__, row) => <div key={row} className="skeleton rounded-2xl" style={{ height: 180 + (((column * 4 + row) * 97) % 220) }} />)}</div>)}</div>
      : !items.length ? <div className="py-24 text-center text-fog"><p>{emptyMessage}</p>{emptyAction ? <a href={emptyAction.href} className="btn-primary mt-5 inline-flex">{emptyAction.label}</a> : null}</div>
      : renderGrid(items)}
    <div ref={sentinel} className="h-10" aria-hidden="true" />
    {loading && !initial && <div className="py-6 text-center text-sm text-fog">Loading more artwork…</div>}
    {loadError && !loading && <div className="py-5 text-center"><p className="mb-3 text-sm text-fog">More artwork could not load.</p><button type="button" className="chip" onClick={() => loadNext(true)}>Retry loading artwork</button></div>}
  </div>;
}
