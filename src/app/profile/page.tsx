"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "@/components/Toaster";

export default function ProfilePage() {
  const [data, setData] = useState<any>(null);
  const [guest, setGuest] = useState(false);
  const [nickname, setNickname] = useState("");
  const [bio, setBio] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [avatar, setAvatar] = useState<File | null>(null);
  const [cover, setCover] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [coverPreview, setCoverPreview] = useState("");
  const [busy, setBusy] = useState(false);
  const avatarRef = useRef<HTMLInputElement>(null);
  const coverRef = useRef<HTMLInputElement>(null);

  const load = () => fetch("/api/profile", { cache: "no-store" }).then(async r => {
    if (r.status === 401) { setGuest(true); return; }
    if (!r.ok) throw new Error("Could not load profile");
    const next = await r.json(); setData(next);
    setNickname(next.user.nickname || next.user.name || "");
    setBio(next.user.bio || ""); setIsPublic(!!next.user.is_public);
  }).catch(() => setGuest(true));

  useEffect(() => { load(); }, []);
  useEffect(() => { if (!avatar) { setAvatarPreview(""); return; } const u=URL.createObjectURL(avatar); setAvatarPreview(u); return () => URL.revokeObjectURL(u); }, [avatar]);
  useEffect(() => { if (!cover) { setCoverPreview(""); return; } const u=URL.createObjectURL(cover); setCoverPreview(u); return () => URL.revokeObjectURL(u); }, [cover]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true);
    const form = new FormData(); form.append("nickname", nickname); form.append("bio", bio); form.append("isPublic", isPublic ? "1" : "0");
    if (avatar) form.append("avatar", avatar); if (cover) form.append("cover", cover);
    const r = await fetch("/api/profile", { method: "PATCH", body: form }); const result = await r.json(); setBusy(false);
    if (!r.ok) { toast(result.error || "Could not update profile", "err"); return; }
    setAvatar(null); setCover(null); toast("Profile updated"); load();
  };

  if (guest) return <section className="mx-auto max-w-md px-6 pt-44 text-center"><h1 className="font-display text-3xl font-semibold">Your profile</h1><p className="mt-3 text-fog">Sign in to build your AniPins profile and personalized feed.</p><Link href="/login" className="btn-primary mt-6">Sign in</Link></section>;
  if (!data) return <section className="mx-auto max-w-5xl px-6 pt-32"><div className="skeleton h-96 rounded-3xl" /></section>;

  const avatarUrl = avatarPreview || (data.user.avatar ? `/api/img/${data.user.avatar}` : "");
  const coverUrl = coverPreview || (data.user.cover ? `/api/img/${data.user.cover}` : "");
  const initial = (nickname || data.user.email || "A").slice(0, 1).toUpperCase();
  return <section className="mx-auto max-w-5xl px-4 pb-12 pt-28 md:px-8 md:pt-32">
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="overflow-hidden rounded-3xl bg-panel hairline">
      <button type="button" onClick={() => coverRef.current?.click()} className="group relative block h-44 w-full overflow-hidden bg-gradient-to-br from-gold/20 via-soft to-ink text-sm text-fog md:h-64">
        {coverUrl && <img src={coverUrl} alt="Profile cover" className="h-full w-full object-cover" />}
        <span className="absolute bottom-3 right-3 rounded-full bg-black/70 px-4 py-2 text-xs text-white opacity-80 group-hover:opacity-100">Change cover</span>
      </button>
      <input ref={coverRef} type="file" accept="image/*" hidden onChange={e => setCover(e.target.files?.[0] || null)} />
      <div className="px-6 pb-7 md:px-10">
        <div className="-mt-14 flex flex-col items-start gap-4 sm:flex-row sm:items-end">
          <button type="button" onClick={() => avatarRef.current?.click()} className="relative z-10 grid h-28 w-28 shrink-0 place-items-center overflow-hidden rounded-full border-4 border-panel bg-soft text-4xl font-semibold text-gold shadow-xl">
            {avatarUrl ? <img src={avatarUrl} alt="Profile" className="h-full w-full object-cover" /> : initial}
          </button>
          <input ref={avatarRef} type="file" accept="image/*" hidden onChange={e => setAvatar(e.target.files?.[0] || null)} />
          <div className="min-w-0 pb-1"><p className="text-xs uppercase tracking-[0.2em] text-gold">AniPins profile</p><h1 className="truncate font-display text-3xl font-semibold">{data.user.nickname || data.user.name || "Anime fan"}</h1><p className="truncate text-sm text-fog">{data.user.email}</p></div>
          {isPublic && <Link href={`/u/${data.user.id}`} className="btn-ghost ml-auto !py-2">View public profile</Link>}
        </div>
        {data.user.bio && <p className="mt-5 max-w-2xl text-sm leading-relaxed text-fog">{data.user.bio}</p>}
        <div className="mt-6 grid grid-cols-3 gap-3">{[[data.stats.saved_count,"Saved"],[data.stats.collection_count,"Collections"],[data.stats.liked_count,"Liked"]].map(([v,l]) => <div key={String(l)} className="rounded-2xl bg-soft p-4 text-center hairline"><p className="font-display text-2xl font-semibold">{v}</p><p className="mt-1 text-xs text-fog">{l}</p></div>)}</div>
        <form onSubmit={submit} className="mt-8 grid gap-4 border-t border-paper/10 pt-7 md:grid-cols-2">
          <div><label className="label">Nickname</label><input className="input" value={nickname} minLength={2} maxLength={40} required onChange={e => setNickname(e.target.value)} /></div>
          <div><label className="label">Profile visibility</label><button type="button" onClick={() => setIsPublic(v => !v)} className="input flex items-center justify-between text-left"><span>{isPublic ? "Public profile" : "Private profile"}</span><span className={`h-6 w-11 rounded-full p-1 transition-colors ${isPublic ? "bg-gold" : "bg-paper/15"}`}><span className={`block h-4 w-4 rounded-full bg-white transition-transform ${isPublic ? "translate-x-5" : ""}`} /></span></button></div>
          <div className="md:col-span-2"><label className="label">Bio <span className="text-fog">({bio.length}/240)</span></label><textarea className="input resize-none" rows={3} maxLength={240} value={bio} onChange={e => setBio(e.target.value)} placeholder="Tell other anime fans about yourself…" /></div>
          <div className="flex flex-wrap gap-3 md:col-span-2"><button disabled={busy} className="btn-primary disabled:opacity-50">{busy ? "Saving…" : "Save profile"}</button><Link href="/saves" className="btn-ghost">Manage collections</Link></div>
        </form>
      </div>
    </motion.div>
    <section className="mt-10"><h2 className="font-display text-2xl font-semibold">Your collections</h2><div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">{data.collections.length ? data.collections.map((c:any)=><Link key={c.id} href={`/saves/${c.id}`} className="overflow-hidden rounded-2xl bg-panel hairline hover:border-gold-dim"><div className="aspect-[4/3] bg-soft">{c.cover&&<img src={`/api/img/${c.cover}`} alt="" className="h-full w-full object-cover"/>}</div><div className="p-3"><p className="font-medium">{c.name}</p><p className="text-xs text-fog">{c.count} artwork</p></div></Link>):<p className="col-span-full text-sm text-fog">Collections appear here after you save artwork.</p>}</div></section>
    <section className="mt-10"><h2 className="font-display text-2xl font-semibold">Liked artwork</h2><div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">{data.liked.length ? data.liked.map((a:any)=><Link key={a.id} href={`/a/${a.id}`} className="group overflow-hidden rounded-2xl bg-soft hairline"><img src={`/api/img/${a.thumb}`} alt={a.title||a.character_name} className="aspect-[3/4] w-full object-cover transition-transform group-hover:scale-105"/><p className="truncate p-2 text-xs">{a.character_name}</p></Link>):<p className="col-span-full text-sm text-fog">Artwork you like will appear here.</p>}</div></section>
  </section>;
}
