import Link from "next/link";
import Image from "next/image";
import PremiumCheckout from "@/components/PremiumCheckout";
import PremiumLibrary from "@/components/PremiumLibrary";
import PremiumMemberFeed from "@/components/PremiumMemberFeed";
import { getArtworkCards, getPremiumPreviewCards } from "@/lib/content";
import { getUser } from "@/lib/auth";
import { canAccessPremium } from "@/lib/billing";

export const metadata = {
  title: "AniPins Premium",
  description: "Unlock exclusive anime reference collections, HD downloads and early access with AniPins Premium.",
};
// Membership and the protected preview list are request-specific. Do not try
// to prerender this route during a build with no production database session.
export const dynamic = "force-dynamic";

const benefits = [
  ["01", "Private reference drops", "Subscriber-only character studies and curated sketch references."],
  ["02", "Full-quality downloads", "Keep original detail for your art practice and personal reference library."],
  ["03", "First access", "See new collections before they enter the public AniPins feed."],
];

function Crown() {
  return <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="m3.5 7.8 4.2 4.1L12 4.5l4.3 7.4 4.2-4.1-2 10H5.5l-2-10Z" strokeLinejoin="round"/><path d="M7.2 20.3h9.6" strokeLinecap="round"/></svg>;
}

function Lock() {
  return <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><rect x="4" y="10" width="16" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>;
}

export default async function PremiumPage() {
  const user = await getUser();
  const hasPremium = !!user && await canAccessPremium(user);
  if (hasPremium) {
    const [featured, latest] = await Promise.all([
      getArtworkCards({ sort: "featured", limit: 8, premium: true }),
      getArtworkCards({ sort: "latest", limit: 36, premium: true }),
    ]);
    return <PremiumMemberFeed featured={featured} latest={latest} />;
  }
  const previews = await getPremiumPreviewCards(3);
  return <main className="mx-auto max-w-6xl overflow-hidden px-5 pb-24 pt-28 md:px-8 md:pt-36">
    <section className="relative isolate overflow-hidden rounded-[2rem] border border-gold/30 bg-[#12110e] px-6 py-10 shadow-[0_35px_100px_rgba(0,0,0,.45)] sm:px-10 md:rounded-[2.5rem] md:px-14 md:py-16">
      <div className="pointer-events-none absolute -left-32 top-1/2 h-[30rem] w-[30rem] -translate-y-1/2 rounded-full bg-gold/10 blur-[120px]"/>
      <div className="pointer-events-none absolute -right-40 -top-40 h-[35rem] w-[35rem] rounded-full border border-gold/15"/>
      <div className="pointer-events-none absolute bottom-[-14rem] right-[20%] h-[30rem] w-[30rem] rounded-full border border-gold/10"/>
      <div className="relative grid gap-12 lg:grid-cols-[.95fr_1.05fr] lg:items-center">
        <div className="max-w-xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-gold/35 bg-gold/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[.22em] text-gold"><Crown/> AniPins Premium</div>
          <p className="mt-9 text-xs font-semibold uppercase tracking-[.28em] text-gold/80">Member access / edition 01</p>
          <h1 className="mt-4 font-display text-4xl font-semibold leading-[.94] tracking-tight text-paper sm:text-6xl">The archive behind<br/>your <span className="text-gold">best work.</span></h1>
          <p className="mt-7 max-w-lg text-base leading-7 text-fog sm:text-lg">Member-only character collections, original-resolution downloads, and new drops before they reach the public feed.</p>
          <div className="mt-8 max-w-sm"><PremiumCheckout/></div>
          <p className="mt-4 text-sm text-fog"><span className="text-paper">₹199 / month</span> <span className="px-1.5 text-gold">•</span> Cancel before your next billing cycle</p>
        </div>
        <aside className="relative mx-auto w-full max-w-lg py-4 sm:py-8">
          <div className="absolute inset-x-8 inset-y-0 rotate-[5deg] rounded-[2rem] border border-gold/20 bg-gold/5"/>
          <div className="absolute inset-x-6 inset-y-3 -rotate-[3deg] rounded-[2rem] border border-paper/10 bg-black/20"/>
          <div className="relative min-h-[24rem] overflow-hidden rounded-[2rem] border border-gold/45 bg-[radial-gradient(circle_at_82%_18%,rgba(212,170,85,.24),transparent_25%),radial-gradient(circle_at_12%_82%,rgba(212,170,85,.12),transparent_32%),linear-gradient(145deg,#302516,#14110c_50%,#080808)] p-6 shadow-[0_32px_70px_rgba(0,0,0,.5)] sm:p-8">
            <div className="pointer-events-none absolute -right-20 top-1/2 h-72 w-72 -translate-y-1/2 rounded-full border border-gold/25"/>
            <div className="pointer-events-none absolute -right-10 top-1/2 h-52 w-52 -translate-y-1/2 rounded-full border border-gold/20"/>
            <div className="pointer-events-none absolute right-4 top-5 h-44 w-44 opacity-[.18] mix-blend-screen sm:right-7 sm:top-3 sm:h-52 sm:w-52">
              <Image src="/brand/ap-mark-master-v2.png" alt="" fill className="object-contain" sizes="208px" aria-hidden="true" priority />
            </div>
            <div className="pointer-events-none absolute bottom-7 right-7 grid h-14 w-14 grid-cols-5 gap-1 opacity-40">{Array.from({ length: 25 }, (_, index) => <span key={index} className={`rounded-[1px] ${[0, 2, 4, 6, 8, 11, 13, 15, 18, 20, 22, 24].includes(index) ? "bg-gold" : "bg-gold/20"}`}/>)}</div>
            <div className="relative flex items-start justify-between"><div><p className="text-[10px] font-semibold uppercase tracking-[.3em] text-gold">AniPins / member pass</p><p className="mt-2 font-display text-2xl text-paper">Private access</p></div><div className="grid h-12 w-12 place-items-center rounded-2xl border border-gold/40 bg-gold/10 text-gold"><Crown/></div></div>
            <div className="relative mt-11 max-w-[18rem]"><p className="font-display text-5xl leading-none tracking-[-.07em] sm:text-6xl"><span className="text-paper">Ani</span><span className="text-gold">Pins</span></p><div className="mt-4 h-px w-24 bg-gradient-to-r from-gold to-transparent"/><p className="mt-4 text-sm leading-6 text-fog">A considered reference library for artists who choose their studies with intention.</p></div>
            <div className="relative mt-9 grid grid-cols-3 border-t border-gold/20 pt-5 text-[10px] uppercase tracking-[.18em] text-fog"><div><p className="text-gold">Access</p><p className="mt-1 text-paper">Private</p></div><div><p className="text-gold">Edition</p><p className="mt-1 text-paper">01 / 01</p></div><div><p className="text-gold">Serial</p><p className="mt-1 text-paper">ANI-199</p></div></div>
          </div>
        </aside>
      </div>
    </section>

    <section className="mt-8 grid gap-4 md:grid-cols-3">{benefits.map(([number, title, copy]) => <article key={number} className="group rounded-3xl border border-paper/10 bg-panel p-6 transition-colors hover:border-gold/35"><p className="text-xs font-semibold tracking-[.22em] text-gold/80">{number}</p><h2 className="mt-9 font-display text-2xl font-semibold text-paper">{title}</h2><p className="mt-3 text-sm leading-6 text-fog">{copy}</p><div className="mt-6 h-px w-10 bg-gold/60 transition-all group-hover:w-full"/></article>)}</section>

    <section className="hidden mt-12 overflow-hidden rounded-[2rem] border border-paper/10 bg-panel p-5 sm:p-7">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-xs font-semibold uppercase tracking-[.25em] text-gold">Preview the archive</p><h2 className="mt-2 font-display text-3xl font-semibold text-paper">More than a feed.</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-fog">Premium drops are deliberately curated and kept outside the public browsing feed.</p></div><span className="inline-flex w-fit items-center gap-2 rounded-full border border-paper/10 px-3 py-1.5 text-xs text-fog"><Lock/> Member-only previews</span></div>
      <div className="mt-7 grid gap-3 sm:grid-cols-3">{["bg-[radial-gradient(circle_at_25%_25%,rgba(212,170,85,.35),transparent_35%),linear-gradient(135deg,#302516,#111)]", "bg-[radial-gradient(circle_at_75%_20%,rgba(212,170,85,.32),transparent_28%),linear-gradient(145deg,#111,#302516)]", "bg-[radial-gradient(circle_at_28%_80%,rgba(212,170,85,.26),transparent_32%),linear-gradient(145deg,#221b12,#0c0c0c)]"].map((background, index) => <div key={index} className="group relative min-h-52 overflow-hidden rounded-2xl border border-paper/10 bg-soft sm:min-h-64"><div className={`absolute inset-0 ${background}`}/><div className="absolute inset-0 bg-[linear-gradient(115deg,transparent_35%,rgba(255,255,255,.05)_36%,transparent_42%)]"/><div className="absolute inset-0 grid place-items-center"><span className="grid h-11 w-11 place-items-center rounded-full border border-gold/50 bg-black/50 text-gold backdrop-blur"><Lock/></span></div><div className="absolute inset-x-0 bottom-0 p-4"><p className="text-[10px] font-semibold uppercase tracking-[.22em] text-gold">Reserved drop {String(index + 1).padStart(2, "0")}</p><p className="mt-1 text-sm font-medium text-paper">Your exclusive artwork appears here</p></div></div>)}</div>
    </section>

    <section className="mt-12 overflow-hidden rounded-[2rem] border border-paper/10 bg-panel p-5 sm:p-7">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div><p className="text-xs font-semibold uppercase tracking-[.25em] text-gold">Inside the private archive</p><h2 className="mt-2 font-display text-3xl font-semibold text-paper">Real drops. Kept private.</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-fog">A glimpse of the member library, deliberately obscured until you unlock it. Full-resolution artwork is never displayed on this public sales page.</p></div>
        <span className="inline-flex w-fit items-center gap-2 rounded-full border border-gold/30 bg-gold/5 px-3 py-1.5 text-xs text-gold"><Lock/> Blurred member previews</span>
      </div>
      <div className="mt-7 grid gap-3 sm:grid-cols-3">{Array.from({ length: 3 }, (_, index) => {
        const preview = previews[index];
        return <div key={preview?.id || index} className="group relative min-h-52 overflow-hidden rounded-2xl border border-paper/10 bg-soft sm:min-h-64">
          {preview ? <img src={`/api/premium-preview/${preview.id}`} alt="Blurred Premium artwork preview" className="absolute inset-0 h-full w-full scale-110 object-cover opacity-80" /> : <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_25%,rgba(212,170,85,.35),transparent_35%),linear-gradient(135deg,#302516,#111)]" />}
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,.08),rgba(0,0,0,.82))]"/><div className="absolute inset-0 grid place-items-center"><span className="grid h-12 w-12 place-items-center rounded-full border border-gold/50 bg-black/60 text-gold backdrop-blur"><Lock/></span></div><div className="absolute inset-x-0 bottom-0 p-4"><p className="text-[10px] font-semibold uppercase tracking-[.22em] text-gold">Private drop {String(index + 1).padStart(2, "0")}</p><p className="mt-1 text-sm font-medium text-paper">Unlock the full member collection</p></div>
        </div>;
      })}</div>
    </section>

    <section className="mt-5 overflow-hidden rounded-[2rem] border border-gold/25 bg-gradient-to-r from-[#20170c] via-[#15120e] to-[#20170c] p-6 sm:p-8">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between"><div><div className="inline-flex items-center gap-2 rounded-full border border-gold/35 bg-gold/10 px-3 py-1 text-[11px] font-semibold tracking-[.18em] text-gold">18+ MATURE COLLECTION</div><h2 className="mt-4 font-display text-2xl font-semibold text-paper">A separate shelf, handled responsibly.</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-fog">Mature reference drops are never previewed openly. They stay locked for adult members and should only be published where lawful and appropriately labelled.</p></div><div className="flex shrink-0 items-center gap-2 text-sm text-gold"><Lock/> Adult-only access</div></div>
    </section>

    <PremiumLibrary/>
    <section className="mt-12 grid gap-5 text-sm text-fog md:grid-cols-2"><div className="rounded-2xl border border-paper/10 bg-panel/60 p-6"><h2 className="font-display text-xl text-paper">Cancel & refunds</h2><p className="mt-3 leading-relaxed">You may cancel at any time; access continues through the already-paid billing period. For duplicate or incorrect charges, contact <a className="text-gold underline" href="mailto:anipins01@gmail.com">anipins01@gmail.com</a> within 7 days.</p></div><div className="rounded-2xl border border-paper/10 bg-panel/60 p-6"><h2 className="font-display text-xl text-paper">Before subscribing</h2><p className="mt-3 leading-relaxed">By subscribing, you agree to the <Link className="text-gold underline" href="/terms">Terms</Link> and <Link className="text-gold underline" href="/privacy">Privacy Policy</Link>. Payments are handled by Razorpay.</p></div></section>
  </main>;
}
