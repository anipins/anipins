"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Only mounted for a signed-in user with an existing non-active subscription.
 * It does not delay rendering; it checks Razorpay in the background and moves
 * the buyer into the private feed as soon as Razorpay marks the plan active.
 */
export default function PremiumActivationWatcher() {
  const [attempt, setAttempt] = useState(0);
  const attempts = useRef(0);

  useEffect(() => {
    let cancelled = false;
    let timer: number | undefined;
    const check = async () => {
      try {
        const response = await fetch("/api/billing/status", { method: "POST", cache: "no-store" });
        const data = await response.json();
        if (!cancelled && data?.premium) {
          window.location.assign("/premium?welcome=1");
          return;
        }
      } catch {
        // A webhook will make the next visit work if the temporary check fails.
      }
      if (!cancelled && attempts.current < 8) {
        attempts.current += 1;
        setAttempt(attempts.current);
        timer = window.setTimeout(check, 2500);
      }
    };
    void check();
    return () => { cancelled = true; if (timer) window.clearTimeout(timer); };
  }, []);

  return <div role="status" className="mb-5 rounded-2xl border border-gold/35 bg-gold/10 px-4 py-3 text-sm text-fog">
    <span className="font-semibold text-gold">Confirming your Premium membership</span>
    <span className="ml-1">— your secure payment is received; access will open automatically.{attempt >= 8 ? " Razorpay is still finalizing it; reopen this page in a minute." : attempt > 2 ? " Still checking securely…" : ""}</span>
  </div>;
}
