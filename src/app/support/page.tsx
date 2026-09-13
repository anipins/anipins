import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Help & Support", description: "Get help with AniPins accounts, downloads, artwork and the Android app.", alternates: { canonical: "/support" } };

export default function SupportPage() {
  return <section className="mx-auto max-w-3xl px-6 pt-28 text-sm leading-7 text-fog md:pt-32">
    <p className="text-xs uppercase tracking-[.28em] text-gold">Help & Support</p>
    <h1 className="mt-3 font-display text-4xl font-semibold text-paper">How can we help?</h1>
    <div className="mt-8 grid gap-4 md:grid-cols-2">
      <article className="rounded-2xl border border-paper/10 bg-soft p-5"><h2 className="font-display text-lg text-paper">Account & collections</h2><p className="mt-2">Sign in with the same email in the website and Android app to keep saves, likes, follows and private collections synchronized.</p></article>
      <article className="rounded-2xl border border-paper/10 bg-soft p-5"><h2 className="font-display text-lg text-paper">Downloads</h2><p className="mt-2">Downloaded artwork is saved to your device’s Downloads folder. On Android, watch for the completed-download notification.</p></article>
      <article className="rounded-2xl border border-paper/10 bg-soft p-5"><h2 className="font-display text-lg text-paper">Report artwork</h2><p className="mt-2">Open an artwork and use Report. Rights holders can submit a formal request from the <Link href="/copyright" className="text-gold underline">copyright page</Link>.</p></article>
      <article className="rounded-2xl border border-paper/10 bg-soft p-5"><h2 className="font-display text-lg text-paper">Android app</h2><p className="mt-2">Use the latest AniPins release for the fastest feed, reliable downloads and current security updates.</p></article>
    </div>
    <p className="mb-16 mt-8">Still need help? Email <a className="text-gold underline" href="mailto:anipins01@gmail.com">anipins01@gmail.com</a> or message <a className="text-gold underline" href="https://www.instagram.com/_anipins_/" target="_blank" rel="noopener noreferrer">@_anipins_ on Instagram</a>.</p>
  </section>;
}
