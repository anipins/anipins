"use client";

import Script from "next/script";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "@/components/Toaster";
import { isInstagramInAppBrowser } from "@/lib/in-app-browser";

declare global {
  interface Window { Razorpay?: new (options: Record<string, unknown>) => { open: () => void }; }
}

const plans = [
  {
    key: "weekly",
    amount: "₹99",
    cadence: "week",
    name: "One week",
    pitch: "A flexible way to explore the private archive.",
    note: "Billed weekly",
  },
  {
    key: "monthly",
    amount: "₹199",
    cadence: "month",
    name: "One month",
    pitch: "A comfortable rhythm for regular art practice.",
    note: "Billed monthly",
  },
  {
    key: "yearly",
    amount: "₹1,999",
    cadence: "year",
    name: "One year",
    pitch: "Build a lasting reference library for your work.",
    note: "About ₹167/month, billed yearly",
    badge: "SAVE ₹389",
  },
] as const;

export default function PremiumCheckout({ signedIn }: { signedIn: boolean }) {
  const [ready, setReady] = useState(false);
  const [scriptFailed, setScriptFailed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [adultConfirmed, setAdultConfirmed] = useState(false);
  const [plan, setPlan] = useState<(typeof plans)[number]["key"]>("monthly");
  const [instagramBrowser, setInstagramBrowser] = useState<boolean | null>(null);

  useEffect(() => {
    setInstagramBrowser(isInstagramInAppBrowser(navigator.userAgent));
  }, []);
  async function startCheckout() {
    if (!adultConfirmed) { toast("Please confirm that you are 18 or older before subscribing.", "err"); return; }
    if (!ready || !window.Razorpay) { toast("Secure checkout is still loading. Please try again in a moment.", "err"); return; }
    setBusy(true);
    try {
      const response = await fetch("/api/billing/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = await response.json();
      if (response.status === 401) { window.location.href = "/login?next=/premium"; return; }
      if (!response.ok) throw new Error(data.error || "Could not open checkout.");
      const checkout = new window.Razorpay({
        key: data.keyId, subscription_id: data.subscriptionId, name: data.name, description: data.description,
        theme: { color: "#d0aa57" },
        handler: async (payment: { razorpay_subscription_id?: string }) => {
          const verified = await fetch("/api/billing/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payment) });
          const result = await verified.json();
          if (!verified.ok) { toast(result.error || "We could not verify your subscription yet.", "err"); return; }
          if (result.premium) {
            // A full navigation fetches the server-rendered member-only feed
            // immediately. A toast alone left successful buyers on the sales
            // page and made their subscription appear broken.
            window.location.assign("/premium?welcome=1");
            return;
          }
          toast("Payment is confirmed. We are unlocking your Premium feed now.");
          // Razorpay can move from authenticated to active moments after its
          // checkout closes. Let the lightweight watcher refresh in-place.
          window.setTimeout(() => window.location.assign("/premium?activating=1"), 700);
        },
        modal: { ondismiss: () => setBusy(false) },
      });
      checkout.open();
    } catch (error: any) { toast(error?.message || "Could not open secure checkout.", "err"); }
    finally { setBusy(false); }
  }
  const openInChrome = typeof window === "undefined" ? "https://anipins.com/premium" : `intent://${window.location.host}${window.location.pathname}${window.location.search}#Intent;scheme=https;package=com.android.chrome;S.browser_fallback_url=${encodeURIComponent(window.location.href)};end`;

  return <>
    {signedIn && instagramBrowser === false && <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" onLoad={() => { setReady(true); setScriptFailed(false); }} onError={() => { setScriptFailed(true); toast("Secure checkout could not load. Open AniPins in Chrome and try again.", "err"); }} />}
    <div className="mb-4 grid grid-cols-2 gap-2 sm:hidden" aria-label="Premium benefits">
      <div className="rounded-2xl border border-paper/10 bg-black/35 p-3.5"><span className="text-lg text-gold" aria-hidden="true">✦</span><p className="mt-1 text-xs font-semibold text-paper">Private art drops</p><p className="mt-1 text-[10px] leading-4 text-fog">Exclusive character references</p></div>
      <div className="rounded-2xl border border-paper/10 bg-black/35 p-3.5"><span className="text-lg text-gold" aria-hidden="true">↧</span><p className="mt-1 text-xs font-semibold text-paper">Full-quality files</p><p className="mt-1 text-[10px] leading-4 text-fog">Download at original detail</p></div>
    </div>
    <div className="mb-3 flex items-center justify-between gap-2 sm:hidden">
      <p className="text-sm font-semibold text-paper">Choose your plan</p>
      <span className="rounded-full border border-gold/30 bg-gold/10 px-2.5 py-1 text-[10px] font-bold tracking-wide text-gold">YEARLY SAVES ₹389</span>
    </div>
    <fieldset className="mb-3 grid grid-cols-1 gap-2 md:mb-4 md:grid-cols-3 md:gap-2.5" aria-label="Choose Premium billing period">
      {plans.map(option => <button key={option.key} type="button" aria-pressed={plan === option.key} onClick={() => setPlan(option.key)} className={`group relative flex min-h-[4.8rem] w-full items-center justify-between gap-3 rounded-2xl border px-3.5 py-3 text-left transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-[#12110e] md:min-h-[12rem] md:items-start md:flex-col md:justify-start md:gap-2 md:p-3 ${plan === option.key ? "border-gold bg-gold/10 text-paper shadow-[0_0_24px_rgba(208,170,87,.1)]" : "border-paper/10 bg-black/25 text-fog hover:border-gold/45 hover:bg-gold/[.04]"}`}>
        <span className="flex min-w-0 flex-1 items-center gap-3 md:order-2 md:block md:flex-none">
          <span aria-hidden="true" className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border transition-colors md:hidden ${plan === option.key ? "border-gold" : "border-paper/30 group-hover:border-gold/60"}`}><span className={`h-2.5 w-2.5 rounded-full bg-gold transition-transform ${plan === option.key ? "scale-100" : "scale-0"}`}/></span>
          <span className="min-w-0">
            <span className="flex flex-wrap items-center gap-2">
              <span className={`text-xs font-semibold uppercase tracking-[.12em] ${plan === option.key ? "text-gold" : "text-paper"}`}>{option.name}</span>
              {"badge" in option && <span className="hidden rounded-full bg-gold px-2 py-0.5 text-[9px] font-bold tracking-wide text-[#17130b] md:inline-flex">{option.badge}</span>}
            </span>
            <span className="mt-1 block text-[10px] leading-4 text-fog md:mt-2 md:text-xs md:leading-5">{option.pitch}</span>
          </span>
        </span>
        <span className="shrink-0 text-right md:w-full md:text-left">
          <span className="block font-display text-lg font-semibold tracking-tight text-paper md:text-xl">{option.amount}<span className="ml-1 font-sans text-[10px] font-normal text-fog md:text-xs">/ {option.cadence}</span></span>
          <span className="mt-0.5 block text-[9px] font-medium text-gold/90 md:mt-1.5 md:text-[10px]">{option.note}</span>
        </span>
        <span aria-hidden="true" className={`absolute right-3 top-3 hidden h-2 w-2 rounded-full md:block ${plan === option.key ? "bg-gold" : "bg-transparent"}`}/>
      </button>)}
    </fieldset>
    <label className="mb-3 flex cursor-pointer items-start gap-2.5 text-left text-[10px] leading-4 text-fog md:mb-3 md:text-xs md:leading-5"><input type="checkbox" checked={adultConfirmed} onChange={event => setAdultConfirmed(event.target.checked)} className="mt-0.5 h-3.5 w-3.5 shrink-0 accent-gold" />I confirm that I am 18 or older and may legally access mature illustrated reference material in my location.</label>
    {!signedIn ? <Link href="/login?next=/premium" className="btn-primary hidden w-full justify-center sm:flex">Sign in to start Premium</Link> : instagramBrowser ? <div className="hidden rounded-2xl border border-gold/35 bg-gold/10 p-4 text-left sm:block">
      <p className="font-medium text-gold">Open Chrome to subscribe securely</p>
      <p className="mt-1 text-xs leading-relaxed text-fog">Instagram&apos;s browser blocks the secure Razorpay checkout. Open AniPins in Chrome, then continue with the same account.</p>
      <a href={openInChrome} className="btn-primary mt-3 w-full justify-center">Open AniPins in Chrome</a>
      <p className="mt-3 text-center text-xs text-fog">If Chrome does not open, tap Instagram&apos;s ⋮ menu and choose <span className="text-paper">Open in browser</span>.</p>
    </div> : <>
    <button type="button" disabled={!ready || busy || scriptFailed} onClick={startCheckout} className="btn-primary hidden w-full justify-center disabled:cursor-wait disabled:opacity-60 sm:flex">{busy ? "Opening secure checkout…" : ready ? `Continue with Premium — ${plans.find(option => option.key === plan)?.amount} / ${plans.find(option => option.key === plan)?.cadence}` : scriptFailed ? "Checkout unavailable — try Chrome" : "Loading secure checkout…"}</button>
    <p className="mt-2 hidden text-center text-[11px] leading-5 text-fog sm:block">Secure checkout by Razorpay. You&apos;ll see the selected billing period before paying.</p>
    </>}
    <div className="fixed inset-x-0 bottom-[calc(4.25rem+env(safe-area-inset-bottom,0px))] z-[61] border-t border-gold/20 bg-[#100f0d]/95 px-4 pt-3 shadow-[0_-12px_36px_rgba(0,0,0,.5)] backdrop-blur-xl sm:hidden" style={{ paddingBottom: "12px" }}>
      {!signedIn ? <Link href="/login?next=/premium" className="btn-primary flex w-full justify-center">Sign in to start Premium</Link> : instagramBrowser ? <a href={openInChrome} className="btn-primary flex w-full justify-center">Open AniPins in Chrome</a> : <button type="button" disabled={!ready || busy || scriptFailed} onClick={startCheckout} className="btn-primary w-full justify-center disabled:cursor-wait disabled:opacity-60">{busy ? "Opening secure checkout…" : ready ? `Continue · ${plans.find(option => option.key === plan)?.amount} / ${plans.find(option => option.key === plan)?.cadence}` : scriptFailed ? "Checkout unavailable — try Chrome" : "Loading secure checkout…"}</button>}
      <p className="mt-1.5 text-center text-[10px] leading-4 text-fog">Secure Razorpay checkout · billing period shown before payment</p>
    </div>
  </>;
}
