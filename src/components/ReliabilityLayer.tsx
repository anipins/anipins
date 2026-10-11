"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "./Toaster";
// CommonJS keeps these helpers directly testable by the lightweight Node test suite.
const { connectionMessage } = require("@/lib/reliability-state");

type ConnectionInfo = { effectiveType?: string; saveData?: boolean };

export default function ReliabilityLayer() {
  const [message, setMessage] = useState<string | null>(null);
  const [sessionExpired, setSessionExpired] = useState(false);

  useEffect(() => {
    const updateConnection = () => {
      const connection = (navigator as Navigator & { connection?: ConnectionInfo }).connection;
      setMessage(connectionMessage({ online: navigator.onLine, effectiveType: connection?.effectiveType, saveData: connection?.saveData }));
    };
    const expired = () => { setSessionExpired(true); toast("Your session expired. Please sign in again.", "err"); };
    const invalid = (event: Event) => {
      const field = event.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null;
      if (field?.validationMessage) toast(field.validationMessage, "err");
    };
    updateConnection();
    window.addEventListener("online", updateConnection);
    window.addEventListener("offline", updateConnection);
    window.addEventListener("anipins:session-expired", expired);
    document.addEventListener("invalid", invalid, true);
    return () => {
      window.removeEventListener("online", updateConnection);
      window.removeEventListener("offline", updateConnection);
      window.removeEventListener("anipins:session-expired", expired);
      document.removeEventListener("invalid", invalid, true);
    };
  }, []);

  if (!message && !sessionExpired) return null;
  return (
    <div className="fixed inset-x-3 top-20 z-[110] mx-auto flex max-w-xl items-center justify-between gap-3 rounded-2xl border border-gold/30 bg-panel/95 px-4 py-3 text-sm text-paper shadow-2xl backdrop-blur md:top-5">
      <span role="status">{sessionExpired ? "Your session expired. Sign in again to continue." : message}</span>
      {sessionExpired ? <Link href="/login" className="shrink-0 rounded-full bg-gold px-3 py-1.5 font-medium text-ink">Sign in</Link> : <button type="button" onClick={() => location.reload()} className="shrink-0 text-gold underline underline-offset-4">Retry</button>}
    </div>
  );
}
