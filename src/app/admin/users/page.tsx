"use client";
import { useEffect, useState } from "react";

export default function AdminUsers() {
  const [users, setUsers] = useState<any[] | null>(null);
  useEffect(() => { fetch("/api/admin/users").then(r => r.json()).then(d => setUsers(d.users || [])); }, []);
  return (
    <div>
      <h1 className="font-display text-2xl font-semibold md:text-3xl">Users</h1>
      <p className="mt-1 text-sm text-fog">All registered AniPins accounts.</p>
      <div className="mt-6 overflow-x-auto rounded-2xl border border-line">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-line bg-panel text-left text-[11px] uppercase tracking-widest text-fog">
              <th className="px-4 py-3">User</th><th className="px-4 py-3">Role</th>
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
                <td className="px-4 py-3">{u.role === "ADMIN" ? <span className="badge-gold">Super Admin</span> : <span className="text-fog">User</span>}</td>
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
