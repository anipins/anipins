"use client";
import { useCallback, useEffect, useState } from "react";
import { getAdminJson } from "@/lib/admin-prefetch";

export default function AdminNotifications() {
  const [data, setData] = useState<any>(null);
  const [audience, setAudience] = useState("all");
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [artworkId, setArtworkId] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const load = useCallback(() => getAdminJson("/api/admin/notifications", { cache: "no-store" }).then(setData).catch(() => setError("Could not load notification data.")), []);
  useEffect(() => { load(); }, [load]);
  const send = async (event: React.FormEvent) => {
    event.preventDefault(); setMessage(""); setError("");
    if (audience === "selected" && selectedUsers.length === 0) { setError("Select at least one member."); return; }
    const count = audience === "all" ? data.users.length : selectedUsers.length;
    if (!confirm(`Send this in-app notification to ${count} member${count === 1 ? "" : "s"}?`)) return;
    setBusy(true);
    try {
      const response = await fetch("/api/admin/notifications", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title, body, audience, userIds: selectedUsers, artworkId: artworkId || null }) });
      const result = await response.json(); if (!response.ok) throw new Error(result.error || "Could not send notification.");
      setMessage(`Sent to ${result.recipientCount} member${result.recipientCount === 1 ? "" : "s"}.`); setTitle(""); setBody(""); setArtworkId(""); setSelectedUsers([]); await load();
    } catch (e: any) { setError(e.message || "Could not send notification."); }
    finally { setBusy(false); }
  };
  return <div className="max-w-4xl space-y-7">
    <div><h1 className="font-display text-2xl font-semibold md:text-3xl">Send notifications</h1><p className="mt-1 text-sm text-fog">Send an in-app announcement to all members or selected accounts. This does not send email or push notifications.</p></div>
    {error && <p role="alert" className="rounded-xl border border-red-400/30 bg-red-400/10 p-3 text-sm text-red-200">{error}</p>}{message && <p role="status" className="rounded-xl border border-emerald-400/30 bg-emerald-400/10 p-3 text-sm text-emerald-200">{message}</p>}
    <form onSubmit={send} className="space-y-5 rounded-2xl border border-line bg-panel p-5 md:p-7">
      <label className="block text-sm">Title <input required maxLength={120} value={title} onChange={event => setTitle(event.target.value)} className="mt-2 w-full rounded-xl border border-line bg-soft px-4 py-3 text-paper" placeholder="New artwork is here" /></label>
      <label className="block text-sm">Message <textarea maxLength={500} rows={3} value={body} onChange={event => setBody(event.target.value)} className="mt-2 w-full resize-y rounded-xl border border-line bg-soft px-4 py-3 text-paper" placeholder="A short message for your members" /></label>
      <label className="block text-sm">Link to public artwork (optional)<select value={artworkId} onChange={event => setArtworkId(event.target.value)} className="mt-2 w-full rounded-xl border border-line bg-soft px-4 py-3 text-paper"><option value="">No artwork link</option>{(data?.artworks || []).map((art: any) => <option key={art.id} value={art.id}>#{art.id} · {art.title || art.character_name} — {art.anime_name}</option>)}</select></label>
      <label className="block text-sm">Audience<select value={audience} onChange={event => setAudience(event.target.value)} className="mt-2 w-full rounded-xl border border-line bg-soft px-4 py-3 text-paper"><option value="all">All members ({data?.users?.length || 0})</option><option value="selected">Selected members</option></select></label>
      {audience === "selected" && <fieldset className="max-h-56 space-y-2 overflow-y-auto rounded-xl border border-line p-4"><legend className="px-2 text-xs text-fog">Choose recipients</legend>{(data?.users || []).map((member: any) => <label key={member.id} className="flex items-center gap-3 text-sm"><input type="checkbox" checked={selectedUsers.includes(member.id)} onChange={event => setSelectedUsers(current => event.target.checked ? [...current, member.id] : current.filter(id => id !== member.id))} /><span>{member.name || "Member"} <span className="text-fog">{member.email}</span></span></label>)}</fieldset>}
      <button disabled={busy || !data} className="btn-primary !px-5 !py-3">{busy ? "Sending…" : "Send in-app notification"}</button>
    </form>
    <section><h2 className="font-display text-xl font-semibold">Recent announcements</h2><div className="mt-3 space-y-2">{data?.announcements?.length ? data.announcements.map((item: any) => <article key={item.id} className="rounded-xl border border-line bg-panel p-4"><div className="flex flex-wrap justify-between gap-2"><strong>{item.title}</strong><span className="text-xs text-fog">{item.recipient_count} recipients · {item.created_at}</span></div>{item.body && <p className="mt-1 text-sm text-fog">{item.body}</p>}</article>) : <p className="rounded-xl border border-line p-5 text-sm text-fog">No announcements sent yet.</p>}</div></section>
  </div>;
}
