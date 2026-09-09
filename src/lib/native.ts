export type OfflineArtwork = { id: number; title: string; character_name: string; anime_name: string; thumb: string; orig: string; savedAt: number; kind: "saved" | "downloaded" };

declare global { interface Window { AniPinsAndroid?: { haptic?: (kind: string) => void; openDownloads?: () => void; getVersionCode?: () => number; showNotification?: (title: string, body: string, url: string) => void } } }

export function haptic(kind = "tap") { try { window.AniPinsAndroid?.haptic?.(kind); } catch {} }

export async function rememberArtwork(id: number, kind: "saved" | "downloaded") {
  try {
    const response = await fetch(`/api/artworks/${id}`, { cache: "no-store" });
    if (!response.ok) return;
    const art = (await response.json()).art;
    const entry: OfflineArtwork = { id: art.id, title: art.title, character_name: art.character_name, anime_name: art.anime_name, thumb: art.thumb, orig: art.orig, savedAt: Date.now(), kind };
    const old: OfflineArtwork[] = JSON.parse(localStorage.getItem("anipins-offline-library") || "[]");
    localStorage.setItem("anipins-offline-library", JSON.stringify([entry, ...old.filter(x => x.id !== id || x.kind !== kind)].slice(0, 100)));
    if ("caches" in window) {
      const cache = await caches.open("anipins-artwork-v1");
      await Promise.all([`/api/img/${art.thumb}`, `/api/img/${art.orig}`].map(async url => { try { await cache.add(url); } catch {} }));
    }
  } catch {}
}
