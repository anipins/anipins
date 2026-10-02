import Link from "next/link";
import PremiumCheckout from "@/components/PremiumCheckout";

export const metadata = { title: "AniPins Premium", description: "Unlock exclusive anime reference collections, HD downloads and early access with AniPins Premium." };

export default function PremiumPage() {
  return <main className="mx-auto max-w-5xl px-5 pb-20 pt-32 md:px-8 md:pt-40">
    <section className="overflow-hidden rounded-[2rem] border border-gold/25 bg-panel p-7 shadow-2xl shadow-black/25 md:p-12">
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold">AniPins Premium</p>
      <div className="mt-5 grid gap-10 lg:grid-cols-[1.25fr_.75fr] lg:items-center"><div><h1 className="font-display text-4xl font-semibold leading-tight md:text-6xl">More room for your creative practice.</h1><p className="mt-5 max-w-2xl text-lg leading-relaxed text-fog">Premium gives serious anime artists a focused collection of references, full-quality downloads, and early access to new drops.</p><ul className="mt-7 grid gap-3 text-sm text-paper sm:grid-cols-2"><li>✓ Exclusive reference collections</li><li>✓ Full-quality HD downloads</li><li>✓ Early access to new artwork</li><li>✓ Cancel before the next billing cycle</li></ul></div><aside className="rounded-3xl border border-paper/10 bg-ink p-6"><p className="text-sm text-fog">Monthly membership</p><p className="mt-2 font-display text-5xl font-semibold">₹99<span className="text-base font-normal text-fog"> / month</span></p><p className="mt-4 text-sm leading-relaxed text-fog">Recurring monthly subscription. Secure payments are processed by Razorpay.</p><div className="mt-6"><PremiumCheckout /></div></aside></div>
    </section>
    <section className="mt-10 grid gap-6 text-sm text-fog md:grid-cols-2"><div className="rounded-2xl bg-panel p-6 hairline"><h2 className="font-display text-xl text-paper">Cancel & refunds</h2><p className="mt-3 leading-relaxed">You may cancel at any time; access continues through the already-paid billing period. If a charge was duplicated or occurred in error, contact <a className="text-gold underline" href="mailto:anipins01@gmail.com">anipins01@gmail.com</a> within 7 days and we will review it promptly.</p></div><div className="rounded-2xl bg-panel p-6 hairline"><h2 className="font-display text-xl text-paper">Before subscribing</h2><p className="mt-3 leading-relaxed">By subscribing, you agree to the <Link className="text-gold underline" href="/terms">Terms</Link> and <Link className="text-gold underline" href="/privacy">Privacy Policy</Link>. Payment details are handled by Razorpay, not stored by AniPins.</p></div></section>
  </main>;
}
