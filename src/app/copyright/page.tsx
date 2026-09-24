"use client";
import { useState } from "react";

export default function Copyright() {
  const [done, setDone] = useState(false);
  const [err, setErr] = useState("");
  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErr("");
    const fd = new FormData(e.currentTarget);
    try {
      const r = await fetch("/api/takedown", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: fd.get("name"), email: fd.get("email"), artworkUrl: fd.get("url"),
          copyrightedWork: fd.get("work"), authority: fd.get("authority"), reason: fd.get("reason"),
          signature: fd.get("signature"), goodFaith: fd.get("goodFaith") === "on", accuracy: fd.get("accuracy") === "on",
        }),
      });
      const result = await r.json().catch(() => ({}));
      if (r.ok) setDone(true);
      else setErr(result.error || "We could not submit your request. Please check the form and try again.");
    } catch {
      setErr("We could not connect to AniPins. Check your connection and try again.");
    }
  };
  return (
    <section className="mx-auto max-w-2xl px-6 pt-28 md:pt-32">
      <h1 className="font-display text-3xl font-semibold md:text-4xl">Copyright / Content Removal</h1>
      <p className="mt-3 text-sm leading-relaxed text-fog">
        AniPins curates anime fan artwork for inspiration. All characters and source material belong to their respective copyright holders.
        If you are a creator, rights owner or authorized representative and would like content reviewed or removed, submit a complete request below. AniPins may contact you for clarification and may provide relevant details of a claim to the person responsible for the content when appropriate.
        You can also reach us at <a href="mailto:anipins01@gmail.com" className="underline decoration-white/30 underline-offset-4 hover:text-paper">anipins01@gmail.com</a>.
      </p>
      <div className="mt-6 rounded-2xl border border-paper/10 bg-soft p-5 text-sm leading-6 text-fog"><p className="font-medium text-paper">Before submitting</p><p className="mt-2">Identify the protected work and the exact AniPins page, explain your authority to act, and provide a truthful statement. Knowingly false claims may cause harm to creators and users. This form is for intellectual-property or content-removal requests; use the artwork Report option for incorrect labels, duplicates or general safety concerns.</p></div>
      {done ? (
        <div className="mt-8 rounded-2xl bg-panel hairline p-6 text-sm">✓ Your request has been received. We'll review it and respond via email.</div>
      ) : (
        <form onSubmit={submit} className="mt-8 space-y-4 rounded-2xl bg-panel hairline p-6">
          <div><label className="label">Your legal name *</label><input name="name" required className="input" placeholder="Full name" /></div>
          <div><label className="label">Email *</label><input name="email" type="email" required className="input" placeholder="you@example.com" /></div>
          <div><label className="label">Copyrighted work *</label><textarea name="work" required rows={3} className="input resize-none" placeholder="Identify the original work and, if available, provide an official or source URL…" /></div>
          <div><label className="label">AniPins artwork URL *</label><input name="url" type="url" required className="input" placeholder="https://anipins.com/a/123" /></div>
          <div><label className="label">Authority to act *</label><select name="authority" required className="input"><option value="">Select one</option><option value="Rights owner">I am the rights owner or creator</option><option value="Authorized representative">I am authorized to act for the rights owner</option></select></div>
          <div><label className="label">Reason / details *</label><textarea name="reason" required rows={5} className="input resize-none" placeholder="Explain the rights involved, what should be removed and any supporting information…" /></div>
          <label className="flex items-start gap-3 text-sm text-fog"><input name="goodFaith" type="checkbox" required className="mt-1 accent-[#C6A15B]"/><span>I have a good-faith belief that the disputed use is not authorized by the rights owner, its agent or applicable law.</span></label>
          <label className="flex items-start gap-3 text-sm text-fog"><input name="accuracy" type="checkbox" required className="mt-1 accent-[#C6A15B]"/><span>I confirm that this request is accurate and that I am the rights owner or authorized to act for the rights owner.</span></label>
          <div><label className="label">Electronic signature *</label><input name="signature" required className="input" placeholder="Type your full legal name" /></div>
          {err && <p className="text-sm text-red-400">{err}</p>}
          <button className="btn-primary w-full">Submit removal request</button>
        </form>
      )}
    </section>
  );
}
