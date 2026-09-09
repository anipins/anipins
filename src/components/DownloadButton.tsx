"use client";
import { useState } from "react";
import { haptic, rememberArtwork } from "@/lib/native";
import { toast } from "./Toaster";

export default function DownloadButton({ artworkId, className = "btn-ghost" }: { artworkId: number; className?: string }) {
  const [progress, setProgress] = useState<number | null>(null);
  const download = async () => {
    haptic("success"); rememberArtwork(artworkId, "downloaded");
    const url = `/api/artworks/${artworkId}/download`;
    if (window.AniPinsAndroid) { const a=document.createElement("a"); a.href=url; a.click(); toast("Download started — Android will notify you when it is ready"); return; }
    try {
      setProgress(0); const r=await fetch(url); if(!r.ok||!r.body) throw new Error();
      const total=Number(r.headers.get("Content-Length")||0), reader=r.body.getReader(); let received=0; const parts:Uint8Array[]=[];
      for(;;){const {done,value}=await reader.read();if(done)break;if(value){parts.push(value);received+=value.length;if(total)setProgress(Math.round(received/total*100));}}
      const blob=new Blob(parts as BlobPart[],{type:r.headers.get("Content-Type")||"image/jpeg"}); const object=URL.createObjectURL(blob); const a=document.createElement("a");a.href=object;a.download=`AniPins-${artworkId}.jpg`;a.click();setTimeout(()=>URL.revokeObjectURL(object),30000);toast("Artwork downloaded");
    } catch { location.href=url; toast("Download started"); } finally { setProgress(null); }
  };
  return <button type="button" onClick={download} disabled={progress!==null} className={className}>{progress===null?"Download":progress?`${progress}%`:"Preparing…"}</button>;
}
