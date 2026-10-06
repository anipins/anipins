"use client";

import Script from "next/script";
import { useState } from "react";
import { toast } from "@/components/Toaster";

declare global {
  interface Window { Razorpay?: new (options: Record<string, unknown>) => { open: () => void }; }
}

export default function PremiumCheckout() {
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  async function startCheckout() {
    if (!ready || !window.Razorpay) { toast("Secure checkout is still loading. Please try again in a moment.", "err"); return; }
    setBusy(true);
    try {
      const response = await fetch("/api/billing/subscription", { method: "POST" });
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
          toast(result.premium ? "AniPins Premium is active." : "Payment authorized. Access will start when Razorpay activates the subscription.");
        },
        modal: { ondismiss: () => setBusy(false) },
      });
      checkout.open();
    } catch (error: any) { toast(error?.message || "Could not open secure checkout.", "err"); }
    finally { setBusy(false); }
  }
  return <>
    <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" onLoad={() => setReady(true)} onError={() => toast("Secure checkout could not load.", "err")} />
    <button type="button" disabled={!ready || busy} onClick={startCheckout} className="btn-primary w-full justify-center disabled:cursor-wait disabled:opacity-60">{busy ? "Opening secure checkout…" : ready ? "Start Premium — ₹199 / month" : "Loading secure checkout…"}</button>
  </>;
}
