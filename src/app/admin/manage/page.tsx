"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "@/components/Toaster";

export default function AdminManage() {
  const [items, setItems] = useState<any[]>([]);
  const [q, setQ] = useState("");
  const [sort, setSort] = useState("latest");
  const [filter, setFilter] = useState("all");
  const [sel, setSel] = useState<Set<number>>(new Set());
  const [edit, setEdit] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    const r = await fetch(`/api/admin/artworks?q=${encodeURIComponent(q)}&sort=${sort}&filter=${filter}`);
    const d = await r.json();
    setItems(d.items || []); setLoaded(true);
  }, [q, sort, filter]);

  useEffect(() => { const t = setTimeout(load, 200); return () => clearTimeout(t); }, [load]);

  const toggle = (id: number) => setSel(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const allSelected = items.length > 0 && sel.size === items.length;

  const bulk = async (action: string) => {
    if (!sel.size) return;
    if (action === "delete" && !confirm(`Delete ${sel.size} artwork(s)? This cannot be undone.`)) return;
    setBusy(true);
    await fetch("/api/admin/bulk", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, ids: [...sel] }) });
    setSel(new Set()); setBusy(false); load();
    toast(action === "delete" ? "Artwork permanently deleted" : "Changes saved");
  };

  const one = async (id: number, body: any) => {
    await fetch(`/api/admin/artworks/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    load();
  };
  const delOne = async (id: number) => {
    if (!confirm("Delete this artwork permanently?")) return;
    await fetch(`/api/admin/artworks/${id}`, { method: "DELETE" });
    toast("Artwork permanently deleted");
    load();
  };

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search uploads…" className="input !w-64 !py-2.5" />
        <select value={sort} onChange={e => setSort(e.target.value)} className="input !w-40 !py-2.5">
          <option value="latest">Latest</option><option value="oldest">Oldest</option>
          <option value="views">Most viewed</option><option value="downloads">Most downloaded</option>
        </select>
        <select value={filter} onChange={e => setFilter(e.target.value)} className="input !w-40 !py-2.5">
          <option value="all">All</option><option value="published">Published</option>
          <option value="unpublished">Unpublished</option><option value="featured">Featured</option>
        </select>
        <label className="ml-auto flex items-center gap-2 text-sm text-fog">
          <input type="checkbox" checked={allSelected} onChange={() => setSel(allSelected ? new Set() : new Set(items.map(i => i.id)))} className="h-4 w-4 accent-white" />
          Select all
        </label>
      </div>

      <AnimatePresence>
        {sel.size > 0 && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="sticky top-20 z-30 mt-4 flex flex-wrap items-center gap-2 rounded-2xl glass hairline px-4 py-3">
            <span className="text-sm mr-2">{sel.size} selected</span>
            {["publish", "unpublish", "feature", "unfeature"].map(a => (
              <button key={a} disabled={busy} onClick={() => bulk(a)} className="chip capitalize">{a}</button>
            ))}
            <button disabled={busy} onClick={async () => {
              for (const id of sel) { const a = document.createElement("a"); a.href = `/api/artworks/${id}/download`; a.click(); await new Promise(r => setTimeout(r, 400)); }
            }} className="chip">Download</button>
            <button disabled={busy} onClick={() => bulk("delete")} className="chip !border-red-500/40 !text-red-400 hover:!bg-red-500/10">Delete</button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-6 space-y-2">
        {!loaded ? Array.from({ length: 5 }).map((_, i) => <div key={i} className="skeleton h-20 rounded-2xl" />) :
          items.length === 0 ? <p className="py-16 text-center text-fog">No artwork matches.</p> :
          items.map(a => (
            <div key={a.id} className={`flex items-center gap-4 rounded-2xl p-3 hairline transition-colors ${sel.has(a.id) ? "bg-white/[0.07]" : "bg-panel"}`}>
              <input type="checkbox" checked={sel.has(a.id)} onChange={() => toggle(a.id)} className="h-4 w-4 shrink-0 accent-white" />
              <img src={`/api/img/${a.thumb}`} className="h-14 w-14 shrink-0 rounded-xl object-cover" alt="" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{a.title || a.character_name}
                  {a.featured ? <span className="ml-2 rounded bg-white/10 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-fog">Featured</span> : null}
                  {!a.published ? <span className="ml-2 rounded bg-yellow-500/15 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-yellow-300">Draft</span> : null}
                </p>
                <p className="truncate text-xs text-fog">{a.character_name} · {a.anime_name} · {a.views} views · {a.downloads} downloads</p>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                <button onClick={() => setEdit(a)} className="chip !px-3">Edit</button>
                <button onClick={() => one(a.id, { published: a.published ? 0 : 1 })} className="chip !px-3">{a.published ? "Unpublish" : "Publish"}</button>
                <button onClick={() => one(a.id, { featured: a.featured ? 0 : 1 })} className="chip !px-3 hidden sm:inline-flex">{a.featured ? "Unfeature" : "Feature"}</button>
                <a href={`/api/artworks/${a.id}/download`} className="chip !px-3 hidden sm:inline-flex">Download</a>
                <button onClick={() => delOne(a.id)} className="chip !px-3 !border-red-500/40 !text-red-400 hover:!bg-red-500/10">Delete</button>
              </div>
            </div>
          ))}
      </div>

      <AnimatePresence>{edit && <EditModal art={edit} onClose={() => setEdit(null)} onSaved={() => { setEdit(null); load(); }} />}</AnimatePresence>
    </div>
  );
}

function EditModal({ art, onClose, onSaved }: { art: any; onClose: () => void; onSaved: () => void }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); setBusy(true); setErr("");
    const fd = new FormData(e.currentTarget);
    if (!fd.get("featured")) fd.set("featured", "0");
    const f = fileRef.current?.files?.[0];
    if (f) fd.set("image", f);
    const r = await fetch(`/api/admin/artworks/${art.id}`, { method: "PATCH", body: fd });
    setBusy(false);
    if (!r.ok) { setErr("Save failed"); return; }
    onSaved();
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 p-4 overflow-y-auto" onClick={onClose}>
      <motion.form initial={{ scale: 0.96, y: 14 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96, y: 14 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        onClick={e => e.stopPropagation()} onSubmit={submit}
        className="my-8 w-full max-w-lg space-y-4 rounded-2xl bg-panel hairline p-6 shadow-2xl">
        <h3 className="font-display text-xl font-medium">Edit artwork #{art.id}</h3>
        <div className="flex items-center gap-4">
          <img src={preview || `/api/img/${art.thumb}`} className="h-20 w-20 rounded-xl object-cover" alt="" />
          <div>
            <button type="button" onClick={() => fileRef.current?.click()} className="chip">Replace image</button>
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={e => {
              const f = e.target.files?.[0]; if (!f) return;
              const r = new FileReader(); r.onload = () => setPreview(String(r.result)); r.readAsDataURL(f);
            }} />
          </div>
        </div>
        <div><label className="label">Title</label><input name="title" defaultValue={art.title} className="input" /></div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><label className="label">Character</label><input name="character" defaultValue={art.character_name} className="input" /></div>
          <div><label className="label">Anime</label><input name="anime" defaultValue={art.anime_name} className="input" /></div>
        </div>
        <div><label className="label">Tags</label><input name="tags" defaultValue={art.tags} className="input" /></div>
        <div><label className="label">Description</label><textarea name="description" rows={2} defaultValue={art.description} className="input resize-none" /></div>
        <div><label className="label">Category</label>
          <select name="category" defaultValue={art.category} className="input">
            <option value="">None</option><option>Male Characters</option><option>Female Characters</option>
            <option>Wallpapers</option><option>Action</option><option>Aesthetic</option>
          </select>
        </div>
        <label className="flex items-center gap-3 text-sm">
          <input type="checkbox" name="featured" value="1" defaultChecked={!!art.featured} className="h-4 w-4 accent-white" /> Featured
        </label>
        {err && <p className="text-sm text-red-400">{err}</p>}
        <div className="flex gap-3">
          <button disabled={busy} className="btn-primary flex-1 disabled:opacity-50">{busy ? "Saving…" : "Save changes"}</button>
          <button type="button" onClick={onClose} className="btn-ghost">Cancel</button>
        </div>
      </motion.form>
    </motion.div>
  );
}
