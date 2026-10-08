"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { mobileNavItems } from "@/lib/mobile-nav-utils";
import { nativeRefreshUrl, shouldReloadDocumentForRefresh } from "@/lib/native-refresh";

const ICONS: Record<string, ReactNode> = {
  "/": <path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" strokeLinejoin="round" />,
  "/search": <><circle cx="10.8" cy="10.8" r="6.3" /><path d="m16 16 4.2 4.2" strokeLinecap="round" /></>,
  "/saves": <path d="M6 3.5h12v17l-6-4.2-6 4.2z" strokeLinejoin="round" />,
  "/profile": <><circle cx="12" cy="8" r="3.7" /><path d="M4.5 20.5a7.5 7.5 0 0 1 15 0" strokeLinecap="round" /></>,
  "/admin": <><rect x="3.5" y="3.5" width="7" height="7" rx="1.3" /><rect x="13.5" y="3.5" width="7" height="7" rx="1.3" /><rect x="3.5" y="13.5" width="7" height="7" rx="1.3" /><rect x="13.5" y="13.5" width="7" height="7" rx="1.3" /></>,
};

export default function MobileBottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const items = mobileNavItems(isAdmin);

  useEffect(() => {
    fetch("/api/auth/me", { cache: "no-store", credentials: "include" })
      .then(response => response.ok ? response.json() : null)
      .then(data => setIsAdmin(data?.user?.role === "ADMIN"))
      .catch(() => setIsAdmin(false));
  }, [pathname]);

  return (
    <nav aria-label="Primary mobile navigation"
      className={`mobile-bottom-nav fixed inset-x-5 bottom-3 z-[60] grid ${isAdmin ? "grid-cols-5" : "grid-cols-4"} rounded-[20px] border border-paper/[0.12] bg-[rgba(12,12,13,0.88)] p-1 shadow-[0_12px_30px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.05)] backdrop-blur-xl md:hidden`}
      style={{ paddingBottom: "max(0.2rem, env(safe-area-inset-bottom, 0px))" }}>
      {items.map(item => {
        const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        return (
          <Link key={item.href} href={item.href} prefetch aria-current={active ? "page" : undefined}
            onClick={event => {
              // Pinterest-style home behavior: Home returns to the feed from
              // elsewhere, while a second tap on Home refreshes that feed.
              if (item.href !== "/" || pathname !== "/") return;
              event.preventDefault();
              window.scrollTo({ top: 0, behavior: "smooth" });
              window.dispatchEvent(new Event("anipins:refresh"));
              if (shouldReloadDocumentForRefresh(Boolean(window.AniPinsAndroid))) {
                window.location.replace(nativeRefreshUrl(window.location.href, Date.now()));
                return;
              }
              router.refresh();
            }}
            aria-label={item.label} title={item.label}
            className={`group relative m-0.5 flex min-h-12 items-center justify-center rounded-[14px] transition-all duration-200 active:scale-95 ${active ? "bg-gold/[0.12] text-gold shadow-[inset_0_0_0_1px_rgba(198,161,91,0.22),0_5px_14px_rgba(0,0,0,0.18)]" : "text-fog hover:bg-paper/[0.05] hover:text-paper"}`}>
            <svg className="h-[21px] w-[21px] transition-transform duration-200 group-active:scale-90" fill={active && item.href === "/" ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              {ICONS[item.href]}
            </svg>
            <span aria-hidden="true" className={`absolute bottom-1.5 h-1 w-1 rounded-full bg-gold transition-all duration-200 ${active ? "scale-100 opacity-100" : "scale-0 opacity-0"}`} />
          </Link>
        );
      })}
    </nav>
  );
}
