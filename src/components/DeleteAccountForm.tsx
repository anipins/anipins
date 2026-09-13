"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function DeleteAccountForm() {
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => { fetch("/api/auth/me", { cache: "no-store" }).then(r => r.json()).then(data => setSignedIn(Boolean(data.user))).catch(() => setSignedIn(false)); }, []);
  const remove = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!confirm("Permanently delete your AniPins account and associated profile data? This cannot be undone.")) return;
    setBusy(true); setMessage("");
    const response = await fetch("/api/account", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password }) });
    const data = await response.json().catch(() => ({}));
    if (response.ok) { location.href = "/?accountDeleted=1"; return; }
    setMessage(data.error || "Account deletion failed. Please try again."); setBusy(false);
  };
  if (signedIn === null) return <div className="skeleton mt-6 h-36 rounded-2xl" />;
  if (!signedIn) return <div className="mt-6 rounded-2xl bg-soft p-5 hairline"><p className="text-sm text-fog">Sign in first so AniPins can verify and delete the correct account.</p><Link href="/login?next=/delete-account" className="btn-primary mt-4">Sign in to continue</Link></div>;
  return <form onSubmit={remove} className="mt-6 rounded-2xl border border-red-500/30 bg-red-500/5 p-5"><label className="label" htmlFor="delete-password">Confirm your password</label><input id="delete-password" type="password" required autoComplete="current-password" value={password} onChange={event => setPassword(event.target.value)} className="input" /><button disabled={busy} className="btn mt-4 bg-red-500 px-6 py-3 text-white hover:bg-red-400 disabled:opacity-50">{busy ? "Deleting…" : "Permanently delete account"}</button>{message ? <p role="alert" className="mt-3 text-sm text-red-300">{message}</p> : null}</form>;
}
