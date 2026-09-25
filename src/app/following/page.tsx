"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import MasonryFeed from "@/components/MasonryFeed";

export default function FollowingPage() {
  const [state, setState] = useState<"loading" | "guest" | "empty" | "ready">("loading");
  useEffect(() => {
    fetch("/api/follows", { cache: "no-store" }).then(r => r.json()).then(d => {
      if (d.guest) setState("guest"); else if (!(d.follows || []).length) setState("empty"); else setState("ready");
    }).catch(() => setState("guest"));
  }, []);
  return <section className="w-full px-3 pt-28 sm:px-4 md:px-6 md:pt-32 xl:px-8">
    <h1 className="font-display text-3xl font-semibold md:text-4xl">Following</h1>
    <p className="mb-6 mt-1 text-sm text-fog">The newest artwork from characters and series you follow.</p>
    {state === "loading" && <div className="skeleton h-80 rounded-3xl" />}
    {state === "guest" && <div className="rounded-3xl bg-panel p-10 text-center hairline"><h2 className="font-display text-2xl">Your personal feed</h2><p className="mx-auto mt-2 max-w-md text-sm text-fog">Sign in, then follow characters and anime to see their latest artwork here.</p><Link href="/login" className="btn-primary mt-5">Sign in</Link></div>}
    {state === "empty" && <div className="rounded-3xl bg-panel p-10 text-center hairline"><h2 className="font-display text-2xl">Follow your favourites</h2><p className="mx-auto mt-2 max-w-md text-sm text-fog">Open any artwork and follow its character or series. New additions will appear here.</p><Link href="/explore" className="btn-primary mt-5">Explore artwork</Link></div>}
    {state === "ready" && <MasonryFeed query={{ sort: "following" }} />}
  </section>;
}
