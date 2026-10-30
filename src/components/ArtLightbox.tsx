"use client";
import { useCallback, useEffect, useRef, useState, type UIEvent } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import SaveMenu from "./SaveMenu";
import ShareMenu from "./ShareMenu";
import { toast } from "./Toaster";
import FollowButton from "./FollowButton";
import ZoomableArtwork from "./ZoomableArtwork";
import DownloadButton from "./DownloadButton";
import ReportArtwork from "./ReportArtwork";
import AdminArtworkActions from "./AdminArtworkActions";
import MasonryFeed from "./MasonryFeed";
import { isWallpaperArtwork } from "@/lib/wallpaper-feed-utils";
import { preserveArtworkPreview } from "@/lib/artwork-preview";

export default function ArtLightbox() {
  const [id, setId] = useState<number | null>(null);
  const [data, setData] = useState<any>(null);
  const [preview, setPreview] = useState<any>(null);
  const [save, setSave] = useState(false);
  const [share, setShare] = useState(false);
  const [more, setMore] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [detailError, setDetailError] = useState(false);
  const [detailRetry, setDetailRetry] = useState(0);
  const [toolbarVisible, setToolbarVisible] = useState(true);
  const lastViewerScrollTop = useRef(0);

  const handleViewerScroll = useCallback((event: UIEvent<HTMLDivElement>) => {
    const scrollTop = event.currentTarget.scrollTop;
    const previousTop = lastViewerScrollTop.current;
    if (scrollTop < 24) setToolbarVisible(true);
    else if (Math.abs(scrollTop - previousTop) > 3) setToolbarVisible(scrollTop < previousTop);
    lastViewerScrollTop.current = scrollTop;
  }, []);

  useEffect(() => {
    const h = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      setPreview(detail.art || null);
      setId(detail.id);
    };
    window.addEventListener("anipins:open-art", h);
    return () => window.removeEventListener("anipins:open-art", h);
  }, []);

  useEffect(() => {
    if (id === null) { setData(null); setPreview(null); return; }
    const controller = new AbortController();
    setData(null);
    setLiked(false);
    setLikeCount(0);
    setDetailError(false);
    setSave(false);
    setShare(false);
    setMore(false);
    setToolbarVisible(true);
    lastViewerScrollTop.current = 0;
    document.querySelector<HTMLElement>("[data-artwork-viewer]")?.scrollTo({ top: 0 });
    fetch(`/api/artworks/${id}`, { signal: controller.signal }).then(r => r.ok ? r.json() : Promise.reject()).then(d => {
      setData(d); setLiked(d.liked); setLikeCount(d.likeCount);
    }).catch(error => {
      // Keep the preview open if a transient request fails. Closing the artwork
      // made valid cards look broken even though their image was already loaded.
      if (error?.name !== "AbortError") setDetailError(true);
    });
    return () => controller.abort();
  }, [id, detailRetry]);

  const nav = useCallback((dir: "prev" | "next") => {
    const nid = dir === "prev" ? data?.prevId : data?.nextId;
    if (nid) {
      setPreview(data?.related?.find((item: any) => item.id === nid) || null);
      setId(nid);
    }
  }, [data]);

  useEffect(() => {
    if (id === null) return;
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") setId(null);
      if (e.key === "ArrowLeft") nav("prev");
      if (e.key === "ArrowRight") nav("next");
    };
    window.addEventListener("keydown", h);
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", h); document.body.style.overflow = ""; };
  }, [id, nav]);

  const like = async () => {
    const r = await fetch("/api/likes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ artworkId: id }) });
    if (r.status === 401) { toast("Sign in to like artwork", "err"); return; }
    const d = await r.json();
    setLiked(d.liked); setLikeCount(d.count);
    if (d.liked) toast("Added to likes");
  };

  // Never let a stale response from the previous pin replace the preview for
  // the newly clicked pin. The feed thumbnail is available immediately while
  // the detail API resolves in parallel.
  const art = data?.art?.id === id ? preserveArtworkPreview(data.art, preview?.id === id ? preview : null) : preview;
  const wallpaperOnly = isWallpaperArtwork(art);
  const relatedQuery = { sort: "random", ...(art?.premium ? { premium: "1" } : {}), ...(wallpaperOnly ? { wallpaper: "1" } : {}) };
  const detailArt = data?.art?.id === id ? data.art : null;
  // Prefer the URL from the clicked card. The feed and detail API each issue
  // a new signed URL, and switching between them reloads the same original.
  const fullImage = art?.orig_url || detailArt?.original_url || detailArt?.orig_url || (detailArt?.orig ? `/api/img/${detailArt.orig}` : "");
  const previewImage = art?.thumb_url || (art?.thumb ? `/api/img/${art.thumb}` : undefined);
  return (
    <AnimatePresence>
      {id !== null && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }}
          className="fixed inset-0 z-[80] overflow-y-auto bg-black/90 p-0"
          data-artwork-viewer
          onScroll={handleViewerScroll}
          onClick={() => setId(null)}
          >
          <div aria-hidden={!toolbarVisible} className={`pointer-events-none fixed inset-x-0 top-0 z-20 flex items-start justify-between px-4 pt-[max(1rem,env(safe-area-inset-top))] transition-[opacity,transform] duration-200 ${toolbarVisible ? "translate-y-0 opacity-100" : "-translate-y-3 opacity-0"}`}>
            <button onClick={event => { event.stopPropagation(); setId(null); }} tabIndex={toolbarVisible ? 0 : -1} className="pointer-events-auto flex h-11 items-center gap-2 rounded-full bg-black/70 px-4 text-sm font-medium text-white backdrop-blur transition-colors hover:bg-gold" aria-label="Go back"><span className="text-lg">←</span><span>Back</span></button>
            <button onClick={event => { event.stopPropagation(); setId(null); }} tabIndex={toolbarVisible ? 0 : -1} className="pointer-events-auto grid h-11 w-11 place-items-center rounded-full bg-black/70 text-xl text-white backdrop-blur transition-colors hover:bg-gold" aria-label="Close">×</button>
          </div>
          {data?.prevId && <button onClick={e => { e.stopPropagation(); nav("prev"); }} className="absolute left-3 top-1/2 z-10 hidden md:grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/10 hover:bg-gold hover:text-white transition-colors">←</button>}
          {data?.nextId && <button onClick={e => { e.stopPropagation(); nav("next"); }} className="absolute right-3 top-1/2 z-10 hidden md:grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/10 hover:bg-gold hover:text-white transition-colors">→</button>}

          <motion.div
            initial={false}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.12 }}
            onClick={e => e.stopPropagation()}
            className="min-h-full w-full max-w-none overflow-hidden bg-panel shadow-[0_40px_120px_rgba(0,0,0,0.7)]">
            <div className="grid md:min-h-dvh md:grid-cols-[minmax(0,1.35fr)_minmax(360px,0.65fr)] xl:grid-cols-[minmax(360px,42vw)_minmax(0,1fr)]">
              <div className="relative flex min-h-0 w-full items-center justify-start overflow-hidden bg-black md:h-dvh xl:hidden">
                {art && (fullImage || previewImage) ? <ZoomableArtwork src={fullImage || previewImage!} previewSrc={previewImage} alt={art.title || art.character_name || art.anime_name || "Anime artwork"} onSwipe={nav} align="start" className="h-auto w-auto max-w-full md:h-dvh md:max-h-dvh" />
                  : <div className="skeleton h-[50vh] w-full" />}
              </div>
              <div className="artwork-detail-panel flex h-auto min-h-0 flex-col justify-start p-6 pb-6 md:min-h-80 md:p-8 md:pb-[max(2rem,env(safe-area-inset-bottom))] xl:hidden">
                {detailError && <div className="mb-4 rounded-xl border border-gold/30 bg-gold/10 p-3 text-sm text-paper">Artwork details are taking longer than usual. <button type="button" onClick={() => setDetailRetry(value => value + 1)} className="ml-2 text-gold underline underline-offset-4">Retry</button></div>}
                {art && (
                  <>
                    <h2 className="font-display text-2xl font-semibold">{art.title || art.character_name || art.anime_name || "Untitled artwork"}</h2>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {art.character_name && art.character_slug && <Link href={`/c/${art.character_slug}`} onClick={() => setId(null)} className="chip chip-on">{art.character_name}</Link>}
                      {art.anime_name && art.anime_slug && <Link href={`/anime/${art.anime_slug}`} onClick={() => setId(null)} className="chip">{art.anime_name}</Link>}
                      {art.gender && <span className="chip hidden md:inline-flex">{art.gender}</span>}
                    </div>
                    <div className="mt-3 hidden flex-wrap gap-2 md:flex">
                      {art.character_name && art.character_slug && <FollowButton kind="character" value={art.character_slug} label={art.character_name} />}
                      {art.anime_name && art.anime_slug && <FollowButton kind="anime" value={art.anime_slug} label={art.anime_name} />}
                    </div>
                    {art.description && <p className="mt-4 text-sm leading-relaxed text-fog">{art.description}</p>}
                    <div className="hidden md:block">
                    {(art.creator_name || art.source_url) && <p className="mt-4 text-xs text-fog">By {art.creator_name || "the original creator"}{art.source_url && <> · <a href={art.source_url} target="_blank" rel="noopener noreferrer nofollow" className="text-gold hover:underline">Source ↗</a></>}</p>}
                    </div>
                    <div className="mt-5 hidden flex-wrap gap-2 md:flex">
                      <button onClick={like} className={`btn !px-5 !py-2.5 hairline ${liked ? "border-gold/60 text-gold" : "text-paper/85 hover:border-gold-dim"}`}>
                        <motion.span animate={liked ? { scale: [1, 1.35, 1] } : {}} transition={{ duration: 0.35 }}>{liked ? "♥" : "♡"}</motion.span>
                        {likeCount > 0 ? likeCount : "Like"}
                      </button>
                      <button onClick={() => setSave(true)} className="btn-primary !px-5 !py-2.5">Save</button>
                      <DownloadButton artworkId={art.id} className="btn-ghost !px-5 !py-2.5" />
                      <button onClick={() => setShare(true)} className="btn-ghost !px-5 !py-2.5">Share</button>
                    </div>
                    {/* Mobile actions: Save and Download stay visible; Follow details, sharing and reporting stay behind More. */}
                    <div className="mt-5 grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto_auto] gap-2 md:hidden">
                      <button onClick={() => setSave(true)} className="btn-primary !min-w-0 !px-3 !py-2.5">Save</button>
                      <DownloadButton artworkId={art.id} className="btn-ghost !min-w-0 !px-3 !py-2.5" />
                      <button type="button" onClick={like} aria-label={liked ? "Unlike artwork" : "Like artwork"} className={`grid h-11 w-11 place-items-center rounded-full border transition-colors ${liked ? "border-gold/60 bg-gold/10 text-gold" : "border-paper/15 text-paper hover:border-gold/50"}`}>
                        <motion.span animate={liked ? { scale: [1, 1.3, 1] } : {}} transition={{ duration: 0.35 }} className="text-lg">{liked ? "♥" : "♡"}</motion.span>
                      </button>
                      <button type="button" onClick={() => setMore(value => !value)} aria-expanded={more} aria-label="More artwork actions" className={`grid h-11 w-11 place-items-center rounded-full border text-lg tracking-[0.12em] transition-colors ${more ? "border-gold/60 bg-gold/10 text-gold" : "border-paper/15 text-paper hover:border-gold/50"}`}>•••</button>
                    </div>
                    {more && <div className="mt-3 rounded-2xl border border-paper/10 bg-soft/70 p-3 md:hidden">
                      <p className="px-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-fog">More options</p>
                      <div className="mt-2 grid gap-2">
                        {art.character_name && art.character_slug && <FollowButton kind="character" value={art.character_slug} label={art.character_name} />}
                        {art.anime_name && art.anime_slug && <FollowButton kind="anime" value={art.anime_slug} label={art.anime_name} />}
                      </div>
                      <div className="mt-3 flex items-center justify-between gap-3 border-t border-paper/10 pt-3 text-sm">
                        <button type="button" onClick={() => { setShare(true); setMore(false); }} className="text-fog transition-colors hover:text-paper">Share</button>
                        <Link href={`/a/${art.id}`} onClick={() => setId(null)} className="text-gold hover:text-gold-bright">Open page →</Link>
                        <ReportArtwork artworkId={art.id} />
                      </div>
                    </div>}
                    <div className="mt-4 hidden gap-4 text-xs text-fog md:flex">
                      <span>{art.views} views</span><span>{art.downloads} downloads</span>
                    </div>
                    <AdminArtworkActions art={art} onSaved={() => setDetailRetry(value => value + 1)} onDeleted={() => setId(null)} />
                    {(art.creator_name || art.source_url) && <div className="mt-4 hidden rounded-xl bg-soft p-3 text-xs text-fog md:block"><span>Artwork credit: </span>{art.source_url?<a href={art.source_url} target="_blank" rel="noopener noreferrer nofollow" className="text-gold underline underline-offset-4">{art.creator_name||"Original source"}</a>:art.creator_name}</div>}
                    <div className="hidden md:block">
                    <Link href={`/a/${art.id}`} onClick={() => setId(null)}
                      className="mt-auto pt-6 text-sm text-gold hover:text-gold-bright transition-colors">Open full page →</Link>
                    <div className="mt-3"><ReportArtwork artworkId={art.id} /></div>
                    </div>
                  </>
                )}
              </div>
              {art && <section aria-label="Artwork and more to explore" className="hidden bg-[#101010] p-4 xl:col-span-2 xl:row-start-1 xl:block">
                <MasonryFeed
                  key={`desktop-pinterest-${art.id}`}
                  query={relatedQuery}
                  randomize
                  // Start the fast, cacheable feed request as soon as the card
                  // preview opens; do not wait for the slower detail endpoint.
                  initialItems={data?.art?.id === id ? data.related ?? [] : []}
                  initialHasMore
                  imagePriority={false}
                  maxColumns={6}
                  pageSize={36}
                  layout="desktop"
                  pinterestLayout={{
                    leadingContent: <article className="grid overflow-hidden rounded-2xl bg-black shadow-[0_20px_50px_rgba(0,0,0,0.35)] 2xl:grid-cols-[minmax(0,1fr)_minmax(360px,1.12fr)]">
                      <div className="min-w-0 bg-black">
                        {fullImage || previewImage ? <ZoomableArtwork src={fullImage || previewImage!} previewSrc={previewImage} alt={art.title || art.character_name || art.anime_name || "Anime artwork"} onSwipe={nav} align="start" className="h-auto w-full" /> : <div className="skeleton aspect-[3/4] w-full" />}
                      </div>
                      <div className="flex min-h-full flex-col p-6 2xl:p-8">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h2 className="font-display text-3xl font-semibold">{art.title || art.character_name || art.anime_name || "Untitled artwork"}</h2>
                            <div className="mt-3 flex flex-wrap gap-2">
                              {art.character_name && art.character_slug && <Link href={`/c/${art.character_slug}`} onClick={() => setId(null)} className="chip chip-on">{art.character_name}</Link>}
                              {art.anime_name && art.anime_slug && <Link href={`/anime/${art.anime_slug}`} onClick={() => setId(null)} className="chip">{art.anime_name}</Link>}
                            </div>
                          </div>
                          <button onClick={() => setSave(true)} className="btn-primary shrink-0 !px-5 !py-2.5">Save</button>
                        </div>
                        <div className="mt-6 flex flex-wrap gap-2">
                          <button onClick={like} className={`btn !px-4 !py-2 hairline ${liked ? "border-gold/60 text-gold" : "text-paper/85 hover:border-gold-dim"}`}>{liked ? "♥" : "♡"} {likeCount > 0 ? likeCount : "Like"}</button>
                          <DownloadButton artworkId={art.id} className="btn-ghost !px-4 !py-2" />
                          <button onClick={() => setShare(true)} className="btn-ghost !px-4 !py-2">Share</button>
                        </div>
                        <AdminArtworkActions art={art} onSaved={() => setDetailRetry(value => value + 1)} onDeleted={() => setId(null)} />
                        {(art.creator_name || art.source_url) && <div className="mt-6 rounded-xl bg-soft p-3 text-xs text-fog"><span>Artwork credit: </span>{art.source_url ? <a href={art.source_url} target="_blank" rel="noopener noreferrer nofollow" className="text-gold underline">{art.creator_name || "Original source"}</a> : art.creator_name}</div>}
                        <div className="mt-auto flex items-center justify-between gap-4 pt-10 text-sm text-fog">
                          <span>{art.views} views · {art.downloads} downloads</span>
                          <Link href={`/a/${art.id}`} onClick={() => setId(null)} className="text-gold hover:text-gold-bright">Open full page →</Link>
                        </div>
                      </div>
                    </article>,
                    mainColumnCount: 4,
                    sideItemCount: 8,
                    initialMainItemCount: 6,
                    leadingHeight: 2.6,
                  }}
                />
              </section>}
              {art && (
                <section className="border-t border-paper/10 p-5 md:col-span-2 md:p-8 xl:hidden">
                  <div className="xl:hidden"><h3 className="font-display text-xl font-semibold">More to explore</h3><p className="mt-1 text-xs text-fog">Fresh picks from every series—choose any image to continue.</p></div>
                  <div className="mt-5"><MasonryFeed key={`mobile-pinterest-${art.id}`} query={relatedQuery} randomize initialItems={data?.art?.id === id ? data.related ?? [] : []} initialHasMore imagePriority={false} layout="mobile" /></div>
                </section>
              )}
            </div>
          </motion.div>
          <AnimatePresence>
            {save && art && <SaveMenu artworkId={art.id} onClose={() => setSave(false)} />}
            {share && art && <ShareMenu url={`${location.origin}/a/${art.id}`} title={art.title || art.character_name || art.anime_name || "AniPins artwork"} onClose={() => setShare(false)} />}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
