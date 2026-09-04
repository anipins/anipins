"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function Login() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(""); setBusy(true);
    const r = await fetch(`/api/auth/${mode}`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, name }),
    });
    const d = await r.json();
    setBusy(false);
    if (!r.ok) { setErr(d.error || "Something went wrong"); return; }
    router.push(d.role === "ADMIN" ? "/admin" : "/");
    router.refresh();
  };

  return (
    <section className="mx-auto flex min-h-[80vh] max-w-md flex-col justify-center px-6 pt-24">
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="rounded-3xl bg-panel hairline p-8">
        <h1 className="font-display text-2xl font-semibold">{mode === "login" ? "Welcome back" : "Join AniPins"}</h1>
        <p className="mt-1 text-sm text-fog">{mode === "login" ? "Sign in to your account." : "Create an account to save artwork."}</p>
        <form onSubmit={submit} className="mt-6 space-y-4">
          {mode === "register" && (
            <div><label className="label">Name</label>
              <input className="input" value={name} onChange={e => setName(e.target.value)} placeholder="Your name" /></div>
          )}
          <div><label className="label">Email</label>
            <input className="input" type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" /></div>
          <div><label className="label">Password</label>
            <input className="input" type="password" required minLength={6} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" /></div>
          {err && <p className="text-sm text-red-400">{err}</p>}
          <button disabled={busy} className="btn-primary w-full disabled:opacity-50">{busy ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}</button>
        </form>
        <button onClick={() => { setMode(mode === "login" ? "register" : "login"); setErr(""); }}
          className="mt-5 w-full text-center text-sm text-fog hover:text-paper transition-colors">
          {mode === "login" ? "New here? Create an account" : "Already have an account? Sign in"}
        </button>
      </motion.div>
    </section>
  );
}
