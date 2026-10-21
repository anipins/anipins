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
    <label className="mb-3 flex cursor-pointer items-start gap-2.5 text-left text-xs leading-5 text-fog"><input type="checkbox" checked={adultConfirmed} onChange={event => setAdultConfirmed(event.target.checked)} className="mt-1 h-3.5 w-3.5 accent-gold" />I confirm that I am 18+ and may legally access mature illustrated reference material in my location.</label>
    <fieldset className="mb-4 grid grid-cols-1 gap-2.5 md:grid-cols-3" aria-label="Choose Premium billing period">
      {plans.map(option => <button key={option.key} type="button" aria-pressed={plan === option.key} onClick={() => setPlan(option.key)} className={`group relative flex min-h-[7.5rem] w-full items-start justify-between gap-3 rounded-2xl border p-4 text-left transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-[#12110e] md:min-h-[12rem] md:flex-col md:justify-start md:gap-2 md:p-3 ${plan === option.key ? "border-gold bg-gold/10 text-paper shadow-[0_0_24px_rgba(208,170,87,.1)]" : "border-paper/10 bg-black/25 text-fog hover:border-gold/45 hover:bg-gold/[.04]"}`}>
        <span className="min-w-0 flex-1 md:order-2 md:flex-none">
          <span className="flex flex-wrap items-center gap-2">
            <span className={`text-xs font-semibold uppercase tracking-[.16em] ${plan === option.key ? "text-gold" : "text-paper"}`}>{option.name}</span>
            {"badge" in option && <span className="rounded-full bg-gold px-2 py-0.5 text-[9px] font-bold tracking-wide text-[#17130b]">{option.badge}</span>}
          </span>
          <span className="mt-1 block font-display text-2xl font-semibold tracking-tight text-paper md:text-xl">{option.amount}<span className="ml-1 font-sans text-xs font-normal text-fog">/ {option.cadence}</span></span>
          <span className="mt-1.5 block text-xs leading-5 text-fog md:mt-2">{option.pitch}</span>
          <span className="mt-1.5 block text-[10px] font-medium text-gold/90">{option.note}</span>
        </span>
        <span aria-hidden="true" className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border transition-colors md:absolute md:right-3 md:top-3 ${plan === option.key ? "border-gold bg-gold text-[#17130b]" : "border-paper/25 text-transparent group-hover:border-gold/60"}`}>
          <svg viewBox="0 0 16 16" className="h-3 w-3" fill="none"><path d="m3.5 8 3 3 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </span>
      </button>)}
    </fieldset>
    {!signedIn ? <Link href="/login?next=/premium" className="btn-primary w-full justify-center">Sign in to start Premium</Link> : instagramBrowser ? <div className="rounded-2xl border border-gold/35 bg-gold/10 p-4 text-left">
      <p className="font-medium text-gold">Open Chrome to subscribe securely</p>
      <p className="mt-1 text-xs leading-relaxed text-fog">Instagram&apos;s browser blocks the secure Razorpay checkout. Open AniPins in Chrome, then continue with the same account.</p>
      <a href={openInChrome} className="btn-primary mt-3 w-full justify-center">Open AniPins in Chrome</a>
      <p className="mt-3 text-center text-xs text-fog">If Chrome does not open, tap Instagram&apos;s ⋮ menu and choose <span className="text-paper">Open in browser</span>.</p>
    </div> : <>
    <button type="button" disabled={!ready || busy || scriptFailed} onClick={startCheckout} className="btn-primary w-full justify-center disabled:cursor-wait disabled:opacity-60">{busy ? "Opening secure checkout…" : ready ? `Continue with Premium — ${plans.find(option => option.key === plan)?.amount} / ${plans.find(option => option.key === plan)?.cadence}` : scriptFailed ? "Checkout unavailable — try Chrome" : "Loading secure checkout…"}</button>
    <p className="mt-2 text-center text-[11px] leading-5 text-fog">Secure checkout by Razorpay. You&apos;ll see the selected billing period before paying.</p>
    </>}
  </>;
}
