"use client";

import type { AnchorHTMLAttributes, ReactNode } from "react";

export const INSTAGRAM_WEB_URL = "https://www.instagram.com/_anipins_/";
export const INSTAGRAM_APP_URL = "instagram://user?username=_anipins_";

type Props = AnchorHTMLAttributes<HTMLAnchorElement> & {
  children: ReactNode;
};

export default function InstagramLink({ children, onClick, ...props }: Props) {
  const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event);
    if (event.defaultPrevented || typeof window === "undefined") return;

    const mobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (!mobile) return;

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
        window.location.href = INSTAGRAM_WEB_URL;
      }
    }, 1200);
  };

  return (
    <a href={INSTAGRAM_WEB_URL} onClick={handleClick} {...props}>
      {children}
    </a>
  );
}
