"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import GoogleSignInButton from "@/components/GoogleSignInButton";

export default function DeleteAccountForm() {
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [googleVerified, setGoogleVerified] = useState(false);
  const [reauthBusy, setReauthBusy] = useState(false);
  useEffect(() => { fetch("/api/auth/me", { cache: "no-store" }).then(r => r.json()).then(data => setSignedIn(Boolean(data.user))).catch(() => setSignedIn(false)); }, []);
  const verifyGoogle = async (credential: string) => {
    setReauthBusy(true); setMessage("");
    try {
      const response = await fetch("/api/account/reauth/google", {
        method: "POST", headers: { "Content-Type": "application/json" },
        credentials: "same-origin", body: JSON.stringify({ credential }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Google verification failed.");
      setGoogleVerified(true);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Google verification failed.");
    } finally { setReauthBusy(false); }
  };
  const remove = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!password && !googleVerified) { setMessage("Confirm with your password or verify your linked Google account first."); return; }
    if (!confirm("Permanently delete your AniPins account and profile data? Active Premium renewal will be cancelled. Minimum billing records required for receipts, refunds, disputes or legal requirements will be retained. This cannot be undone.")) return;
    setBusy(true); setMessage("");
    const response = await fetch("/api/account", { method: "DELETE", headers: { "Content-Type": "application/json" }, credentials: "same-origin", body: JSON.stringify({ password }) });
    const data = await response.json().catch(() => ({}));
    if (response.ok) { location.href = "/?accountDeleted=1"; return; }
    setMessage(data.error || "Account deletion failed. Please try again."); setBusy(false);
  };
  if (signedIn === null) return <div className="skeleton mt-6 h-36 rounded-2xl" />;
  if (!signedIn) return <div className="mt-6 rounded-2xl bg-soft p-5 hairline"><p className="text-sm text-fog">Sign in first so AniPins can verify and delete the correct account.</p><Link href="/login?next=/delete-account" className="btn-primary mt-4">Sign in to continue</Link></div>;
  return <form onSubmit={remove} className="mt-6 rounded-2xl border border-red-500/30 bg-red-500/5 p-5">
    <p className="mb-4 text-sm leading-6 text-fog">Deleting your account cancels active Premium renewal. Minimum billing records needed for receipts, refunds, disputes or legal requirements are retained.</p>
    <label className="label" htmlFor="delete-password">Confirm your password</label>
    <input id="delete-password" type="password" autoComplete="current-password" value={password} onChange={event => setPassword(event.target.value)} className="input" />
    <div className="my-4 flex items-center gap-3 text-xs uppercase tracking-widest text-fog" aria-hidden="true"><span className="h-px flex-1 bg-line" />or<span className="h-px flex-1 bg-line" /></div>
    <p className="mb-3 text-sm text-fog">Google-only accounts can verify the linked Google account instead.</p>
    {googleVerified ? <p className="rounded-xl border border-emerald-400/30 bg-emerald-400/10 p-3 text-sm text-emerald-200">Google account verified for this deletion.</p> : <div aria-busy={reauthBusy} className={reauthBusy ? "pointer-events-none opacity-60" : ""}><GoogleSignInButton credentialOnly onCredential={credential => void verifyGoogle(credential)} onSuccess={() => {}} onTwoFactor={() => {}} /></div>}
    <button disabled={busy || reauthBusy} className="btn mt-4 bg-red-500 px-6 py-3 text-white hover:bg-red-400 disabled:opacity-50">{busy ? "Deleting…" : "Permanently delete account"}</button>
    {message ? <p role="alert" className="mt-3 text-sm text-red-300">{message}</p> : null}
  </form>;
}
