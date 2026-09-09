"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const ITEMS = [
  { href: "/", label: "Home", icon: <path d="M3 10.8 12 3l9 7.8V21h-6v-6H9v6H3z" strokeLinejoin="round" /> },
  { href: "/following", label: "Following", icon: <><path d="M12 20S4 15.4 4 9.5A4.5 4.5 0 0 1 12 6.7a4.5 4.5 0 0 1 8 2.8C20 15.4 12 20 12 20Z" strokeLinejoin="round" /></> },
  { href: "/saves", label: "Saves", icon: <path d="M6 3h12v18l-6-4.5L6 21z" strokeLinejoin="round" /> },
  { href: "/profile", label: "Profile", icon: <><circle cx="12" cy="8" r="4" /><path d="M4.5 21a7.5 7.5 0 0 1 15 0" strokeLinecap="round" /></> },
] as const;

const ADMIN_ITEM = {
  href: "/admin",
  label: "Admin",
  icon: <><path d="M12 3 4.5 6v5.2c0 4.6 3 8.1 7.5 9.8 4.5-1.7 7.5-5.2 7.5-9.8V6L12 3Z" strokeLinejoin="round" /><path d="M9.2 12.1 11 14l3.9-4" strokeLinecap="round" strokeLinejoin="round" /></>,
} as const;

export default function MobileBottomNav() {
  const pathname = usePathname();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me", { cache: "no-store", credentials: "include" })
      .then(response => response.json())
      .then(data => setIsAdmin(data.user?.role === "ADMIN"))
      .catch(() => setIsAdmin(false));
  }, [pathname]);

  const items = isAdmin ? [...ITEMS, ADMIN_ITEM] : ITEMS;

  return (
    <nav aria-label="Primary mobile navigation"
      className={`fixed inset-x-3 bottom-3 z-[60] grid ${isAdmin ? "grid-cols-5" : "grid-cols-4"} rounded-2xl glass hairline shadow-[0_12px_44px_rgba(0,0,0,0.35)] md:hidden`}
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
      {items.map(item => {
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
