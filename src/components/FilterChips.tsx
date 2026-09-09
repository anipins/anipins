"use client";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense } from "react";

const CHIPS = [
  { label: "Following", href: "/following" },
  { label: "Trending", href: "/explore?sort=trending" },
  { label: "Latest", href: "/explore?sort=latest" },
  { label: "Popular", href: "/explore?sort=popular" },
  { label: "Characters", href: "/characters" },
  { label: "Anime", href: "/anime" },
  { label: "Male Characters", href: "/explore?category=Male%20Characters" },
  { label: "Female Characters", href: "/explore?category=Female%20Characters" },
];

function Inner() {
  const path = usePathname();
  const sp = useSearchParams();
  const current = `${path}?${sp.toString()}`.replace(/\?$/, "");
  return (
    <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
      {CHIPS.map(c => {
        const on = current === c.href || (path === c.href && !sp.toString());
        return <Link key={c.label} href={c.href} className={`chip ${on ? "chip-on" : ""}`}>{c.label}</Link>;
      })}
    </div>
  );
}

export default function FilterChips() {
  return <Suspense><Inner /></Suspense>;
}
