"use client";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import GoogleSignInButton from "@/components/GoogleSignInButton";
import { betterAuthClient, isBetterAuthMode } from "@/lib/better-auth-client";

export default function Login() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [challenge, setChallenge] = useState("");
  const [betterAuthMfa, setBetterAuthMfa] = useState(false);
  const [code, setCode] = useState("");
  const [mfaEnrollment, setMfaEnrollment] = useState<{ secret: string; otpauthUri: string } | null>(null);
  const [newRecoveryCodes, setNewRecoveryCodes] = useState<string[]>([]);
  const [legacyAuthFallback, setLegacyAuthFallback] = useState(false);
  const [instagramBrowser, setInstagramBrowser] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setInstagramBrowser(/Instagram/i.test(navigator.userAgent));
  }, []);

  const finishSignIn = useCallback(async (role: string) => {
    if ((!isBetterAuthMode || legacyAuthFallback) && typeof window !== "undefined" && new URLSearchParams(window.location.search).get("mobile") === "1") {
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
    const next = new URLSearchParams(window.location.search).get("next");
    const safeNext = next && next.startsWith("/") && !next.startsWith("//") ? next : "";
    router.push(role === "ADMIN" ? "/admin" : safeNext || "/");
    router.refresh();
  }, [legacyAuthFallback, router]);

  const requestTwoFactor = useCallback((nextChallenge: string) => {
    setChallenge(nextChallenge);
    setPassword("");
    setErr("");
  }, []);

  const beginMfaRecovery = useCallback(async (credential: string) => {
    setErr("");
    setBusy(true);
    try {
      const response = await fetch("/api/auth/admin-mfa/recovery", {
        method: "POST", credentials: "same-origin", cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "begin", credential }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error === "google_account_mismatch"
        ? "Choose the Google account linked to the AniPins administrator."
        : result.error === "google_verification_failed"
          ? "Google verification failed. Try the Google button again."
          : "Authenticator recovery could not start. Sign in again and retry.");
      setMfaEnrollment({ secret: String(result.secret), otpauthUri: String(result.otpauthUri) });
    } catch (error) {
      setErr(error instanceof Error ? error.message : "Authenticator recovery could not start.");
    } finally {
      setBusy(false);
    }
  }, []);

  const confirmMfaRecovery = async (event: React.FormEvent) => {
    event.preventDefault();
    setErr(""); setBusy(true);
    try {
      const response = await fetch("/api/auth/admin-mfa/recovery", {
        method: "POST", credentials: "same-origin", cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "confirm", code }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error === "invalid_code"
        ? "That new code did not match. Check your phone time and try the current code again."
        : "Authenticator setup expired. Start the recovery steps again.");
      const profileResponse = await fetch("/api/auth/me", { credentials: "same-origin", cache: "no-store" });
      const profile = await profileResponse.json();
      if (!profileResponse.ok || !profile.user || profile.user.role !== "ADMIN") {
        throw new Error("The new authenticator was saved, but the administrator session could not be confirmed. Sign in again.");
      }
      setNewRecoveryCodes(Array.isArray(result.recoveryCodes) ? result.recoveryCodes.map(String) : []);
      setMfaEnrollment(null);
      setBetterAuthMfa(false);
      setCode("");
    } catch (error) {
      setErr(error instanceof Error ? error.message : "Authenticator setup failed.");
    } finally {
      setBusy(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(""); setBusy(true);
    if (betterAuthMfa) {
      try {
        const verification = await fetch("/api/auth/admin-mfa", {
          method: "POST", credentials: "same-origin", cache: "no-store",
          headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code }),
        });
        const result = await verification.json();
        if (!verification.ok) throw new Error(result.error === "temporarily_locked" ? "Too many incorrect codes. Wait 15 minutes, then try again." : result.error === "invalid_code" ? "That code did not match. Check your authenticator app or use a recovery code." : "Security verification could not be completed.");
        const response = await fetch("/api/auth/me", { credentials: "same-origin", cache: "no-store" });
        const profile = await response.json();
        if (!response.ok || !profile.user) throw new Error("Your verified AniPins account could not be loaded. Please sign in again.");
        setBetterAuthMfa(false); setCode("");
        finishSignIn(String(profile.user.role || "USER"));
      } catch (authError) {
        setErr(authError instanceof Error ? authError.message : "Security verification failed.");
      } finally {
        setBusy(false);
      }
      return;
    }
    if (isBetterAuthMode && !legacyAuthFallback) {
      try {
        const result = mode === "login"
          ? await betterAuthClient.signIn.email({ email: email.trim().toLowerCase(), password })
          : await betterAuthClient.signUp.email({ email: email.trim().toLowerCase(), password, name: name.trim() });
        if (result.error) throw new Error(result.error.message || "Sign-in failed.");

        // The app Worker validates the Better Auth session, links its identity
        // to the D1 business profile, then signs the short-lived container claim.
        const response = await fetch("/api/auth/me", { credentials: "same-origin", cache: "no-store" });
        const data = await response.json();
        if (response.ok && data.requiresTwoFactor) {
          setBetterAuthMfa(true); setCode(""); setPassword("");
          return;
        }
        if (!response.ok || !data.user) {
          await betterAuthClient.signOut({});
          setLegacyAuthFallback(true);
          setMode("login");
          setErr("This account needs its existing security verification. Sign in again with your existing AniPins credentials.");
          return;
        }
        finishSignIn(String(data.user.role || "USER"));
      } catch (authError) {
        setErr(authError instanceof Error ? authError.message : "Sign-in failed.");
      } finally {
        setBusy(false);
      }
      return;
    }
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
        <h1 className="font-display text-2xl font-semibold">{newRecoveryCodes.length ? "Save your recovery codes" : mfaEnrollment ? "Create a new authenticator" : challenge || betterAuthMfa ? "Security verification" : mode === "login" ? "Welcome back" : "Join AniPins"}</h1>
        <p className="mt-1 text-sm text-fog">{newRecoveryCodes.length ? "Your new authenticator is ready. Save these one-time recovery codes before continuing." : mfaEnrollment ? "Add this AniPins key to your authenticator app, then enter the code it shows." : challenge || betterAuthMfa ? "Enter your authenticator code, a recovery code, or verify your linked Google account to create a new authenticator." : new URLSearchParams(typeof window !== "undefined" ? window.location.search : "").get("mobile") === "1" ? "Continue with Google to sign in to AniPins." : mode === "login" ? "Sign in to your account." : "Create an account to save artwork."}</p>
        {instagramBrowser && !challenge && !betterAuthMfa && (
          <aside className="mt-4 rounded-2xl border border-gold/25 bg-gold/10 p-3 text-sm text-paper/90">
            <p className="font-medium text-gold">Open AniPins in Chrome for Google sign-in</p>
            <p className="mt-1 text-xs leading-relaxed text-fog">Instagram&apos;s in-app browser does not share your phone or Chrome Google accounts. Tap Instagram&apos;s ⋮ menu, then choose <span className="text-paper">Open in browser</span> to see your normal account picker.</p>
          </aside>
        )}
        {newRecoveryCodes.length > 0 ? <div className="mt-6 space-y-4">
          <div className="grid grid-cols-2 gap-2 rounded-xl border border-line bg-soft p-4 font-mono text-sm text-paper sm:grid-cols-4">{newRecoveryCodes.map(item => <code key={item}>{item}</code>)}</div>
          <button type="button" className="btn-ghost w-full" onClick={() => void navigator.clipboard.writeText(newRecoveryCodes.join("\n")).then(() => setErr("Recovery codes copied. Store them somewhere private."))}>Copy recovery codes</button>
          {err && <p className="text-sm text-red-400">{err}</p>}
          <button type="button" className="btn-primary w-full" onClick={() => finishSignIn("ADMIN")}>Continue to AniPins</button>
        </div> : mfaEnrollment ? <form onSubmit={confirmMfaRecovery} className="mt-6 space-y-4">
          <div className="rounded-xl border border-line bg-soft p-4"><p className="text-sm text-paper">In your authenticator app, choose <span className="font-medium">Enter a setup key</span> (or Manual entry), then enter this key:</p><code className="mt-3 block break-all rounded-lg border border-line p-3 font-mono text-gold">{mfaEnrollment.secret}</code><p className="mt-3 text-xs text-fog">Keep this key private. It expires in 10 minutes. Do not send it to anyone.</p></div>
          <div><label className="label">Code from the new authenticator</label><input className="input font-mono tracking-[.25em]" inputMode="numeric" autoComplete="one-time-code" required value={code} onChange={e=>setCode(e.target.value)} placeholder="000000" autoFocus /></div>
          {err && <p className="text-sm text-red-400">{err}</p>}
          <button disabled={busy} className="btn-primary w-full disabled:opacity-50">{busy ? "Checking…" : "Confirm new authenticator"}</button>
        </form> : <form onSubmit={submit} className="mt-6 space-y-4">
          {challenge || betterAuthMfa ? <div><label className="label">Authentication code or recovery code</label><input className="input font-mono tracking-[.25em]" autoComplete="one-time-code" required value={code} onChange={e=>setCode(e.target.value)} placeholder="000000" autoFocus /></div> : <>
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
          <button disabled={busy} className="btn-primary w-full disabled:opacity-50">{busy ? "Please wait…" : challenge || betterAuthMfa ? "Verify and sign in" : mode === "login" ? "Sign in" : "Create account"}</button>
        </form>}
        {betterAuthMfa && !mfaEnrollment && newRecoveryCodes.length === 0 && <div className="mt-5 rounded-xl border border-line bg-soft p-4">
          <p className="mb-3 text-sm text-fog">If you no longer have the old authenticator or its recovery codes, verify the linked Google account to set up a replacement.</p>
          <GoogleSignInButton credentialOnly onCredential={credential => void beginMfaRecovery(credential)} onSuccess={() => {}} onTwoFactor={() => {}} />
        </div>}
        {!challenge && !betterAuthMfa && !mfaEnrollment && newRecoveryCodes.length === 0 && <>
          <div className="my-5 flex items-center gap-3" aria-hidden="true">
            <span className="h-px flex-1 bg-line" />
            <span className="text-xs uppercase tracking-[.2em] text-fog">or</span>
            <span className="h-px flex-1 bg-line" />
          </div>
        <GoogleSignInButton
            onSuccess={finishSignIn}
            onTwoFactor={requestTwoFactor}
            onAdminMfaRequired={() => { setBetterAuthMfa(true); setCode(""); setErr(""); }}
          forceLegacyAuth={legacyAuthFallback}
          />
        {isBetterAuthMode && !legacyAuthFallback && mode === "login" && (
          <button type="button" onClick={() => { setLegacyAuthFallback(true); setErr(""); }} className="w-full text-center text-xs text-fog hover:text-paper transition-colors">
            Use existing sign-in
          </button>
        )}
        </>}
        {!mfaEnrollment && newRecoveryCodes.length === 0 && <button onClick={() => { if(challenge || betterAuthMfa){if(betterAuthMfa) void betterAuthClient.signOut({});setChallenge("");setBetterAuthMfa(false);setCode("");}else setMode(mode === "login" ? "register" : "login"); setErr(""); }}
          className="mt-5 w-full text-center text-sm text-fog hover:text-paper transition-colors">
          {challenge || betterAuthMfa ? "Back to sign in" : mode === "login" ? "New here? Create an account" : "Already have an account? Sign in"}
        </button>}
      </motion.div>
    </section>
  );
}
