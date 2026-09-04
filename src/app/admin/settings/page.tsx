"use client";
import { useEffect, useState } from "react";
import { toast } from "@/components/Toaster";

export default function AdminSettings() {
  const [s, setS] = useState<any>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => { fetch("/api/settings").then(r => r.json()).then(d => setS(d.settings)); }, []);

  const saveSocial = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); setBusy(true);
    const fd = new FormData(e.currentTarget);
    const r = await fetch("/api/admin/settings", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        site_name: fd.get("site_name"), tagline: fd.get("tagline"),
        instagram_handle: fd.get("instagram_handle"), instagram_url: fd.get("instagram_url"),
      }),
    });
    setBusy(false);
    r.ok ? toast("Changes saved") : toast("Unable to save settings", "err");
  };

  if (!s) return <div className="text-fog">Loading settings…</div>;
  const deployUrl = typeof location !== "undefined" ? location.origin : "";

  return (
    <div className="max-w-2xl space-y-10">
      <div>
        <h1 className="font-display text-2xl font-semibold md:text-3xl">Settings</h1>
        <p className="mt-1 text-sm text-fog">Brand, social links and deployment.</p>
      </div>

      <form onSubmit={saveSocial} className="space-y-4 rounded-2xl bg-panel border border-line p-6">
        <p className="text-[11px] uppercase tracking-widest text-gold/80">Site & Social Links</p>
        <div><label className="label">Site name</label><input name="site_name" defaultValue={s.site_name} className="input" /></div>
        <div><label className="label">Tagline</label><input name="tagline" defaultValue={s.tagline} className="input" /></div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><label className="label">Instagram handle</label><input name="instagram_handle" defaultValue={s.instagram_handle} className="input" /></div>
          <div><label className="label">Instagram URL</label><input name="instagram_url" defaultValue={s.instagram_url} className="input" /></div>
        </div>
        <button disabled={busy} className="btn-primary disabled:opacity-50">{busy ? "Saving…" : "Save changes"}</button>
      </form>

      <div className="rounded-2xl bg-panel border border-line p-6">
        <p className="text-[11px] uppercase tracking-widest text-gold/80">Branding assets</p>
        <p className="mt-2 text-sm text-fog">All AniPins brand files live in <code className="text-paper">/public/brand/</code> and are used across the site automatically.</p>
        <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-5">
          {["ap-symbol.svg", "logo-horizontal-dark.svg", "instagram-profile-256.png", "og-image.png", "watermark-gold.png"].map(f => (
            <a key={f} href={`/brand/${f}`} target="_blank" className="group rounded-xl border border-line p-2 hover:border-gold-dim transition-colors">
              <img src={`/brand/${f}`} alt={f} className="h-16 w-full object-contain" />
              <p className="mt-1.5 truncate text-center text-[10px] text-fog group-hover:text-paper">{f}</p>
            </a>
          ))}
        </div>
        <a href="/brand/instagram-profile-1080.png" download className="btn-ghost mt-4 !py-2.5">Download Instagram profile logo (1080×1080)</a>
      </div>

      <div className="rounded-2xl bg-panel border border-line p-6">
        <p className="text-[11px] uppercase tracking-widest text-gold/80">Domain & Deployment</p>
        <div className="mt-4 space-y-3 text-sm">
          <div className="flex items-center justify-between rounded-xl bg-soft px-4 py-3">
            <span className="text-fog">Deployment URL</span>
            <span className="font-medium text-paper truncate max-w-[55%]">{deployUrl}</span>
          </div>
          <div className="flex items-center justify-between rounded-xl bg-soft px-4 py-3">
            <span className="text-fog">Custom Domain</span>
            <span className="rounded-full border border-line px-3 py-1 text-xs text-fog">Not Connected</span>
          </div>
          <p className="text-xs leading-relaxed text-fog">
            To connect your custom AniPins domain: deploy this project to a host (e.g. Vercel), add your purchased domain in the host's
            dashboard, and point your DNS (A / CNAME records) at it. HTTPS is issued automatically. No domain has been purchased or
            connected yet — the deployment URL above is the canonical address.
          </p>
        </div>
      </div>
    </div>
  );
}
