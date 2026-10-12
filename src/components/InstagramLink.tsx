"use client";

import type { AnchorHTMLAttributes, MouseEvent, ReactNode } from "react";

// Use the canonical profile URL, rather than a session-specific shared-link token.
// This remains valid for every visitor and provides a reliable browser fallback.
export const INSTAGRAM_WEB_URL = "https://www.instagram.com/anipins.verse/";
export const INSTAGRAM_APP_URL = "instagram://user?username=anipins.verse";

type Props = AnchorHTMLAttributes<HTMLAnchorElement> & {
  children: ReactNode;
};

export default function InstagramLink({ children, onClick, ...props }: Props) {
  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event);
    if (event.defaultPrevented || typeof window === "undefined") return;

    const mobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (!mobile) return;

    const nativeInstagram = (window as any).AniPinsAndroid?.openInstagram;
    if (typeof nativeInstagram === "function") {
      // Older installed AniPins APKs hardcode the previous profile in this
      // native method, so calling it would open the WRONG account. Send this
      // through the Android WebView's external-host handler instead. The
      // mobile hostname bypasses legacy exact-host routing of instagram.com.
      event.preventDefault();
      window.location.href = "https://m.instagram.com/anipins.verse/";
      return;
    }

    event.preventDefault();
    let leftPage = false;
    const markHidden = () => {
      leftPage = document.visibilityState === "hidden";
      if (leftPage) document.removeEventListener("visibilitychange", markHidden);
    };
    document.addEventListener("visibilitychange", markHidden, { once: true });

    window.location.href = INSTAGRAM_APP_URL;

    window.setTimeout(() => {
      document.removeEventListener("visibilitychange", markHidden);
      if (!leftPage && document.visibilityState === "visible") {
        window.location.href = /Android/i.test(navigator.userAgent)
          ? "https://m.instagram.com/anipins.verse/"
          : INSTAGRAM_WEB_URL;
      }
    }, 1200);
  };

  return (
    <a href={INSTAGRAM_WEB_URL} onClick={handleClick} {...props}>
      {children}
    </a>
  );
}
