"use client";

import { useEffect } from "react";

export default function NativeExternalLinks() {
  useEffect(() => {
    // Lets the web shell make the few layout adjustments that are specific to
    // the edge-to-edge Android WebView, without changing the browser version.
    if ("AniPinsAndroid" in window) document.documentElement.dataset.nativeApp = "true";

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
    return () => {
      document.removeEventListener("click", openNativeLink, true);
      delete document.documentElement.dataset.nativeApp;
    };
  }, []);
  return null;
}
