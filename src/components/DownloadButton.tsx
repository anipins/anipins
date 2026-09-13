"use client";
import { haptic, rememberArtwork } from "@/lib/native";
import { toast } from "./Toaster";

export default function DownloadButton({ artworkId, className = "btn-ghost" }: { artworkId: number; className?: string }) {
  const download = () => {
    haptic("success"); rememberArtwork(artworkId, "downloaded");
    const url = `/api/artworks/${artworkId}/download`;
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = `AniPins-${artworkId}`; anchor.rel = "noopener";
    document.body.appendChild(anchor); anchor.click(); anchor.remove(); toast("Download started");
  };
  return <button type="button" onClick={download} className={className}>Download</button>;
}
