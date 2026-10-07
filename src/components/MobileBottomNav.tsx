"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { mobileNavItems } from "@/lib/mobile-nav-utils";

const ICONS: Record<string, ReactNode> = {
  "/": <path d="M3 10.8 12 3l9 7.8V21h-6v-6H9v6H3z" strokeLinejoin="round" />,
  "/search": <><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4.5 4.5" strokeLinecap="round" /></>,
  "/saves": <path d="M6 3h12v18l-6-4.5L6 21z" strokeLinejoin="round" />,
  "/profile": <><circle cx="12" cy="8" r="4" /><path d="M4.5 21a7.5 7.5 0 0 1 15 0" strokeLinecap="round" /></>,
};

export default function MobileBottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const items = mobileNavItems();

  return (
    <nav aria-label="Primary mobile navigation"
      className="mobile-bottom-nav fixed inset-x-0 bottom-0 z-[60] grid grid-cols-4 border-t border-paper/10 glass shadow-[0_-8px_28px_rgba(0,0,0,0.28)] md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
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
              router.refresh();
            }}
            aria-label={item.label} title={item.label}
            className={`group relative flex min-h-14 items-center justify-center overflow-hidden transition-all ${active ? "bg-gold/[0.08] text-gold" : "text-fog hover:bg-paper/[0.04] hover:text-paper"}`}>
            <span className={`absolute top-0 h-0.5 rounded-full bg-gold transition-all duration-300 ${active ? "w-8 opacity-100" : "w-0 opacity-0"}`} />
            <svg className="h-[22px] w-[22px]" fill={active && item.href === "/" ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.9" aria-hidden="true">
              {ICONS[item.href]}
            </svg>
          </Link>
        );
      })}
    </nav>
  );
}
