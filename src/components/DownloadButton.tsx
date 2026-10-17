"use client";
import { haptic, rememberArtwork } from "@/lib/native";
import { toast } from "./Toaster";
import { useState } from "react";

export default function DownloadButton({ artworkId, className = "btn-ghost", iconOnly = false }: { artworkId: number; className?: string; iconOnly?: boolean }) {
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
  return (
    <button
      type="button"
      onClick={download}
      disabled={busy}
      className={className}
      aria-label={busy ? "Starting download" : "Download artwork"}
      title="Download artwork"
    >
      {iconOnly ? <span className="sr-only">Download artwork</span> : null}
      <svg className={`h-4 w-4 shrink-0 ${iconOnly ? "" : "hidden"}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {busy ? <><path d="M12 3v3m0 12v3M3 12h3m12 0h3"/><circle cx="12" cy="12" r="7" strokeDasharray="30 14"/></> : <><path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 17v3h14v-3"/></>}
      </svg>
      {!iconOnly && (busy ? "Checking account…" : "Download")}
    </button>
  );
}
