"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/", label: "Home", icon: <path d="M3 10.8 12 3l9 7.8V21h-6v-6H9v6H3z" strokeLinejoin="round" /> },
  { href: "/explore", label: "Explore", icon: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" strokeLinecap="round" /></> },
  { href: "/saves", label: "Saves", icon: <path d="M6 3h12v18l-6-4.5L6 21z" strokeLinejoin="round" /> },
  { href: "/profile", label: "Profile", icon: <><circle cx="12" cy="8" r="4" /><path d="M4.5 21a7.5 7.5 0 0 1 15 0" strokeLinecap="round" /></> },
] as const;

export default function MobileBottomNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Primary mobile navigation"
      className="fixed inset-x-3 bottom-3 z-[60] grid grid-cols-4 rounded-2xl glass hairline shadow-[0_12px_44px_rgba(0,0,0,0.35)] md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
      {ITEMS.map(item => {
        const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        return (
          <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined}
            className={`flex min-h-16 flex-col items-center justify-center gap-1 rounded-2xl text-[11px] transition-colors ${active ? "text-gold" : "text-fog hover:text-paper"}`}>
            <svg className="h-5 w-5" fill={active && item.href === "/" ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.9">
              {item.icon}
            </svg>
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
