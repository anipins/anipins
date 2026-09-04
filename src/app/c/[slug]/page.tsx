"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import MasonryFeed from "@/components/MasonryFeed";

export default function CharacterPage({ params }: { params: { slug: string } }) {
  const [meta, setMeta] = useState<any>(null);
  useEffect(() => {
    fetch("/api/meta").then(r => r.json()).then(d => {
      const me = (d.characters || []).find((c: any) => c.slug === params.slug);
      const related = (d.characters || []).filter((c: any) => c.slug !== params.slug && c.anime === me?.anime).slice(0, 6);
      setMeta({ me, related });
    });
  }, [params.slug]);

  return (
    <section className="mx-auto max-w-[1600px] px-4 md:px-8 pt-28 md:pt-32">
      <p className="text-[12px] uppercase tracking-[0.25em] text-fog">Character</p>
      <h1 className="mt-1 font-display text-4xl font-semibold md:text-5xl">{meta?.me?.name || "…"}</h1>
      {meta?.me && (
        <p className="mt-2 text-sm text-fog">
          <Link href={`/anime/${meta.me.anime.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`} className="hover:text-paper underline underline-offset-4 decoration-white/20">{meta.me.anime}</Link>
          {" "}· {meta.me.count} artwork{meta.me.count > 1 ? "s" : ""}
        </p>
      )}
      {meta?.related?.length > 0 && (
        <div className="mt-5 flex flex-wrap items-center gap-2">
          <span className="text-xs text-fog mr-1">Related:</span>
          {meta.related.map((c: any) => (
            <Link key={c.slug} href={`/c/${c.slug}`} className="chip">{c.name}</Link>
          ))}
        </div>
      )}
      <div className="mt-8">
        <MasonryFeed query={{ character: params.slug }} />
      </div>
    </section>
  );
}
