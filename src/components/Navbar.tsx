"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Logo from "./Logo";
import ThemeToggle from "./ThemeToggle";
import NotificationBell from "./NotificationBell";
import InstagramLink from "./InstagramLink";
import { toast } from "./Toaster";
import AccountMenu from "./AccountMenu";
import { signOutFromApp } from "@/lib/better-auth-client";

const APP_URL = "/downloads/AniPins-2.5.21.apk";
const APP_DOWNLOAD_KEY = "anipins-app-download-requested-v1";
const LINKS = [
  { href: "/", label: "Home" },
  { href: "/explore", label: "Explore" },
  { href: "/premium", label: "Premium" },
  { href: "/following", label: "Following" },
  { href: "/characters", label: "Characters" },
  { href: "/anime", label: "Anime" },
  { href: "/wallpapers", label: "Wallpapers" },
  { href: "/trending", label: "Trending" },
];

function PremiumMark() {
  return <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="m4 8 4 4 4-7 4 7 4-4-2 10H6L4 8Z" strokeLinecap="round" strokeLinejoin="round"/><path d="M7 21h10" strokeLinecap="round"/></svg>;
}

function SettingsMark() {
  return (
    <svg className="h-[19px] w-[19px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3.5v2.25M12 18.25v2.25M20.5 12h-2.25M5.75 12H3.5M18.01 5.99l-1.59 1.59M7.58 16.42l-1.59 1.59M18.01 18.01l-1.59-1.59M7.58 7.58 5.99 5.99" />
      <circle cx="12" cy="12" r="4.25" />
      <circle cx="12" cy="12" r="1.15" fill="currentColor" stroke="none" />
    </svg>
  );
}

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [navVisible, setNavVisible] = useState(true);
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [sugs, setSugs] = useState<any[]>([]);
  const [focus, setFocus] = useState(false);
  const [recent, setRecent] = useState<string[]>([]);
  const [user, setUser] = useState<any>(null);
  const [showAppDownload, setShowAppDownload] = useState(false);
  const router = useRouter();
  const path = usePathname();
  const boxRef = useRef<HTMLDivElement>(null);
  const searchInput = useRef<HTMLInputElement>(null);
  const visualInput = useRef<HTMLInputElement>(null);
  const [visualLoading, setVisualLoading] = useState(false);

  useEffect(() => {
    let frame = 0;
    let last = window.scrollY > 24;
    let lastY = window.scrollY;
    const on = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const y = window.scrollY;
        const next = y > 24;
        if (next !== last) { last = next; setScrolled(next); }
        if (y < 12) setNavVisible(true);
        else if (Math.abs(y - lastY) > 8) setNavVisible(y < lastY);
        lastY = y;
      });
    };
    setScrolled(last);
    window.addEventListener("scroll", on, { passive: true });
    return () => { window.removeEventListener("scroll", on); if (frame) cancelAnimationFrame(frame); };
  }, []);

  useEffect(() => {
    fetch("/api/auth/me", { cache: "no-store", credentials: "include" })
      .then(async r => ({ status: r.status, data: await r.json() }))
      .then(({ status, data }) => {
        if (status === 401 && data.sessionExpired) window.dispatchEvent(new CustomEvent("anipins:session-expired"));
        if (data.user) window.dispatchEvent(new CustomEvent("anipins:session-restored"));
        setUser(data.user || null);
      })
      .catch(() => {});
  }, [path]);
  useEffect(() => {
    const isNativeApp = Boolean(window.AniPinsAndroid);
    const downloadRequested = localStorage.getItem(APP_DOWNLOAD_KEY) === "1";
    setShowAppDownload(!isNativeApp && !downloadRequested);
  }, []);
  useEffect(() => { try { setRecent(JSON.parse(localStorage.getItem("anipins-recent-searches") || "[]")); } catch {} }, []);
  useEffect(() => { setOpen(false); setFocus(false); }, [path]);

  useEffect(() => {
    const term = q.trim();
    // Opening every page used to make an empty suggestion request. Apart from
    // needless work, that request could compete with the first feed request
    // on weaker phones.
    if (!term) { setSugs([]); return; }
    const t = setTimeout(() => {
      fetch(`/api/search/suggest?q=${encodeURIComponent(term)}`).then(r => r.json()).then(d => setSugs((d.suggestions || []).slice(0, 8)));
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
    if (q.trim()) { const term=q.trim(); const next=[term,...recent.filter(x=>x.toLowerCase()!==term.toLowerCase())].slice(0,6); setRecent(next); localStorage.setItem("anipins-recent-searches",JSON.stringify(next)); router.push(`/search?q=${encodeURIComponent(term)}`); setFocus(false); }
  };

  const rememberAppDownload = () => {
    localStorage.setItem(APP_DOWNLOAD_KEY, "1");
    setShowAppDownload(false);
  };

  const visualSearch = async (file?: File) => {
    if (!file) return;
    setVisualLoading(true);
    const form = new FormData();
    form.set("image", file);
    try {
      const response = await fetch("/api/search/visual", { method: "POST", body: form });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Visual search failed.");
      sessionStorage.setItem("anipins-visual-results", JSON.stringify(data.items || []));
      router.push("/visual-search?uploaded=1");
      setFocus(false);
    } catch (error: any) {
      toast(error.message || "Visual search failed.", "err");
    } finally {
      setVisualLoading(false);
      if (visualInput.current) visualInput.current.value = "";
    }
  };

  return (
    <header className={`site-navbar fixed top-0 z-50 w-full transition-all duration-300 ${navVisible || open ? "translate-y-0" : "-translate-y-[calc(100%+1rem)]"} ${scrolled ? "site-navbar--scrolled glass border-b border-paper/10 pb-2" : "pb-4"}`}>
      <div className="mx-auto flex max-w-[1600px] items-center gap-2 px-3 sm:gap-4 sm:px-4 md:px-8">
        {path !== "/" && (
          <button
            type="button"
            onClick={() => window.history.length > 1 ? router.back() : router.push("/")}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full hairline text-paper transition-colors hover:border-gold-dim hover:bg-paper/5 lg:hidden"
            aria-label="Go back"
            title="Back"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="m15 18-6-6 6-6" />
            </svg>
          </button>
        )}
        <Logo responsive />
        <nav className="hidden lg:flex items-center gap-1 ml-4">
          {LINKS.map((l, index) => (
            <Link key={l.href} href={l.href}
              className={`relative rounded-full px-3 py-2 text-sm transition-colors ${index >= 3 ? "hidden min-[1800px]:block" : ""} ${l.href === "/premium" ? "inline-flex items-center gap-1.5 border border-gold/35 bg-gold/10 text-gold hover:bg-gold/20" : path === l.href ? "text-gold" : "text-fog hover:text-paper hover:bg-paper/5"}`}>
              {l.href === "/premium" && <PremiumMark />}{l.label}
              {path === l.href && <span className="absolute inset-x-4 -bottom-0.5 h-px bg-gold/70" />}
            </Link>
          ))}
        </nav>

        <div ref={boxRef} data-search-active={focus} className={`relative ml-auto min-w-0 flex-1 transition-[max-width] duration-300 ease-out motion-reduce:transition-none lg:min-w-[260px] ${focus ? "lg:max-w-[390px]" : "lg:max-w-[300px]"}`}>
          <form onSubmit={go}>
            <input ref={searchInput} value={q} onChange={e => setQ(e.target.value)} onFocus={() => setFocus(true)}
              placeholder="Search characters, anime, tags…"
              className="min-h-11 w-full rounded-full bg-soft/80 hairline px-11 py-2.5 pl-9 text-sm text-paper placeholder:text-fog/60 outline-none transition-[background-color,border-color,box-shadow] duration-300 focus:border-gold-dim focus:bg-soft focus:shadow-[0_0_0_3px_rgba(198,161,91,0.12)] motion-reduce:transition-none" />
            <svg className={`search-motion-icon absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fog ${focus ? "search-motion-icon--active" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5" strokeLinecap="round"/></svg>
            <input ref={visualInput} type="file" accept="image/*" className="sr-only" onChange={e=>visualSearch(e.target.files?.[0])}/>
            {q.trim() ? <button type="button" onClick={()=>{setQ("");setSugs([]);setFocus(true);searchInput.current?.focus();}} aria-label="Clear search" title="Clear search" className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full text-fog transition-colors hover:bg-paper/5 hover:text-gold">
              <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="m18 6-12 12M6 6l12 12"/></svg>
            </button> : <button type="button" onClick={()=>visualInput.current?.click()} disabled={visualLoading} aria-label="Search using an image" title="Search using an image" className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full text-fog transition-colors hover:bg-paper/5 hover:text-gold disabled:animate-pulse">
              <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 7.5h3l1.5-2h7l1.5 2h3v11H4z"/><circle cx="12" cy="13" r="3.25"/></svg>
            </button>}
          </form>
          <AnimatePresence>
            {focus && (sugs.length > 0 || recent.length > 0) && (
              <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}
                transition={{ duration: 0.18 }}
                className="absolute top-full mt-2 w-full overflow-hidden rounded-2xl glass hairline shadow-2xl">
                {!q.trim() && recent.length > 0 && <div className="flex items-center justify-between border-b border-paper/10 px-4 py-2 text-[10px] uppercase tracking-widest text-fog"><span>Recent searches</span><button type="button" onClick={()=>{setRecent([]);localStorage.removeItem("anipins-recent-searches");}} className="normal-case tracking-normal hover:text-paper">Clear</button></div>}
                {!q.trim() && recent.map((term, i) => <button key={`r-${i}`} onClick={()=>{setQ(term);router.push(`/search?q=${encodeURIComponent(term)}`);setFocus(false);}} className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm hover:bg-paper/5"><span className="w-16 shrink-0 text-[10px] uppercase tracking-wider text-fog">Recent</span><span>{term}</span></button>)}
                {sugs.map((s, i) => (
                  <button key={i} onClick={() => { router.push(s.href); setFocus(false); setQ(""); }}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm hover:bg-paper/5">
                    <span className="text-[10px] uppercase tracking-wider text-gold/80 w-16 shrink-0">{s.type}</span>
                    <span>{s.label}</span>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="hidden md:flex items-center gap-2 shrink-0">
          {showAppDownload && <a
  href={APP_URL}
  download="AniPins.apk"
  onClick={rememberAppDownload}
  title="Download AniPins App"
  className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-full hairline px-4 text-sm font-medium text-gold transition-colors hover:text-paper hover:border-gold-dim hover:bg-paper/5"
>
  Download App
</a>}
          <ThemeToggle />
          <NotificationBell />
          <InstagramLink title="Instagram — @anipins.verse"
            className="nav-icon-button">
            <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none"/></svg>
          </InstagramLink>
          {user ? (
            <>
              <AccountMenu user={user} />
              <Link href="/saves" className="hidden rounded-full px-3 py-2 text-sm text-fog hover:text-paper hover:bg-paper/5 transition-colors min-[1650px]:block">Saves</Link>
              <Link href="/settings" title="Settings" aria-label="Settings" className="nav-icon-button">
                <SettingsMark />
              </Link>
              {user.role === "ADMIN" && (
                <Link href="/admin" prefetch className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-full px-3 text-sm text-fog transition-colors hover:text-paper hover:bg-paper/5">
                  <span className="hidden min-[1450px]:inline">AniPins </span>Admin <span className="badge-gold !hidden !px-2 !py-0.5 min-[1800px]:!inline-flex">Owner</span>
                </Link>
              )}
              <button onClick={async () => { try { await signOutFromApp(); location.reload(); } catch {} }}
                className="inline-flex h-11 shrink-0 items-center justify-center rounded-full hairline px-4 text-sm text-fog transition-colors hover:text-paper hover:border-gold-dim">Sign out</button>
            </>
          ) : (
            <Link href="/login" className="inline-flex h-11 shrink-0 items-center justify-center rounded-full bg-gold px-4 text-sm font-medium text-ink transition-colors hover:bg-gold-bright">Sign in</Link>
          )}
        </div>

        <button onClick={() => { setNavVisible(true); setOpen(!open); }} className="shrink-0 lg:hidden rounded-full p-2 text-paper" aria-label="Menu">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            {open ? <path d="M6 6l12 12M18 6L6 18"/> : <path d="M4 7h16M4 12h16M4 17h16"/>}
          </svg>
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }} className="lg:hidden overflow-hidden glass border-b border-paper/10">
            <div className="flex flex-col px-6 py-4 gap-1">
              {LINKS.map(l => (
                <Link key={l.href} href={l.href} className={`py-2.5 text-[15px] ${l.href === "/premium" ? "flex items-center gap-2 font-medium text-gold" : path === l.href ? "text-gold" : "text-fog hover:text-paper"}`}>{l.href === "/premium" && <PremiumMark />}{l.label}</Link>
              ))}
             {showAppDownload && <a
  href={APP_URL}
  download="AniPins.apk"
  onClick={rememberAppDownload}
  className="py-2.5 text-[15px] text-gold font-medium hover:text-paper"
>
  Download App
</a>}
              <ThemeToggle mobile />
              <div className="py-1"><NotificationBell /></div>
              <InstagramLink className="py-2.5 text-[15px] text-fog hover:text-gold">Instagram — @anipins.verse</InstagramLink>
              {user ? (
                <>
                  <Link href="/profile" className="flex items-center gap-3 py-2.5 text-[15px] text-fog hover:text-paper">
                    <span className="grid h-8 w-8 place-items-center overflow-hidden rounded-full bg-soft text-xs font-semibold text-gold hairline">
                      {user.avatar ? <img src={`/api/img/${user.avatar}`} alt="" className="h-full w-full object-cover" /> : (user.nickname || user.name || user.email || "A").slice(0, 1).toUpperCase()}
                    </span>
                    {user.nickname || user.name || "Profile"}
                  </Link>
                  <Link href="/saves" className="py-2.5 text-[15px] text-fog hover:text-paper">Saves</Link>
                  <Link href="/offline" className="py-2.5 text-[15px] text-fog hover:text-paper">Offline library</Link>
                  <Link href="/settings" className="py-2.5 text-[15px] text-fog hover:text-paper">Settings</Link>
                  {user.role === "ADMIN" && <Link href="/admin" prefetch className="py-2.5 text-[15px] text-gold">AniPins Admin — Dashboard</Link>}
                  <button onClick={async () => { try { await signOutFromApp(); location.reload(); } catch {} }} className="py-2.5 text-left text-[15px] text-fog hover:text-paper">Sign out</button>
                </>
              ) : (
                <Link href="/login" className="py-2.5 text-[15px] font-medium text-gold">Sign in</Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
