"use client";

import { useEffect } from "react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error("AniPins page error", error); }, [error]);
  return <main className="grid min-h-dvh place-items-center bg-ink px-6 text-center">
    <section className="max-w-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gold">AniPins</p>
      <h1 className="mt-3 font-display text-3xl font-semibold text-paper">That page needs a quick refresh.</h1>
      <p className="mt-3 text-sm leading-6 text-fog">Your artwork and account are safe. Please try loading this page again.</p>
      <button type="button" onClick={reset} className="btn-primary mt-6">Try again</button>
    </section>
  </main>;
}
