"use client";

import { useEffect, useState } from "react";
import MasonryFeed from "@/components/MasonryFeed";

export default function PremiumLibrary() {
  const [state, setState] = useState<"loading" | "locked" | "open">("loading");
  useEffect(() => { fetch("/api/billing/status", { cache: "no-store" }).then(r => r.ok ? r.json() : null).then(data => setState(data?.premium ? "open" : "locked")).catch(() => setState("locked")); }, []);
  if (state === "loading") return <p className="mt-10 text-center text-sm text-fog">Checking Premium access…</p>;
  if (state === "locked") return <p className="mt-10 text-center text-sm text-fog">Subscribe above to unlock exclusive reference collections here.</p>;
  return <section className="mt-12"><h2 className="font-display text-3xl font-semibold">Exclusive reference collections</h2><p className="mt-2 text-fog">Artwork in this library is not shown in the public AniPins feed.</p><div className="mt-6"><MasonryFeed query={{ premium: "1" }} /></div></section>;
}
