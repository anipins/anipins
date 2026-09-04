"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const NAV = [
  { href: "/admin", label: "Overview", icon: "▦" },
  { href: "/admin/manage", label: "Artwork Manager", icon: "🖼" },
  { href: "/admin/upload", label: "Upload", icon: "↑" },
  { href: "/admin/users", label: "Users", icon: "◉" },
  { href: "/admin/analytics", label: "Analytics", icon: "∿" },
  { href: "/admin/settings", label: "Settings", icon: "⚙" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<"loading" | "ok" | "denied">("loading");
  const router = useRouter();
  const path = usePathname();

  useEffect(() => {
    fetch("/api/auth/me").then(r => r.json()).then(d => {
      if (d.user?.role === "ADMIN") setState("ok");
      else { setState("denied"); router.push("/login"); }
    });
  }, [router]);

  if (state !== "ok") return <div className="pt-44 text-center text-fog">{state === "loading" ? "Verifying admin access…" : "Admin access required. Redirecting…"}</div>;

  return (
    <div className="mx-auto flex max-w-[1500px] gap-0 px-0 md:px-6 pt-20 md:pt-24 min-h-screen">
      <aside className="hidden md:flex w-60 shrink-0 flex-col border-r border-white/10 py-8 pr-4">
        <div className="flex items-center gap-2.5 px-3">
          <img src="/brand/ap-symbol.svg" alt="" className="h-9 w-9 rounded-[10px]" />
          <div>
            <p className="font-display font-semibold leading-none">Ani<span className="text-gold">Pins</span></p>
            <span className="badge-gold mt-1.5 !px-2 !py-0.5">Super Admin</span>
          </div>
        </div>
        <nav className="mt-8 flex flex-col gap-1">
          {NAV.map(n => (
            <Link key={n.href} href={n.href}
              className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm transition-colors ${path === n.href ? "bg-gold/10 text-gold border border-gold/25" : "text-fog hover:text-paper hover:bg-white/5 border border-transparent"}`}>
              <span className="w-4 text-center text-xs opacity-80">{n.icon}</span>{n.label}
            </Link>
          ))}
        </nav>
        <button onClick={async () => { await fetch("/api/auth/logout", { method: "POST" }); location.href = "/"; }}
          className="mt-auto mx-3 rounded-xl hairline px-4 py-2.5 text-sm text-fog hover:text-paper hover:border-gold-dim transition-colors">Sign out</button>
      </aside>
      <div className="min-w-0 flex-1 px-4 py-8 md:px-8">
        <div className="no-scrollbar mb-6 flex gap-2 overflow-x-auto md:hidden">
          {NAV.map(n => (
            <Link key={n.href} href={n.href} className={`chip ${path === n.href ? "chip-on" : ""}`}>{n.label}</Link>
          ))}
        </div>
        {children}
      </div>
    </div>
  );
}
