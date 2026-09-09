"use client";
import { useEffect, useState } from "react";
import { toast } from "./Toaster";

export default function FollowButton({ kind, value, label }: { kind: "character" | "anime"; value: string; label: string }) {
  const [following, setFollowing] = useState(false);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    fetch("/api/follows").then(r => r.json()).then(d => setFollowing((d.follows || []).some((f: any) => f.kind === kind && f.value === value))).catch(() => {});
  }, [kind, value]);
  const toggle = async () => {
    setBusy(true);
    const r = await fetch("/api/follows", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind, value, label, remove: following }) });
    const d = await r.json();
    setBusy(false);
    if (r.status === 401) { toast("Sign in to follow and get new artwork alerts", "err"); return; }
    if (!r.ok) { toast(d.error || "Could not update follow", "err"); return; }
    setFollowing(d.following);
    toast(d.following ? `Following ${label}` : `Unfollowed ${label}`);
  };
  return <button type="button" disabled={busy} onClick={toggle} className={`chip ${following ? "chip-on" : ""}`} aria-pressed={following}>
    {following ? "✓ Following" : "+ Follow"} {kind === "anime" ? "series" : "character"}
  </button>;
}
