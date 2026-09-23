import Link from "next/link";

export default function NotFound() {
  return (
    <section className="mx-auto flex min-h-[75vh] max-w-2xl flex-col items-center justify-center px-6 pt-24 text-center">
      <img src="/brand/ap-symbol-192.png" width="88" height="88" alt="AniPins AP logo" className="block rounded-3xl object-contain object-center" />
      <p className="mt-7 text-xs uppercase tracking-[0.3em] text-gold">404 · Lost pin</p>
      <h1 className="mt-3 font-display text-4xl font-semibold md:text-5xl">This artwork is out of frame.</h1>
      <p className="mt-4 text-sm leading-6 text-fog">The page may have moved or the artwork is no longer published. There is plenty more to discover.</p>
      <div className="mt-7 flex flex-wrap justify-center gap-3"><Link href="/" className="btn-primary">Go home</Link><Link href="/explore" className="btn-ghost">Explore artwork</Link></div>
    </section>
  );
}
