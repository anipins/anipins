import Link from "next/link";
const IG_URL = "https://www.instagram.com/_anipins_?igsi=dzZzem42bnBha3Y=";

export default function Footer() {
  return (
    <footer className="mt-24 border-t border-paper/10">
      <div className="mx-auto max-w-[1600px] px-6 md:px-8 py-14">
        <div className="grid gap-10 md:grid-cols-3">
          <div>
            <div className="flex items-center gap-2.5">
              <img src="/brand/ap-symbol.svg" alt="" className="h-9 w-9 rounded-[10px]" />
              <span className="font-display text-2xl font-semibold">Ani<span className="text-gold">Pins</span></span>
            </div>
            <p className="mt-3 text-sm text-fog">Anime artwork for inspiration.</p>
            <a href={IG_URL} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-2 text-sm text-fog hover:text-gold transition-colors">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none"/></svg>
              Instagram — @_anipins_
            </a>
          </div>
          <div className="flex gap-16 text-sm">
            <div className="flex flex-col gap-2.5">
              <span className="text-[11px] uppercase tracking-widest text-gold/70 mb-1">Browse</span>
              <Link href="/explore" className="text-fog hover:text-paper transition-colors">Explore</Link>
              <Link href="/characters" className="text-fog hover:text-paper transition-colors">Characters</Link>
              <Link href="/anime" className="text-fog hover:text-paper transition-colors">Anime</Link>
              <a href={IG_URL} target="_blank" rel="noopener noreferrer" className="text-fog hover:text-paper transition-colors">Instagram</a>
            </div>
            <div className="flex flex-col gap-2.5">
              <span className="text-[11px] uppercase tracking-widest text-gold/70 mb-1">Legal</span>
              <Link href="/privacy" className="text-fog hover:text-paper transition-colors">Privacy</Link>
              <Link href="/terms" className="text-fog hover:text-paper transition-colors">Terms</Link>
              <Link href="/copyright" className="text-fog hover:text-paper transition-colors">Copyright / Takedown</Link>
            </div>
          </div>
          <div className="md:text-right text-sm text-fog/70 self-end">© AniPins. All rights reserved.</div>
        </div>
      </div>
    </footer>
  );
}
