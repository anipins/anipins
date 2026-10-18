"use client";
import { useEffect, useState } from "react";
import { getAdminJson } from "@/lib/admin-prefetch";

function date(value: unknown) {
  if (!value) return "—";
  const n = Number(value);
  const parsed = Number.isFinite(n) && n > 1_000_000_000
    ? new Date(n < 100_000_000_000 ? n * 1000 : n)
    : new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? "—" : parsed.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
}

export default function AdminPayments() {
  const [items, setItems] = useState<any[] | null>(null);
  const [transactions, setTransactions] = useState<any[] | null>(null);
  useEffect(() => { getAdminJson("/api/admin/payments", { cache: "no-store" }).then(data => { setItems(data.subscriptions || []); setTransactions(data.transactions || []); }).catch(() => { setItems([]); setTransactions([]); }); }, []);
  const amount = (value: unknown, currency: string) => {
    if (value === null || value === undefined || !Number.isFinite(Number(value))) return "—";
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: currency || "INR" }).format(Number(value) / 100);
  };
  return <div>
    <h1 className="font-display text-2xl font-semibold md:text-3xl">Payments &amp; transactions</h1>
    <p className="mt-1 text-sm text-fog">Read-only Razorpay subscription and webhook payment history. This page does not charge, refund, or change a subscription.</p>
    <h2 className="mt-7 font-display text-xl font-semibold">Transactions</h2>
    <div className="mt-3 overflow-x-auto rounded-2xl border border-line bg-panel">
      <table className="w-full min-w-[900px] text-sm">
        <thead><tr className="border-b border-line text-left text-[11px] uppercase tracking-widest text-fog"><th className="px-4 py-3">Date</th><th className="px-4 py-3">Member</th><th className="px-4 py-3">Status / event</th><th className="px-4 py-3">Amount</th><th className="px-4 py-3">Method</th><th className="px-4 py-3">Payment ID</th></tr></thead>
        <tbody>{transactions === null ? <tr><td colSpan={6} className="p-8 text-center text-fog">Loading transactions…</td></tr> : transactions.length ? transactions.map(item => <tr key={item.event_id} className="border-b border-line/60 last:border-0"><td className="whitespace-nowrap px-4 py-3 text-fog">{date(item.occurred_at)}</td><td className="px-4 py-3"><p>{item.name || "Member"}</p><p className="text-xs text-fog">{item.email || "Account unavailable"}</p></td><td className="px-4 py-3"><p>{item.status}</p><p className="text-xs text-fog">{item.event_type}</p></td><td className="px-4 py-3">{amount(item.amount, item.currency)}</td><td className="px-4 py-3 text-fog">{item.method || "—"}</td><td className="max-w-48 truncate px-4 py-3 font-mono text-xs text-fog" title={item.payment_id}>{item.payment_id}</td></tr>) : <tr><td colSpan={6} className="p-8 text-center text-fog">No payment webhook events recorded yet. New verified Razorpay events will appear here.</td></tr>}</tbody>
      </table>
    </div>
    <p className="mt-2 text-xs text-fog">Latest 1,000 payment events. Duplicate webhook deliveries are stored once. Historical provider events are not backfilled.</p>
    <h2 className="mt-8 font-display text-xl font-semibold">Subscriptions</h2>
    <div className="mt-6 overflow-x-auto rounded-2xl border border-line bg-panel">
      <table className="w-full min-w-[850px] text-sm">
        <thead><tr className="border-b border-line text-left text-[11px] uppercase tracking-widest text-fog"><th className="px-4 py-3">Member</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Subscription ID</th><th className="px-4 py-3">Latest payment ID</th><th className="px-4 py-3">Renewal / end</th><th className="px-4 py-3">Updated</th></tr></thead>
        <tbody>{items === null ? <tr><td colSpan={6} className="p-8 text-center text-fog">Loading payment records…</td></tr> : items.length ? items.map(item => <tr key={item.subscription_id} className="border-b border-line/60 last:border-0"><td className="px-4 py-3"><p>{item.name || "Member"}</p><p className="text-xs text-fog">{item.email || "Account unavailable"}</p></td><td className="px-4 py-3"><span className="rounded-full border border-line px-2.5 py-1 text-xs">{item.status}{Number(item.cancel_at_cycle_end) ? " · cancels at period end" : ""}</span></td><td className="max-w-52 truncate px-4 py-3 font-mono text-xs text-fog" title={item.subscription_id}>{item.subscription_id}</td><td className="max-w-52 truncate px-4 py-3 font-mono text-xs text-fog" title={item.payment_id || "No payment ID"}>{item.payment_id || "—"}</td><td className="px-4 py-3 text-fog">{date(item.current_end)}</td><td className="px-4 py-3 text-fog">{date(item.updated_at)}</td></tr>) : <tr><td colSpan={6} className="p-8 text-center text-fog">No subscription records yet.</td></tr>}</tbody>
      </table>
    </div>
    <p className="mt-3 text-xs text-fog">Latest 500 records. Payment provider remains the source of truth for settlements and refunds.</p>
  </div>;
}
