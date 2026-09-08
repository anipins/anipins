"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "@/components/Toaster";

export default function ProfilePage() {
  const [data, setData] = useState<any>(null);
  const [guest, setGuest] = useState(false);
  const [nickname, setNickname] = useState("");
  const [avatar, setAvatar] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const load = () => fetch("/api/profile").then(async r => {
    if (r.status === 401) { setGuest(true); return; }
    if (!r.ok) throw new Error("Could not load profile");
    const next = await r.json();
    setData(next);
    setNickname(next.user.nickname || next.user.name || "");
  }).catch(() => setGuest(true));

  useEffect(() => { load(); }, []);
  useEffect(() => {
    if (!avatar) { setPreview(""); return; }
    const url = URL.createObjectURL(avatar);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [avatar]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const form = new FormData();
    form.append("nickname", nickname);
    if (avatar) form.append("avatar", avatar);
    const r = await fetch("/api/profile", { method: "PATCH", body: form });
    const result = await r.json();
    setBusy(false);
    if (!r.ok) { toast(result.error || "Could not update profile", "err"); return; }
    setAvatar(null);
    toast("Profile updated");
    load();
  };

  if (guest) return (
    <section className="mx-auto max-w-md px-6 pt-44 text-center">
      <h1 className="font-display text-3xl font-semibold">Your profile</h1>
      <p className="mt-3 text-fog">Sign in to add your nickname and profile image.</p>
      <Link href="/login" className="btn-primary mt-6">Sign in</Link>
    </section>
  );

  if (!data) return <section className="mx-auto max-w-3xl px-6 pt-32"><div className="skeleton h-96 rounded-3xl" /></section>;

  const image = preview || (data.user.avatar ? `/api/img/${data.user.avatar}` : "");
  const initial = (nickname || data.user.email || "A").slice(0, 1).toUpperCase();
  return (
    <section className="mx-auto max-w-3xl px-4 pt-28 md:px-8 md:pt-32">
      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl bg-panel p-6 hairline md:p-10">
        <div className="flex flex-col items-center gap-5 text-center sm:flex-row sm:text-left">
          <button type="button" onClick={() => inputRef.current?.click()}
            className="group relative grid h-28 w-28 shrink-0 place-items-center overflow-hidden rounded-full bg-soft text-4xl font-semibold text-gold hairline hover:border-gold-dim"
            aria-label="Choose profile image">
            {image ? <img src={image} alt="Profile preview" className="h-full w-full object-cover" /> : initial}
            <span className="absolute inset-x-0 bottom-0 bg-black/70 py-1.5 text-[11px] text-white opacity-0 transition-opacity group-hover:opacity-100">Change</span>
          </button>
          <input ref={inputRef} type="file" accept="image/*" hidden onChange={e => setAvatar(e.target.files?.[0] || null)} />
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-[0.2em] text-gold">AniPins profile</p>
            <h1 className="mt-1 truncate font-display text-3xl font-semibold">{data.user.nickname || data.user.name || "Anime fan"}</h1>
            <p className="mt-1 truncate text-sm text-fog">{data.user.email}</p>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-3 gap-3">
          {[
            [data.stats.saved_count, "Saved"],
            [data.stats.collection_count, "Collections"],
            [data.stats.liked_count, "Liked"],
          ].map(([value, label]) => (
            <div key={label} className="rounded-2xl bg-soft p-4 text-center hairline">
              <p className="font-display text-2xl font-semibold">{value}</p>
              <p className="mt-1 text-xs text-fog">{label}</p>
            </div>
          ))}
        </div>

        <form onSubmit={submit} className="mt-8 space-y-4 border-t border-paper/10 pt-7">
          <div>
            <label className="label">Nickname</label>
            <input className="input" value={nickname} minLength={2} maxLength={40} required
              onChange={e => setNickname(e.target.value)} placeholder="Choose your nickname" />
          </div>
          <div className="flex flex-wrap gap-3">
            <button disabled={busy} className="btn-primary disabled:opacity-50">{busy ? "Saving…" : "Save profile"}</button>
            <Link href="/saves" className="btn-ghost">View saved artwork</Link>
          </div>
        </form>
      </motion.div>
    </section>
  );
}
