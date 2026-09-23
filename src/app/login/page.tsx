"use client";
import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import GoogleSignInButton from "@/components/GoogleSignInButton";

export default function Login() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [challenge, setChallenge] = useState("");
  const [code, setCode] = useState("");
  const router = useRouter();

  const finishSignIn = useCallback(async (role: string) => {
    if (typeof window !== "undefined" && new URLSearchParams(window.location.search).get("mobile") === "1") {
      try {
        const ticketResponse = await fetch("/api/auth/mobile-ticket", {
          method: "POST",
          credentials: "same-origin",
          cache: "no-store",
        });
        const ticket = await ticketResponse.json();
        if (ticketResponse.ok && ticket.ticket) {
          window.location.href = "anipins://auth?ticket=" + encodeURIComponent(String(ticket.ticket));
          return;
        }
      } catch {}
      setErr("Could not return to the AniPins app. Please reopen the app and try again.");
      return;
    }
    router.push(role === "ADMIN" ? "/admin" : "/");
    router.refresh();
  }, [router]);

  const requestTwoFactor = useCallback((nextChallenge: string) => {
    setChallenge(nextChallenge);
    setPassword("");
    setErr("");
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(""); setBusy(true);
    const r = await fetch(`/api/auth/${mode}`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(challenge ? { challenge, code } : { email, password, name }),
    });
    const d = await r.json();
    setBusy(false);
    if (!r.ok) { setErr(d.error || "Something went wrong"); return; }
    if (d.requiresTwoFactor) { setChallenge(d.challenge); setPassword(""); return; }
    finishSignIn(d.role);
  };

  return (
    <section className="mx-auto flex min-h-[80vh] w-full max-w-md flex-col justify-center px-4 pt-24 sm:px-6">
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="min-w-0 overflow-hidden rounded-3xl bg-panel hairline p-6 sm:p-8">
        <h1 className="font-display text-2xl font-semibold">{challenge ? "Security verification" : mode === "login" ? "Welcome back" : "Join AniPins"}</h1>
        <p className="mt-1 text-sm text-fog">{challenge ? "Enter the code from your authenticator app or a recovery code." : mode === "login" ? "Sign in to your account." : "Create an account to save artwork."}</p>
        <form onSubmit={submit} className="mt-6 space-y-4">
          {challenge ? <div><label className="label">Authentication code</label><input className="input font-mono tracking-[.25em]" inputMode="numeric" autoComplete="one-time-code" required value={code} onChange={e=>setCode(e.target.value)} placeholder="000000" autoFocus /></div> : <>
          {mode === "register" && (
            <div><label className="label">Name</label>
              <input className="input" value={name} onChange={e => setName(e.target.value)} placeholder="Your name" /></div>
          )}
          <div><label className="label">Email</label>
            <input className="input" type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" /></div>
          <div><label className="label">Password</label>
            <input className="input" type="password" required minLength={mode === "register" ? 8 : 1} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" /></div>
          </>}
          {err && <p className="text-sm text-red-400">{err}</p>}
          <button disabled={busy} className="btn-primary w-full disabled:opacity-50">{busy ? "Please wait…" : challenge ? "Verify and sign in" : mode === "login" ? "Sign in" : "Create account"}</button>
        </form>
        {!challenge && <>
          <div className="my-5 flex items-center gap-3" aria-hidden="true">
            <span className="h-px flex-1 bg-line" />
            <span className="text-xs uppercase tracking-[.2em] text-fog">or</span>
            <span className="h-px flex-1 bg-line" />
          </div>
          <GoogleSignInButton
            onSuccess={finishSignIn}
            onTwoFactor={requestTwoFactor}
          />
        </>}
        <button onClick={() => { if(challenge){setChallenge("");setCode("");}else setMode(mode === "login" ? "register" : "login"); setErr(""); }}
          className="mt-5 w-full text-center text-sm text-fog hover:text-paper transition-colors">
          {challenge ? "Back to sign in" : mode === "login" ? "New here? Create an account" : "Already have an account? Sign in"}
        </button>
      </motion.div>
    </section>
  );
}
