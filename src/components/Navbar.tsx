"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Logo from "./Logo";

const IG_URL = "https://www.instagram.com/_anipins_?igsi=dzZzem42bnBha3Y=";
const APP_URL = "https://anipins-mobile.onhercules.app";
const LINKS = [
  { href: "/explore", label: "Explore" },
  { href: "/characters", label: "Characters" },
  { href: "/anime", label: "Anime" },
  { href: "/trending", label: "Trending" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [sugs, setSugs] = useState<any[]>([]);
  const [focus, setFocus] = useState(false);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();
  const path = usePathname();
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 24);
    on(); window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  useEffect(() => { fetch("/api/auth/me").then(r => r.json()).then(d => setUser(d.user)).catch(() => {}); }, [path]);
  useEffect(() => { setOpen(false); setFocus(false); }, [path]);

  useEffect(() => {
    if (!q.trim()) { setSugs([]); return; }
    const t = setTimeout(() => {
      fetch(`/api/search/suggest?q=${encodeURIComponent(q)}`).then(r => r.json()).then(d => setSugs(d.suggestions || []));
    }, 180);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (boxRef.current && !boxRef.current.contains(e.target as Node)) setFocus(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const go = (e: React.FormEvent) => {
    e.preventDefault();
    if (q.trim()) { router.push(`/search?q=${encodeURIComponent(q.trim())}`); setFocus(false); }
  };

  return (
    <header className={`fixed top-0 z-50 w-full transition-all duration-500 ${scrolled ? "glass border-b border-white/10 py-2" : "py-4"}`}>
      <div className="mx-auto flex max-w-[1600px] items-center gap-4 px-4 md:px-8">
        <Logo />
        <nav className="hidden lg:flex items-center gap-1 ml-4">
          {LINKS.map(l => (
            <Link key={l.href} href={l.href}
              className={`relative rounded-full px-4 py-2 text-sm transition-colors ${path === l.href ? "text-gold" : "text-fog hover:text-paper hover:bg-white/5"}`}>
              {l.label}
              {path === l.href && <span className="absolute inset-x-4 -bottom-0.5 h-px bg-gold/70" />}
            </Link>
          ))}
        </nav>

        <div ref={boxRef} className="relative ml-auto w-full max-w-xs md:max-w-sm">
          <form onSubmit={go}>
            <input value={q} onChange={e => setQ(e.target.value)} onFocus={() => setFocus(true)}
              placeholder="Search characters, anime, tags…"
              className="w-full rounded-full bg-soft/80 hairline px-4 py-2 pl-9 text-sm text-paper placeholder:text-fog/60 outline-none focus:border-gold-dim transition-all" />
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-fog" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5" strokeLinecap="round"/></svg>
          </form>
          <AnimatePresence>
            {focus && sugs.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}
                transition={{ duration: 0.18 }}
                className="absolute top-full mt-2 w-full overflow-hidden rounded-2xl glass hairline shadow-2xl">
                {sugs.map((s, i) => (
                  <button key={i} onClick={() => { router.push(s.href); setFocus(false); setQ(""); }}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm hover:bg-white/5">
                    <span className="text-[10px] uppercase tracking-wider text-gold/80 w-16 shrink-0">{s.type}</span>
                    <span>{s.label}</span>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="hidden md:flex items-center gap-2 shrink-0">
         <a
  href={APP_URL}
  target="_blank"
  rel="noopener noreferrer"
  title="Download AniPins App"
  className="inline-flex items-center gap-2 rounded-full hairline px-4 py-2 text-sm font-medium text-gold hover:text-paper hover:border-gold-dim hover:bg-white/5 transition-colors"
>
  Download App
</a> 
          <a href={IG_URL} target="_blank" rel="noopener noreferrer" title="Instagram — @_anipins_"
            className="rounded-full p-2.5 text-fog hover:text-gold hover:bg-white/5 transition-colors">
            <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none"/></svg>
          </a>
          {user ? (
            <>
              <Link href="/saves" className="rounded-full px-4 py-2 text-sm text-fog hover:text-paper hover:bg-white/5 transition-colors">Saves</Link>
              {user.role === "ADMIN" && (
                <Link href="/admin" className="flex items-center gap-2 rounded-full px-4 py-2 text-sm text-fog hover:text-paper hover:bg-white/5 transition-colors">
                  Admin <span className="badge-gold !px-2 !py-0.5">Owner</span>
                </Link>
              )}
              <button onClick={async () => { await fetch("/api/auth/logout", { method: "POST" }); location.reload(); }}
                className="rounded-full hairline px-4 py-2 text-sm text-fog hover:text-paper hover:border-gold-dim transition-colors">Sign out</button>
            </>
          ) : (
            <Link href="/login" className="rounded-full bg-gold px-4 py-2 text-sm font-medium text-ink hover:bg-gold-bright transition-colors">Sign in</Link>
          )}
        </div>

        <button onClick={() => setOpen(!open)} className="lg:hidden rounded-full p-2 text-paper" aria-label="Menu">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            {open ? <path d="M6 6l12 12M18 6L6 18"/> : <path d="M4 7h16M4 12h16M4 17h16"/>}
          </svg>
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }} className="lg:hidden overflow-hidden glass border-b border-white/10">
            <div className="flex flex-col px-6 py-4 gap-1">
              {LINKS.map(l => (
                <Link key={l.href} href={l.href} className={`py-2.5 text-[15px] ${path === l.href ? "text-gold" : "text-fog hover:text-paper"}`}>{l.label}</Link>
              ))}
              
              <a
  href={APP_URL}
  target="_blank"
  rel="noopener noreferrer"
  className="py-2.5 text-[15px] text-gold font-medium hover:text-paper"
>
  Download App
</a>
              <a href={IG_URL} target="_blank" rel="noopener noreferrer" className="py-2.5 text-[15px] text-fog hover:text-gold">Instagram — @_anipins_</a>
              {user ? (
                <>
                  <Link href="/saves" className="py-2.5 text-[15px] text-fog hover:text-paper">Saves</Link>
                  {user.role === "ADMIN" && <Link href="/admin" className="py-2.5 text-[15px] text-gold">Admin — Owner</Link>}
                  <button onClick={async () => { await fetch("/api/auth/logout", { method: "POST" }); location.reload(); }} className="py-2.5 text-left text-[15px] text-fog hover:text-paper">Sign out</button>
                </>
              ) : (
                <Link href="/login" className="py-2.5 text-[15px] text-gold font-medium">Sign in</Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
