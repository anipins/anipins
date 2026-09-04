"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import ArtCard from "@/components/ArtCard";

export default function CollectionPage({ params }: { params: { id: string } }) {
  const [data, setData] = useState<any>(null);
  const [err, setErr] = useState(false);
  const load = () => fetch(`/api/collections/${params.id}`).then(r => r.ok ? r.json() : Promise.reject()).then(setData).catch(() => setErr(true));
  useEffect(() => { load(); }, [params.id]);

  const remove = async (artworkId: number) => {
    await fetch("/api/saves", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ artworkId, collectionId: parseInt(params.id), remove: true }) });
    load();
  };

  if (err) return <div className="pt-40 text-center text-fog">Collection not found. <Link href="/saves" className="underline">Back</Link></div>;
  return (
    <section className="mx-auto max-w-[1600px] px-4 md:px-8 pt-28 md:pt-32">
      <Link href="/saves" className="text-sm text-fog hover:text-paper">← Collections</Link>
      <h1 className="mt-2 font-display text-3xl font-semibold md:text-4xl">{data?.collection?.name || "…"}</h1>
      <p className="mt-1 mb-8 text-sm text-fog">{data?.items?.length ?? 0} saved artwork{(data?.items?.length ?? 0) === 1 ? "" : "s"}</p>
      {data && data.items.length === 0 && <p className="py-16 text-center text-fog">Nothing saved here yet.</p>}
      <div className="masonry">
        {data?.items?.map((a: any, i: number) => (
          <div key={a.id} className="relative group/wrap">
            <ArtCard art={a} index={i} />
            <button onClick={() => remove(a.id)} title="Remove from collection"
              className="absolute right-2 top-2 z-10 grid h-8 w-8 place-items-center rounded-full bg-black/60 opacity-0 backdrop-blur transition-opacity group-hover/wrap:opacity-100 hover:bg-red-500/70">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
