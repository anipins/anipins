"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import SaveMenu from "./SaveMenu";
import ShareMenu from "./ShareMenu";
import { toast } from "./Toaster";

export default function ArtLightbox() {
  const [id, setId] = useState<number | null>(null);
  const [data, setData] = useState<any>(null);
  const [save, setSave] = useState(false);
  const [share, setShare] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const touch = useRef<number | null>(null);

  useEffect(() => {
    const h = (e: Event) => setId((e as CustomEvent).detail.id);
    window.addEventListener("anipins:open-art", h);
    return () => window.removeEventListener("anipins:open-art", h);
  }, []);

  useEffect(() => {
    if (id === null) { setData(null); return; }
    fetch(`/api/artworks/${id}`).then(r => r.ok ? r.json() : Promise.reject()).then(d => {
      setData(d); setLiked(d.liked); setLikeCount(d.likeCount);
    }).catch(() => setId(null));
  }, [id]);

  const nav = useCallback((dir: "prev" | "next") => {
    const nid = dir === "prev" ? data?.prevId : data?.nextId;
    if (nid) setId(nid);
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

  const art = data?.art;
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

          <motion.div key={art?.id ?? "loading"}
            initial={{ scale: 0.9, y: 24, opacity: 0, rotateX: 4 }}
            animate={{ scale: 1, y: 0, opacity: 1, rotateX: 0 }}
            exit={{ scale: 0.94, y: 14, opacity: 0 }}
            transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
            style={{ transformPerspective: 1100 }}
            onClick={e => e.stopPropagation()}
            className="grid max-h-[92vh] w-full max-w-5xl overflow-hidden rounded-3xl bg-panel hairline shadow-[0_40px_120px_rgba(0,0,0,0.7)] md:grid-cols-[1.35fr,1fr]">
            <div className="relative bg-ink flex items-center justify-center max-h-[55vh] md:max-h-[92vh]">
              {art ? <img src={`/api/img/${art.orig}`} alt={art.title} className="max-h-[55vh] md:max-h-[92vh] w-full object-contain" />
                : <div className="skeleton h-[50vh] w-full" />}
            </div>
            <div className="flex flex-col overflow-y-auto p-6">
              {art && (
                <>
                  <h2 className="font-display text-2xl font-semibold">{art.title || art.character_name}</h2>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Link href={`/c/${art.character_slug}`} onClick={() => setId(null)} className="chip chip-on">{art.character_name}</Link>
                    <Link href={`/anime/${art.anime_slug}`} onClick={() => setId(null)} className="chip">{art.anime_name}</Link>
                  </div>
                  {art.description && <p className="mt-4 text-sm leading-relaxed text-fog">{art.description}</p>}
                  <div className="mt-5 flex flex-wrap gap-2">
                    <button onClick={like} className={`btn !px-5 !py-2.5 hairline ${liked ? "border-gold/60 text-gold" : "text-paper/85 hover:border-gold-dim"}`}>
                      <motion.span animate={liked ? { scale: [1, 1.35, 1] } : {}} transition={{ duration: 0.35 }}>{liked ? "♥" : "♡"}</motion.span>
                      {likeCount > 0 ? likeCount : "Like"}
                    </button>
                    <button onClick={() => setSave(true)} className="btn-primary !px-5 !py-2.5">Save</button>
                    <a href={`/api/artworks/${art.id}/download`} onClick={() => toast("Download started")} className="btn-ghost !px-5 !py-2.5">Download</a>
                    <button onClick={() => setShare(true)} className="btn-ghost !px-5 !py-2.5">Share</button>
                  </div>
                  <div className="mt-4 flex gap-4 text-xs text-fog">
                    <span>{art.views} views</span><span>{art.downloads} downloads</span>
                  </div>
                  <Link href={`/a/${art.id}`} onClick={() => setId(null)}
                    className="mt-auto pt-6 text-sm text-gold hover:text-gold-bright transition-colors">Open full page →</Link>
                </>
              )}
            </div>
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
