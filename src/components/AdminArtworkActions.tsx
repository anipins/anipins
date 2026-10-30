"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { toast } from "./Toaster";

type Props = { art: any; onSaved: () => void; onDeleted: () => void };

export default function AdminArtworkActions({ art, onSaved, onDeleted }: Props) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let active = true;
    const expired = () => setIsAdmin(false);
    const load = () => fetch("/api/auth/me", { credentials: "same-origin", cache: "no-store" })
      .then(response => response.ok ? response.json() : null)
      .then(payload => {
        const user = payload?.user;
        if (active) setIsAdmin(user?.role === "ADMIN" && String(user?.email || "").trim().toLowerCase() === "anipins01@gmail.com");
      })
      .catch(() => { if (active) setIsAdmin(false); });
    void load();
    window.addEventListener("anipins:session-restored", load);
    window.addEventListener("anipins:session-expired", expired);
    return () => { active = false; window.removeEventListener("anipins:session-restored", load); window.removeEventListener("anipins:session-expired", expired); };
  }, []);

  if (!isAdmin) return null;

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const form = new FormData(event.currentTarget);
      for (const key of ["published", "featured", "premium"]) if (!form.has(key)) form.set(key, "0");
      const image = fileRef.current?.files?.[0];
      if (image) form.set("image", image);
      const response = await fetch(`/api/admin/artworks/${art.id}`, { method: "PATCH", body: form });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || "Could not save artwork changes.");
      }
      toast("Artwork updated");
      setEditing(false);
      onSaved();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not save artwork changes.");
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!window.confirm("Delete this artwork permanently? This cannot be undone.")) return;
    setBusy(true);
    try {
      const response = await fetch(`/api/admin/artworks/${art.id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Could not delete artwork.");
      window.dispatchEvent(new CustomEvent("anipins:hide-art", { detail: { id: art.id } }));
      toast("Artwork permanently deleted");
      onDeleted();
    } catch (cause) {
      toast(cause instanceof Error ? cause.message : "Could not delete artwork.", "err");
    } finally {
      setBusy(false);
    }
  };

  return <>
    <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl border border-gold/25 bg-gold/5 p-3" onClick={event => event.stopPropagation()}>
      <span className="mr-auto text-[10px] font-semibold uppercase tracking-[0.16em] text-gold">Admin tools</span>
      <button type="button" disabled={busy} onClick={() => { setError(""); setEditing(true); }} className="chip !border-gold/30 !px-3 !text-gold">Edit artwork</button>
      <button type="button" disabled={busy} onClick={() => void remove()} className="chip !border-red-500/40 !px-3 !text-red-400">Delete</button>
    </div>
    {editing && typeof document !== "undefined" && createPortal(<div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/80 p-4" onClick={() => !busy && setEditing(false)}>
      <form onSubmit={save} onClick={event => event.stopPropagation()} className="my-8 w-full max-w-xl space-y-4 rounded-2xl border border-paper/10 bg-panel p-5 shadow-2xl sm:p-7">
        <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">Admin edit</p><h3 className="mt-1 font-display text-xl">Artwork #{art.id}</h3></div><button type="button" onClick={() => setEditing(false)} className="grid h-9 w-9 place-items-center rounded-full border border-paper/15 text-xl text-fog" aria-label="Close editor">×</button></div>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-xs text-fog sm:col-span-2">Title<input name="title" defaultValue={art.title || ""} className="input mt-1" /></label>
          <label className="text-xs text-fog">Character<input name="character" defaultValue={art.character_name || ""} className="input mt-1" /></label>
          <label className="text-xs text-fog">Anime<input name="anime" defaultValue={art.anime_name || ""} className="input mt-1" /></label>
          <label className="text-xs text-fog sm:col-span-2">Tags<input name="tags" defaultValue={art.tags || ""} className="input mt-1" /></label>
          <label className="text-xs text-fog sm:col-span-2">Description<textarea name="description" rows={3} defaultValue={art.description || ""} className="input mt-1 resize-y" /></label>
          <label className="text-xs text-fog">Category<input name="category" defaultValue={art.category || ""} className="input mt-1" /></label>
          <label className="text-xs text-fog">Creator<input name="creator" defaultValue={art.creator_name || ""} className="input mt-1" /></label>
          <label className="text-xs text-fog sm:col-span-2">Source URL<input name="sourceUrl" type="url" defaultValue={art.source_url || ""} className="input mt-1" /></label>
        </div>
        <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
          {([["published", "Published"], ["featured", "Featured"], ["premium", "Premium only"]] as const).map(([name, label]) => <label key={name} className="flex items-center gap-2"><input type="checkbox" name={name} value="1" defaultChecked={!!art[name]} className="h-4 w-4 accent-[#caa45c]" />{label}</label>)}
        </div>
        <div className="flex flex-wrap items-center gap-3"><button type="button" onClick={() => fileRef.current?.click()} className="chip">Replace image</button><input ref={fileRef} type="file" name="image" accept="image/jpeg,image/png,image/webp" className="sr-only" /><span className="text-xs text-fog">JPG, PNG or WebP · up to 15 MB</span></div>
        {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
        <div className="flex gap-3"><button disabled={busy} className="btn-primary flex-1 disabled:opacity-50">{busy ? "Saving…" : "Save changes"}</button><button type="button" disabled={busy} onClick={() => setEditing(false)} className="btn-ghost">Cancel</button></div>
      </form>
    </div>, document.body)}
  </>;
}
