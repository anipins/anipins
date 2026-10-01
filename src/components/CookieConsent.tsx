"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const STORAGE_KEY = "anipins-cookie-consent";

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // The Android app is a first-party WebView rather than a public browser.
    // It uses only essential storage, so a browser cookie banner is not useful
    // there and would cover the app's navigation.
    if ("AniPinsAndroid" in window) return;
    try { setVisible(!localStorage.getItem(STORAGE_KEY)); } catch { /* Browsing still works when storage is unavailable. */ }
  }, []);

  const choose = (choice: "accepted" | "essential") => {
    try { localStorage.setItem(STORAGE_KEY, choice); } catch {}
    window.dispatchEvent(new Event("anipins:consent"));
    setVisible(false);
  };

  if (!visible) return null;
  return (
    <aside aria-label="Cookie preferences" className="fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+1rem)] z-[110] mx-auto max-w-xl rounded-2xl border border-paper/15 bg-panel/95 p-4 shadow-2xl backdrop-blur md:bottom-5 md:p-5">
      <h2 className="font-display text-base font-semibold">Your privacy choices</h2>
      <p className="mt-1.5 text-sm leading-6 text-fog">AniPins needs essential storage for settings and sign-in. You can also allow anonymous usage measurement to help us improve speed and reliability.</p>
      <p className="mt-2 text-xs text-fog">Read our <Link href="/privacy" className="text-gold underline underline-offset-4">Privacy Policy</Link>.</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" onClick={() => choose("essential")} className="btn-ghost !px-4 !py-2.5">Essential only</button>
        <button type="button" onClick={() => choose("accepted")} className="btn-primary !px-4 !py-2.5">Allow measurement</button>
      </div>
    </aside>
  );
}
