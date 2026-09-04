"use client";
import { useState } from "react";

export default function Copyright() {
  const [done, setDone] = useState(false);
  const [err, setErr] = useState("");
  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const r = await fetch("/api/takedown", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: fd.get("name"), email: fd.get("email"), artworkUrl: fd.get("url"), reason: fd.get("reason") }),
    });
    if (r.ok) setDone(true); else setErr("Please fill in email and reason.");
  };
  return (
    <section className="mx-auto max-w-2xl px-6 pt-28 md:pt-32">
      <h1 className="font-display text-3xl font-semibold md:text-4xl">Copyright / Content Removal</h1>
      <p className="mt-3 text-sm leading-relaxed text-fog">
        AniPins curates anime fan artwork for inspiration. All characters and source material belong to their respective copyright holders.
        If you are a rights owner and would like content removed, submit a request below and we will review it promptly.
        You can also reach us at <a href="mailto:anipins01@gmail.com" className="underline decoration-white/30 underline-offset-4 hover:text-paper">anipins01@gmail.com</a>.
      </p>
      {done ? (
        <div className="mt-8 rounded-2xl bg-panel hairline p-6 text-sm">✓ Your request has been received. We'll review it and respond via email.</div>
      ) : (
        <form onSubmit={submit} className="mt-8 space-y-4 rounded-2xl bg-panel hairline p-6">
          <div><label className="label">Your name</label><input name="name" className="input" placeholder="Full name" /></div>
          <div><label className="label">Email *</label><input name="email" type="email" required className="input" placeholder="you@example.com" /></div>
          <div><label className="label">Artwork URL</label><input name="url" className="input" placeholder="https://…/a/123" /></div>
          <div><label className="label">Reason / details *</label><textarea name="reason" required rows={4} className="input resize-none" placeholder="Describe your ownership and the content you want removed…" /></div>
          {err && <p className="text-sm text-red-400">{err}</p>}
          <button className="btn-primary w-full">Submit removal request</button>
        </form>
      )}
    </section>
  );
}
