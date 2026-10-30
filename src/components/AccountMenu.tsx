"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { isBetterAuthMode } from "@/lib/better-auth-client";
import { profileImageSource } from "@/lib/profile-media.mjs";

type Account = { id: number; name: string; email: string; avatar: string; role: string; active: boolean };

export default function AccountMenu({ user }: { user: any }) {
  const [open, setOpen] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const menu = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    fetch("/api/auth/accounts", { cache: "no-store" }).then(r => r.ok ? r.json() : { accounts: [] }).then(d => setAccounts(d.accounts || [])).catch(() => setAccounts([]));
  }, [open]);
  useEffect(() => {
    const close = (event: MouseEvent) => { if (menu.current && !menu.current.contains(event.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", close); return () => document.removeEventListener("mousedown", close);
  }, []);
  const switchAccount = async (id: number) => {
    const response = await fetch("/api/auth/accounts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: id }) });
    if (response.ok) location.reload();
  };
  const avatar = (account: Partial<Account>) => profileImageSource(account.avatar || "") ? <img src={profileImageSource(account.avatar || "")} alt="" className="h-full w-full object-cover" /> : (account.name || account.email || "A").slice(0, 1).toUpperCase();
  if (isBetterAuthMode) return <Link href="/profile" aria-label="Open profile" className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm text-fog transition-colors hover:bg-paper/5 hover:text-paper min-[1800px]:w-auto min-[1800px]:gap-2 min-[1800px]:px-3"><span className="grid h-10 w-10 place-items-center overflow-hidden rounded-full bg-soft text-xs font-semibold text-gold hairline">{avatar(user)}</span><span className="hidden max-w-24 truncate min-[1800px]:block">{user.nickname || user.name || "Profile"}</span></Link>;
  return <div ref={menu} className="relative">
    <button type="button" onClick={() => setOpen(value => !value)} aria-expanded={open} aria-label="Open account menu" className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm text-fog transition-colors hover:bg-paper/5 hover:text-paper min-[1800px]:w-auto min-[1800px]:gap-2 min-[1800px]:px-3">
      <span className="grid h-10 w-10 place-items-center overflow-hidden rounded-full bg-soft text-xs font-semibold text-gold hairline">{avatar(user)}</span>
      <span className="hidden max-w-24 truncate min-[1800px]:block">{user.nickname || user.name || "Profile"}</span>
    </button>
    {open && <div className="absolute right-0 top-full z-[70] mt-2 w-72 overflow-hidden rounded-2xl border border-paper/10 bg-panel p-2 shadow-2xl backdrop-blur">
      <p className="px-3 pb-2 pt-1 text-[10px] font-semibold uppercase tracking-[.18em] text-fog">Accounts on this device</p>
      {(accounts.length ? accounts : [{ id: user.id, name: user.nickname || user.name || user.email, email: user.email, avatar: user.avatar, role: user.role, active: true }]).map(account => <button key={account.id} type="button" disabled={account.active} onClick={() => switchAccount(account.id)} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-paper/5 disabled:cursor-default">
        <span className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-full bg-soft text-xs font-semibold text-gold hairline">{avatar(account)}</span>
        <span className="min-w-0 flex-1"><span className="block truncate text-sm text-paper">{account.name}</span><span className="block truncate text-xs text-fog">{account.email}</span></span>
        {account.active && <span className="text-[10px] font-medium text-gold">Active</span>}
      </button>)}
      <div className="my-2 h-px bg-paper/10" />
      <Link href="/login?add=1" onClick={() => setOpen(false)} className="block rounded-xl px-3 py-2.5 text-sm text-fog hover:bg-paper/5 hover:text-paper">Add another account</Link>
      <Link href="/settings" onClick={() => setOpen(false)} className="block rounded-xl px-3 py-2.5 text-sm text-fog hover:bg-paper/5 hover:text-paper">Settings</Link>
    </div>}
  </div>;
}
