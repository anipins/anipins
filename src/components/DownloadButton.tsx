"use client";
import { haptic, rememberArtwork } from "@/lib/native";
import { toast } from "./Toaster";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function DownloadButton({ artworkId, className = "btn-ghost" }: { artworkId: number; className?: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const download = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const session = await fetch("/api/auth/me", { cache: "no-store" });
      const account = await session.json();
      if (!account.user) {
        toast("Sign in to download artwork");
        router.push(`/login?next=${encodeURIComponent(window.location.pathname)}`);
        return;
      }
    haptic("success"); rememberArtwork(artworkId, "downloaded");
    const url = `/api/artworks/${artworkId}/download`;
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = `AniPins-${artworkId}`; anchor.rel = "noopener";
    document.body.appendChild(anchor); anchor.click(); anchor.remove(); toast("Download started");
    } catch {
      toast("Could not start the download", "err");
    } finally {
      setBusy(false);
    }
  };
  return <button type="button" onClick={download} disabled={busy} className={className}>{busy ? "Checking account…" : "Download"}</button>;
}
