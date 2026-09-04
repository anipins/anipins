"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import MasonryFeed from "@/components/MasonryFeed";

export default function AnimePage({ params }: { params: { slug: string } }) {
  const [meta, setMeta] = useState<any>(null);
  useEffect(() => {
    fetch("/api/meta").then(r => r.json()).then(d => {
      const me = (d.animes || []).find((a: any) => a.slug === params.slug);
      const chars = (d.characters || []).filter((c: any) => me && c.anime === me.name);
      setMeta({ me, chars });
    });
  }, [params.slug]);

  return (
    <section className="mx-auto max-w-[1600px] px-4 md:px-8 pt-28 md:pt-32">
      <p className="text-[12px] uppercase tracking-[0.25em] text-fog">Anime</p>
      <h1 className="mt-1 font-display text-4xl font-semibold md:text-5xl">{meta?.me?.name || "…"}</h1>
      {meta?.me && <p className="mt-2 text-sm text-fog">{meta.me.count} artworks · {meta.me.characters} characters</p>}
      {meta?.chars?.length > 0 && (
        <div className="mt-5 flex flex-wrap items-center gap-2">
          <span className="text-xs text-fog mr-1">Characters:</span>
          {meta.chars.map((c: any) => (
            <Link key={c.slug} href={`/c/${c.slug}`} className="chip">{c.name}</Link>
          ))}
        </div>
      )}
      <div className="mt-8">
        <MasonryFeed query={{ anime: params.slug }} />
      </div>
    </section>
  );
}
