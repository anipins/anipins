"use client";
import { haptic, rememberArtwork } from "@/lib/native";
import { toast } from "./Toaster";
import { useState } from "react";

export default function DownloadButton({ artworkId, className = "btn-ghost" }: { artworkId: number; className?: string }) {
  const [busy, setBusy] = useState(false);
  const download = async () => {
    if (busy) return;
    setBusy(true);
    try {
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
