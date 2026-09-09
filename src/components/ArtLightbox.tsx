"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import SaveMenu from "./SaveMenu";
import ShareMenu from "./ShareMenu";
import { toast } from "./Toaster";
import FollowButton from "./FollowButton";
import ZoomableArtwork from "./ZoomableArtwork";
import DownloadButton from "./DownloadButton";
import ReportArtwork from "./ReportArtwork";

export default function ArtLightbox() {
  const [id, setId] = useState<number | null>(null);
  const [data, setData] = useState<any>(null);
  const [preview, setPreview] = useState<any>(null);
  const [save, setSave] = useState(false);
  const [share, setShare] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const touch = useRef<number | null>(null);
  const panel = useRef<HTMLDivElement>(null);

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
    setSave(false);
    setShare(false);
    panel.current?.scrollTo({ top: 0 });
    fetch(`/api/artworks/${id}`, { signal: controller.signal }).then(r => r.ok ? r.json() : Promise.reject()).then(d => {
      setData(d); setLiked(d.liked); setLikeCount(d.likeCount);
    }).catch(error => { if (error?.name !== "AbortError") setId(null); });
    return () => controller.abort();
  }, [id]);

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

  const art = data?.art || preview;
  const fullImage = data?.art?.orig ? `/api/img/${data.art.orig}` : art?.thumb ? `/api/img/${art.thumb}` : "";
  const previewImage = data?.art?.orig && art?.thumb ? `/api/img/${art.thumb}` : undefined;
  return (
    <AnimatePresence>
      {id !== null && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 backdrop-blur-md p-3 md:p-8"
          onClick={() => setId(null)}
          onTouchStart={e => (touch.current = e.touches[0].clientX)}
          onTouchEnd={e => {
            if (touch.current === null) return;
            const dx = e.changedTouches[0].clientX - touch.current;
            if (Math.abs(dx) > 70) nav(dx > 0 ? "prev" : "next");
            touch.current = null;
          }}>
          <button onClick={() => setId(null)} className="absolute right-4 top-4 z-10 grid h-10 w-10 place-items-center rounded-full bg-white/10 text-lg hover:bg-gold hover:text-ink transition-colors" aria-label="Close">×</button>
          {data?.prevId && <button onClick={e => { e.stopPropagation(); nav("prev"); }} className="absolute left-3 top-1/2 z-10 hidden md:grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/10 hover:bg-gold hover:text-ink transition-colors">←</button>}
          {data?.nextId && <button onClick={e => { e.stopPropagation(); nav("next"); }} className="absolute right-3 top-1/2 z-10 hidden md:grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/10 hover:bg-gold hover:text-ink transition-colors">→</button>}

          <motion.div ref={panel} key={id}
            initial={{ scale: 0.9, y: 24, opacity: 0, rotateX: 4 }}
            animate={{ scale: 1, y: 0, opacity: 1, rotateX: 0 }}
            exit={{ scale: 0.94, y: 14, opacity: 0 }}
            transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
            style={{ transformPerspective: 1100 }}
            onClick={e => e.stopPropagation()}
            className="max-h-[92vh] w-full max-w-6xl overflow-y-auto rounded-3xl bg-panel hairline shadow-[0_40px_120px_rgba(0,0,0,0.7)]">
            <div className="grid md:grid-cols-[1.35fr,1fr]">
              <div className="relative flex max-h-[55vh] items-center justify-center bg-ink md:max-h-[82vh]">
                {art && fullImage ? <ZoomableArtwork src={fullImage} previewSrc={previewImage} alt={art.title || art.character_name} onSwipe={nav} className="max-h-[55vh] w-full md:max-h-[82vh]" />
                  : <div className="skeleton h-[50vh] w-full" />}
              </div>
              <div className="flex min-h-80 flex-col p-6 md:p-8">
                {art && (
                  <>
                    <h2 className="font-display text-2xl font-semibold">{art.title || art.character_name}</h2>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Link href={`/c/${art.character_slug}`} onClick={() => setId(null)} className="chip chip-on">{art.character_name}</Link>
                      <Link href={`/anime/${art.anime_slug}`} onClick={() => setId(null)} className="chip">{art.anime_name}</Link>
                      {art.gender && <span className="chip">{art.gender}</span>}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <FollowButton kind="character" value={art.character_slug} label={art.character_name} />
                      <FollowButton kind="anime" value={art.anime_slug} label={art.anime_name} />
                    </div>
                    {art.description && <p className="mt-4 text-sm leading-relaxed text-fog">{art.description}</p>}
                    {(art.creator_name || art.source_url) && <p className="mt-4 text-xs text-fog">By {art.creator_name || "the original creator"}{art.source_url && <> · <a href={art.source_url} target="_blank" rel="noopener noreferrer nofollow" className="text-gold hover:underline">Source ↗</a></>}</p>}
                    <div className="mt-5 flex flex-wrap gap-2">
                      <button onClick={like} className={`btn !px-5 !py-2.5 hairline ${liked ? "border-gold/60 text-gold" : "text-paper/85 hover:border-gold-dim"}`}>
                        <motion.span animate={liked ? { scale: [1, 1.35, 1] } : {}} transition={{ duration: 0.35 }}>{liked ? "♥" : "♡"}</motion.span>
                        {likeCount > 0 ? likeCount : "Like"}
                      </button>
                      <button onClick={() => setSave(true)} className="btn-primary !px-5 !py-2.5">Save</button>
                      <DownloadButton artworkId={art.id} className="btn-ghost !px-5 !py-2.5" />
                      <button onClick={() => setShare(true)} className="btn-ghost !px-5 !py-2.5">Share</button>
                    </div>
                    <div className="mt-4 flex gap-4 text-xs text-fog">
                      <span>{art.views} views</span><span>{art.downloads} downloads</span>
                    </div>
                    {(art.creator_name || art.source_url) && <div className="mt-4 rounded-xl bg-soft p-3 text-xs text-fog"><span>Artwork credit: </span>{art.source_url?<a href={art.source_url} target="_blank" rel="noopener noreferrer nofollow" className="text-gold underline underline-offset-4">{art.creator_name||"Original source"}</a>:art.creator_name}</div>}
                    <Link href={`/a/${art.id}`} onClick={() => setId(null)}
                      className="mt-auto pt-6 text-sm text-gold hover:text-gold-bright transition-colors">Open full page →</Link>
                    <div className="mt-3"><ReportArtwork artworkId={art.id} /></div>
                  </>
                )}
              </div>
            </div>
            {data?.related?.length > 0 && (
              <section className="border-t border-paper/10 p-5 md:p-8">
                <h3 className="font-display text-xl font-semibold">More to explore</h3>
                <p className="mt-1 text-xs text-fog">Fresh picks from every series—choose any image to continue.</p>
                <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                  {data.related.map((related: any) => (
                    <button key={related.id} type="button" onClick={() => { setPreview(related); setId(related.id); }}
                      className="group overflow-hidden rounded-2xl bg-soft text-left hairline hover:border-gold-dim transition-colors">
                      <div className="aspect-[3/4] overflow-hidden">
                        <img src={`/api/img/${related.thumb}`} alt={related.title || related.character_name} loading="lazy"
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                      </div>
                      <div className="p-3">
                        <p className="truncate text-sm font-medium">{related.character_name}</p>
                        <p className="truncate text-xs text-fog">{related.anime_name}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            )}
          </motion.div>
          <AnimatePresence>
            {save && art && <SaveMenu artworkId={art.id} onClose={() => setSave(false)} />}
            {share && art && <ShareMenu url={`${location.origin}/a/${art.id}`} title={art.character_name} onClose={() => setShare(false)} />}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
