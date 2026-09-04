"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function Saves() {
  const [cols, setCols] = useState<any[] | null>(null);
  const [guest, setGuest] = useState(false);
  const [name, setName] = useState("");
  const router = useRouter();

  const load = () => fetch("/api/collections").then(r => r.json()).then(d => { setCols(d.collections || []); setGuest(!!d.guest); });
  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!name.trim()) return;
    await fetch("/api/collections", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name }) });
    setName(""); load();
  };
  const del = async (id: number) => {
    if (!confirm("Delete this collection? Saved artworks inside will be removed from it.")) return;
    await fetch(`/api/collections/${id}`, { method: "DELETE" }); load();
  };

  if (guest) return (
    <section className="mx-auto max-w-md px-6 pt-44 text-center">
      <h1 className="font-display text-3xl font-semibold">Your collections</h1>
      <p className="mt-3 text-fog">Sign in to save artwork and organise collections like Drawing References, Wallpapers or Favourite Characters.</p>
      <button onClick={() => router.push("/login")} className="btn-primary mt-6">Sign in</button>
    </section>
  );

  return (
    <section className="mx-auto max-w-[1400px] px-4 md:px-8 pt-28 md:pt-32">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold md:text-4xl">Collections</h1>
          <p className="mt-1 text-sm text-fog">Your saved artwork, organised your way.</p>
        </div>
        <div className="flex gap-2">
          <input value={name} onChange={e => setName(e.target.value)} onKeyDown={e => e.key === "Enter" && create()}
            placeholder="e.g. Drawing References" className="input !w-60 !py-2.5" />
          <button onClick={create} className="btn-primary !py-2.5">Create</button>
        </div>
      </div>
      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {cols === null ? Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-52 rounded-2xl" />) :
          cols.length === 0 ? <p className="col-span-full py-16 text-center text-fog">No collections yet — save an artwork or create one above.</p> :
          cols.map((c, i) => (
            <motion.div key={c.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05, duration: 0.45 }}
              className="group relative overflow-hidden rounded-2xl hairline bg-soft">
              <Link href={`/saves/${c.id}`} className="block">
                <div className="aspect-[4/3] overflow-hidden bg-panel">
                  {c.cover ? <img src={`/api/img/${c.cover}`} alt={c.name} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    : <div className="grid h-full place-items-center text-3xl text-fog/40">▦</div>}
                </div>
                <div className="p-4">
                  <p className="font-medium">{c.name}</p>
                  <p className="text-xs text-fog">{c.count} saved</p>
                </div>
              </Link>
              <button onClick={() => del(c.id)} title="Delete collection"
                className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-black/60 opacity-0 backdrop-blur transition-opacity group-hover:opacity-100 hover:bg-red-500/70">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>
              </button>
            </motion.div>
          ))}
      </div>
    </section>
  );
}
