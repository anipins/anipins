"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const NAV = [
  { href: "/admin", label: "Overview", d: "M3.5 12.5 12 4l8.5 8.5M6 10.5V20h12v-9.5" },
  { href: "/admin/manage", label: "Artwork Manager", d: "M4 5h16v14H4zM4 15l4-4 3 3 5-5 4 4" },
  { href: "/admin/upload", label: "Upload", d: "M12 16V5m0 0 4 4m-4-4L8 9M5 19h14" },
  { href: "/admin/users", label: "Users", d: "M9 11a3.2 3.2 0 1 0 0-6.4A3.2 3.2 0 0 0 9 11Zm-5.5 8c.7-3.2 2.8-5 5.5-5s4.8 1.8 5.5 5M17 10.5a2.4 2.4 0 1 0 0-4.8M15.5 14.4c2.3.2 4 1.7 4.6 4.6" },
  { href: "/admin/analytics", label: "Analytics", d: "M4 19V9m5.5 10V5M15 19v-7m5.5 7V11" },
  { href: "/admin/settings", label: "Settings", d: "M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4Zm7.5-3.2a7.5 7.5 0 0 0-.1-1.2l2-1.5-2-3.4-2.3 1a7.6 7.6 0 0 0-2-1.2L14.7 3h-4l-.4 2.7a7.6 7.6 0 0 0-2 1.2l-2.3-1-2 3.4 2 1.5a7.5 7.5 0 0 0 0 2.4l-2 1.5 2 3.4 2.3-1a7.6 7.6 0 0 0 2 1.2l.4 2.7h4l.4-2.7a7.6 7.6 0 0 0 2-1.2l2.3 1 2-3.4-2-1.5c.06-.4.1-.8.1-1.2Z" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<"loading" | "ok" | "denied">("loading");
  const [mini, setMini] = useState<any>(null);
  const router = useRouter();
  const path = usePathname();

  useEffect(() => {
    fetch("/api/auth/me").then(r => r.json()).then(d => {
      if (d.user?.role === "ADMIN") {
        setState("ok");
        fetch("/api/admin/stats").then(r => r.json()).then(s => setMini(s.totals)).catch(() => {});
      } else { setState("denied"); router.push("/login"); }
    });
  }, [router]);

  if (state !== "ok") return <div className="pt-44 text-center text-fog">{state === "loading" ? "Verifying admin access…" : "Admin access required. Redirecting…"}</div>;

  return (
    <div className="mx-auto flex max-w-[1560px] gap-0 px-0 md:px-6 pt-20 md:pt-24 min-h-screen">
      <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-white/[0.07] py-8 pr-5">
        <div className="flex items-center gap-3 px-3">
          <img src="/brand/ap-symbol.svg" alt="" className="h-10 w-10 rounded-xl shadow-[0_0_24px_rgba(198,161,91,0.15)]" />
          <div>
            <p className="font-display font-semibold leading-none">Ani<span className="text-gold">Pins</span></p>
            <span className="badge-gold mt-1.5 !px-2 !py-0.5">Super Admin</span>
          </div>
        </div>
        <div className="mx-3 mt-6 h-px bg-gradient-to-r from-gold/30 via-white/10 to-transparent" />
        <nav className="mt-5 flex flex-col gap-1">
          {NAV.map(n => {
            const on = path === n.href;
            return (
              <Link key={n.href} href={n.href}
                className={`relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm transition-all duration-200 ${on ? "bg-gradient-to-r from-gold/[0.14] to-transparent text-gold" : "text-fog hover:text-paper hover:bg-white/[0.04]"}`}>
                {on && <span className="absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-full bg-gradient-to-b from-gold-bright to-gold-deep" />}
                <svg viewBox="0 0 24 24" className="h-[17px] w-[17px] shrink-0" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d={n.d} /></svg>
                {n.label}
              </Link>
            );
          })}
        </nav>
        {mini && (
          <div className="mx-3 mt-8 rounded-2xl border border-line bg-panel/60 p-4">
            <p className="text-[10px] uppercase tracking-[0.25em] text-gold/70">Quick stats</p>
            <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2.5 text-sm">
              <div><p className="font-display font-semibold">{mini.artworks}</p><p className="text-[10px] text-fog">Artworks</p></div>
              <div><p className="font-display font-semibold">{mini.views}</p><p className="text-[10px] text-fog">Views</p></div>
              <div><p className="font-display font-semibold">{mini.downloads}</p><p className="text-[10px] text-fog">Downloads</p></div>
              <div><p className="font-display font-semibold">{mini.characters}</p><p className="text-[10px] text-fog">Characters</p></div>
            </div>
          </div>
        )}
        <div className="mt-auto px-3 pt-6">
          <Link href="/" className="mb-2 flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm text-fog hover:text-paper hover:bg-white/[0.04] transition-colors">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M15 18l-6-6 6-6"/></svg>
            Back to website
          </Link>
          <button onClick={async () => { await fetch("/api/auth/logout", { method: "POST" }); location.href = "/"; }}
            className="w-full rounded-xl border border-line px-4 py-2.5 text-sm text-fog transition-colors hover:border-gold/40 hover:text-paper">Sign out</button>
        </div>
      </aside>
      <div className="min-w-0 flex-1 px-4 py-8 md:px-10">
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
