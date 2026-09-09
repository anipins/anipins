"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import SaveMenu from "@/components/SaveMenu";
import ShareMenu from "@/components/ShareMenu";
import ArtCard from "@/components/ArtCard";
import { toast } from "@/components/Toaster";
import FollowButton from "@/components/FollowButton";

const IG_URL = "https://www.instagram.com/_anipins_?igsi=dzZzem42bnBha3Y=";

export default function ArtPage({ params }: { params: { id: string } }) {
  const [data, setData] = useState<any>(null);
  const [notFound, setNotFound] = useState(false);
  const [save, setSave] = useState(false);
  const [share, setShare] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const router = useRouter();
  const touch = useRef<number | null>(null);

  useEffect(() => {
    setData(null);
    fetch(`/api/artworks/${params.id}`).then(r => r.ok ? r.json() : Promise.reject()).then((d) => { setData(d); setLiked(!!d.liked); setLikeCount(d.likeCount || 0); }).catch(() => setNotFound(true));
  }, [params.id]);

  useEffect(() => {
    if (!data?.related?.length) return;
    data.related.slice(0, 1).forEach((related: any) => { const image = new window.Image(); image.src = `/api/img/${related.orig || related.thumb}`; });
  }, [data]);

  const nav = useCallback((dir: "prev" | "next") => {
    const id = dir === "prev" ? data?.prevId : data?.nextId;
    if (id) router.push(`/a/${id}`);
  }, [data, router]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") nav("prev");
      if (e.key === "ArrowRight") nav("next");
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [nav]);

  if (notFound) return <div className="pt-40 text-center text-fog">Artwork not found. <Link className="underline" href="/explore">Back to Explore</Link></div>;

  const art = data?.art;
  return (
    <section className="mx-auto max-w-[1400px] px-4 md:px-8 pt-24 md:pt-28"
      onTouchStart={e => (touch.current = e.touches[0].clientX)}
      onTouchEnd={e => {
        if (touch.current === null) return;
        const dx = e.changedTouches[0].clientX - touch.current;
        if (Math.abs(dx) > 70) nav(dx > 0 ? "prev" : "next");
        touch.current = null;
      }}>
      {!art ? (
        <div className="grid gap-8 md:grid-cols-[1.2fr,1fr]"><div className="skeleton h-[70vh] rounded-3xl" /><div className="space-y-4"><div className="skeleton h-10 w-2/3 rounded-lg" /><div className="skeleton h-6 w-1/3 rounded-lg" /><div className="skeleton h-24 rounded-lg" /></div></div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div key={art.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }} className="grid gap-8 lg:grid-cols-[1.15fr,1fr]">
            <div className="relative">
              <div className="overflow-hidden rounded-3xl hairline bg-soft">
                <motion.img key={art.orig} initial={{ scale: 1.04, opacity: 0.4 }} animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  src={`/api/img/${art.orig}`} alt={art.title} className="w-full object-contain max-h-[80vh] mx-auto" />
              </div>
              <div className="mt-4 flex items-center justify-between">
                <button onClick={() => nav("prev")} disabled={!data.prevId}
                  className="btn-ghost !py-2.5 disabled:opacity-30 disabled:cursor-not-allowed">← Previous</button>
                <span className="text-xs text-fog hidden md:block">Use ← → keys or swipe</span>
                <button onClick={() => nav("next")} disabled={!data.nextId}
                  className="btn-ghost !py-2.5 disabled:opacity-30 disabled:cursor-not-allowed">Next →</button>
              </div>
            </div>

            <div>
              <h1 className="font-display text-3xl font-semibold md:text-4xl">{art.title || art.character_name}</h1>
              <div className="mt-3 flex flex-wrap gap-2 text-sm">
                <Link href={`/c/${art.character_slug}`} className="chip chip-on">{art.character_name}</Link>
                <Link href={`/anime/${art.anime_slug}`} className="chip">{art.anime_name}</Link>
                {art.gender && <span className="chip">{art.gender}</span>}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <FollowButton kind="character" value={art.character_slug} label={art.character_name} />
                <FollowButton kind="anime" value={art.anime_slug} label={art.anime_name} />
              </div>
              {art.description && <p className="mt-5 text-sm leading-relaxed text-fog">{art.description}</p>}
              {art.tags && (
                <div className="mt-5 flex flex-wrap gap-2">
                  {String(art.tags).split(",").map((t: string) => t.trim()).filter(Boolean).map((t: string) => (
                    <Link key={t} href={`/search?q=${encodeURIComponent(t)}`} className="rounded-lg bg-soft px-2.5 py-1 text-xs text-fog hover:text-paper transition-colors">#{t}</Link>
                  ))}
                </div>
              )}
              <div className="mt-7 flex flex-wrap gap-2.5">
                <button onClick={async () => {
                  const r = await fetch("/api/likes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ artworkId: art.id }) });
                  if (r.status === 401) { toast("Sign in to like artwork", "err"); return; }
                  const d = await r.json(); setLiked(d.liked); setLikeCount(d.count);
                }} className={`btn hairline !px-5 !py-3 ${liked ? "border-gold/60 text-gold" : "text-paper/85 hover:border-gold-dim"}`}>{liked ? "\u2665" : "\u2661"} {likeCount > 0 ? likeCount : "Like"}</button>
                <button onClick={() => setSave(true)} className="btn-primary">Save</button>
                <a href={`/api/artworks/${art.id}/download`} onClick={() => toast("Download started")} className="btn-ghost">Download</a>
                <button onClick={() => setShare(true)} className="btn-ghost">Share</button>
                <a href={IG_URL} target="_blank" rel="noopener noreferrer" className="btn-ghost" title="@_anipins_">Instagram</a>
              </div>
              <div className="mt-6 flex gap-5 text-xs text-fog">
                <span>{art.views} views</span><span>{art.downloads} downloads</span>
                {art.category && <span>{art.category}</span>}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      )}

      {data?.related?.length > 0 && (
        <div className="mt-20">
          <h2 className="font-display text-2xl font-semibold">More like this</h2>
          <div className="masonry mt-6">
            {data.related.map((a: any, i: number) => <ArtCard key={a.id} art={a} index={i} />)}
          </div>
        </div>
      )}

      <AnimatePresence>
        {save && art && <SaveMenu artworkId={art.id} onClose={() => setSave(false)} />}
        {share && art && <ShareMenu url={typeof location !== "undefined" ? `${location.origin}/a/${art.id}` : ""} title={art.character_name} onClose={() => setShare(false)} />}
      </AnimatePresence>
    </section>
  );
}
