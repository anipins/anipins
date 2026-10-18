"use client";
import { useEffect, useState } from "react";
import { getAdminJson } from "@/lib/admin-prefetch";

export default function AdminUsers() {
  const [users, setUsers] = useState<any[] | null>(null);
  const [busy, setBusy] = useState<number | null>(null);
  const [error, setError] = useState("");
  const load = () => getAdminJson("/api/admin/users", { cache: "no-store" }).then(d => setUsers(d.users || [])).catch(() => { setError("Could not load users."); setUsers([]); });
  useEffect(() => { load(); }, []);
  const changeRole = async (user: any, role: "USER" | "ADMIN") => {
    const action = role === "ADMIN" ? "give administrator access to" : "remove administrator access from";
    if (!confirm(`Are you sure you want to ${action} ${user.email}?`)) return;
    setBusy(user.id); setError("");
    try {
      const response = await fetch("/api/admin/users", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: user.id, role }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Access update failed.");
      await load();
    } catch (e: any) { setError(e.message || "Access update failed."); }
    finally { setBusy(null); }
  };
  return (
    <div>
      <h1 className="font-display text-2xl font-semibold md:text-3xl">Users</h1>
      <p className="mt-1 text-sm text-fog">Manage accounts and choose who has administrator access. Premium access follows the subscription status shown in Payments.</p>
      {error && <p role="alert" className="mt-4 rounded-xl border border-red-400/30 bg-red-400/10 p-3 text-sm text-red-200">{error}</p>}
      <div className="mt-6 overflow-x-auto rounded-2xl border border-line">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-line bg-panel text-left text-[11px] uppercase tracking-widest text-fog">
              <th className="px-4 py-3">User</th><th className="px-4 py-3">Access</th>
              <th className="px-4 py-3">Collections</th><th className="px-4 py-3">Saves</th>
              <th className="px-4 py-3">Likes</th><th className="px-4 py-3">Joined</th>
            </tr>
          </thead>
          <tbody>
            {users === null ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-fog">Loading…</td></tr>
            ) : users.map(u => (
              <tr key={u.id} className="border-b border-line/50 hover:bg-white/[0.02]">
                <td className="px-4 py-3">
                  <p className="font-medium">{u.name || "—"}</p>
                  <p className="text-xs text-fog">{u.email}</p>
                </td>
                <td className="px-4 py-3"><div className="flex items-center gap-2">{u.role === "ADMIN" ? <span className="badge-gold">Admin</span> : <span className="text-fog">Member</span>}{u.isCurrentAdmin ? <span className="text-xs text-fog">You</span> : <select aria-label={`Access for ${u.email}`} disabled={busy === u.id} value={u.role === "ADMIN" ? "ADMIN" : "USER"} onChange={event => changeRole(u, event.target.value as "USER" | "ADMIN")} className="rounded-lg border border-line bg-soft px-2 py-1 text-xs text-paper"><option value="USER">Member access</option><option value="ADMIN">Admin access</option></select>}</div></td>
                <td className="px-4 py-3 text-fog">{u.collections}</td>
                <td className="px-4 py-3 text-fog">{u.saves}</td>
                <td className="px-4 py-3 text-fog">{u.likes}</td>
                <td className="px-4 py-3 text-fog">{u.created_at?.slice(0, 10)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
