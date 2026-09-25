"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import ArtCard from "@/components/ArtCard";

export default function VisualSearchPage() {
  const params = useSearchParams();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const run = async (request: Promise<Response>) => {
    setLoading(true); setError("");
    try { const response = await request; const data = await response.json(); if (!response.ok) throw new Error(data.error); setItems(data.items || []); }
    catch (e: any) { setError(e.message || "Visual search failed."); }
    finally { setLoading(false); }
  };
  useEffect(() => { const id = params.get("artworkId"); if (id) run(fetch(`/api/search/visual?artworkId=${encodeURIComponent(id)}`)); }, [params]);
  useEffect(() => {
    if (params.get("uploaded") !== "1") return;
    try { setItems(JSON.parse(sessionStorage.getItem("anipins-visual-results") || "[]")); } catch {}
  }, [params]);
  const upload = (file?: File) => { if (!file) return; const form = new FormData(); form.set("image", file); run(fetch("/api/search/visual", { method: "POST", body: form })); };
  return <section className="w-full px-3 pb-20 pt-28 sm:px-4 md:px-6 md:pt-32 xl:px-8">
    <div className="mx-auto mb-8 max-w-2xl text-center"><span className="badge-gold">Visual search</span><h1 className="mt-4 font-display text-3xl font-semibold md:text-5xl">Find artwork that looks similar</h1><p className="mt-3 text-fog">Choose an image to find the closest visual matches already on AniPins. Your image is analyzed temporarily and is not saved.</p><label className="btn-primary mt-6 cursor-pointer"><input type="file" accept="image/*" className="sr-only" onChange={e=>upload(e.target.files?.[0])}/>{loading ? "Searching…" : "Choose an image"}</label>{error && <p className="mt-4 text-sm text-red-400">{error}</p>}</div>
    {!!items.length && <><p className="mb-4 text-sm text-fog">Closest matches</p><div className="masonry">{items.map((art, index)=><ArtCard key={art.id} art={art} index={index}/>)}</div></>}
  </section>;
}
