"use client";

import { useEffect } from "react";

export default function NativeExternalLinks() {
  useEffect(() => {
    const openNativeLink = (event: MouseEvent) => {
      const anchor = (event.target as HTMLElement | null)?.closest("a");
      if (!anchor?.href) return;
      try {
        const url = new URL(anchor.href);
        if ((url.hostname === "instagram.com" || url.hostname === "www.instagram.com") && window.AniPinsAndroid?.openInstagram) {
          event.preventDefault();
          window.AniPinsAndroid.openInstagram();
        }
      } catch {}
    };
    document.addEventListener("click", openNativeLink, true);
    return () => document.removeEventListener("click", openNativeLink, true);
  }, []);
  return null;
}
