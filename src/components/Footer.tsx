const socialLinks = [
  {
    label: "X (AniPins)",
    href: "https://x.com/anipinsart",
    icon: <path fill="currentColor" stroke="none" d="M18.9 2H22l-6.8 7.8L23.2 22h-6.3L12 14.6 5.5 22H2.3l7.3-8.4L1.8 2h6.5l4.4 6.8L18.9 2Zm-1.1 18h1.7L7.3 3.9H5.5L17.8 20Z" />,
  },
  {
    label: "Instagram (AniPins Verse)",
    href: "https://www.instagram.com/anipins.verse?psln=djY4cnNlNGRjd3cw",
    icon: <><rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" strokeWidth="2" /><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="2" /><circle cx="17.5" cy="6.6" r="1" fill="currentColor" stroke="none" /></>,
  },
  {
    label: "Pinterest (AniPins)",
    href: "https://pin.it/73R2HnARL",
    icon: <path fill="currentColor" stroke="none" d="M12 2a10 10 0 0 0-3.64 19.31c-.02-.78 0-1.72.2-2.57l1.32-5.59s-.33-.66-.33-1.63c0-1.53.89-2.67 2-2.67.95 0 1.41.71 1.41 1.56 0 .95-.61 2.38-.92 3.7-.26 1.1.55 2 1.63 2 1.96 0 3.29-2.52 3.29-5.5 0-2.27-1.53-3.97-4.31-3.97-3.14 0-5.1 2.34-5.1 4.96 0 .9.27 1.54.7 2.04.2.23.23.32.16.58l-.22.9c-.07.29-.29.39-.53.28-1.48-.6-2.17-2.21-2.17-4.02 0-2.99 2.52-6.58 7.51-6.58 4.01 0 6.65 2.9 6.65 6.01 0 4.12-2.29 7.2-5.66 7.2-1.13 0-2.19-.61-2.55-1.3l-.74 2.96c-.22.86-.65 1.72-1.04 2.39A10 10 0 1 0 12 2Z" />,
  },
];

export default function Footer() {
  return (
    <footer className="mt-24 border-t border-paper/10">
      <div className="mx-auto max-w-[1600px] px-6 pt-10 pb-[calc(7rem+env(safe-area-inset-bottom))] md:px-8 md:py-12">
        <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-4 md:gap-8">
          <div className="col-span-2 text-left md:col-span-1">
            <div className="flex items-center justify-start gap-2.5">
              <img src="/brand/ap-symbol-192.png?v=gold-20261016" alt="" className="block h-9 w-9 rounded-[10px] object-contain object-center" />
              <span className="font-display text-2xl font-semibold">Ani<span className="text-gold">Pins</span></span>
            </div>
            <p className="mt-3 text-sm text-fog">Anime artwork for inspiration.</p>
          </div>

          <nav aria-label="AniPins social media" className="col-span-3 flex items-center justify-center gap-3 md:col-span-1 md:justify-self-center md:gap-4">
            {socialLinks.map(({ label, href, icon }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                title={label}
                className="grid h-11 w-11 place-items-center rounded-full border border-paper/15 text-fog transition-colors hover:border-gold/60 hover:bg-gold/10 hover:text-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold"
              >
                <svg className="h-[22px] w-[22px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  {icon}
                </svg>
              </a>
            ))}
          </nav>

        </div>
      </div>
    </footer>
  );
}
