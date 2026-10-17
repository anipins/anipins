"use client";

import { useEffect, useState } from "react";

type Preview = { id: number };

export default function PremiumPreviews() {
  const [previews, setPreviews] = useState<Preview[]>([]);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/premium-preview", { signal: controller.signal, credentials: "same-origin" })
      .then(response => response.ok ? response.json() : Promise.reject(new Error("Preview request failed")))
      .then(data => setPreviews(Array.isArray(data?.previews) ? data.previews : []))
      .catch(error => { if (error?.name !== "AbortError") setPreviews([]); });
    return () => controller.abort();
  }, []);

  return <div className="mt-7 grid gap-3 sm:grid-cols-3">
    {Array.from({ length: 3 }, (_, index) => {
      const preview = previews[index];
      return <div key={preview?.id || index} className="group relative min-h-52 overflow-hidden rounded-2xl border border-paper/10 bg-soft sm:min-h-64">
        {preview
          ? <img src={`/api/premium-preview/${preview.id}`} alt="Blurred Premium artwork preview" loading="lazy" decoding="async" fetchPriority="low" className="absolute inset-0 h-full w-full scale-110 object-cover opacity-80" />
          : <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_25%,rgba(212,170,85,.35),transparent_35%),linear-gradient(135deg,#302516,#111)]" />}
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,.08),rgba(0,0,0,.82))]" />
        <div className="absolute inset-0 grid place-items-center"><span className="grid h-12 w-12 place-items-center rounded-full border border-gold/50 bg-black/60 text-gold backdrop-blur"><svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><rect x="4" y="10" width="16" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3" /></svg></span></div>
        <div className="absolute inset-x-0 bottom-0 p-4"><p className="text-[10px] font-semibold uppercase tracking-[.22em] text-gold">Private drop {String(index + 1).padStart(2, "0")}</p><p className="mt-1 text-sm font-medium text-paper">Unlock the full member collection</p></div>
      </div>;
    })}
  </div>;
}
