"use client";
import { useCallback, useEffect, useState } from "react";
import { getAdminJson } from "@/lib/admin-prefetch";

export default function AdminReports() {
  const [status, setStatus] = useState("OPEN");
  const [reports, setReports] = useState<any[] | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<number | null>(null);
  const load = useCallback(() => getAdminJson(`/api/admin/reports?status=${status}`, { cache: "no-store" }).then(data => setReports(data.reports || [])).catch(() => { setError("Could not load reports."); setReports([]); }), [status]);
  useEffect(() => { setReports(null); load(); }, [load]);
  const setReportStatus = async (id: number, nextStatus: string) => {
    setBusy(id); setError("");
    try {
      const response = await fetch("/api/admin/reports", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status: nextStatus }) });
      const result = await response.json(); if (!response.ok) throw new Error(result.error || "Could not update report.");
      await load();
    } catch (e: any) { setError(e.message || "Could not update report."); }
    finally { setBusy(null); }
  };
  return <div>
    <h1 className="font-display text-2xl font-semibold md:text-3xl">Content reports</h1>
    <p className="mt-1 text-sm text-fog">Review reports submitted by AniPins members and record the outcome.</p>
    {error && <p role="alert" className="mt-4 rounded-xl border border-red-400/30 bg-red-400/10 p-3 text-sm text-red-200">{error}</p>}
    <div className="mt-5 flex gap-2">{["OPEN", "RESOLVED", "REJECTED", "ALL"].map(value => <button key={value} onClick={() => setStatus(value)} className={`chip ${status === value ? "chip-on" : ""}`}>{value === "ALL" ? "All" : value[0] + value.slice(1).toLowerCase()}</button>)}</div>
    <div className="mt-5 space-y-3">{reports === null ? <p className="p-6 text-fog">Loading reports…</p> : reports.length ? reports.map(report => <article key={report.id} className="rounded-2xl border border-line bg-panel p-5">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-medium text-paper">{report.artwork_title || report.character_name} <span className="text-fog">· {report.anime_name}</span></p><p className="mt-1 text-xs text-fog">Report #{report.id} · {report.reason} · {report.reporter_email || "Guest report"} · {report.created_at}</p></div><span className="rounded-full border border-line px-3 py-1 text-xs text-fog">{report.status}</span></div>
      {report.details && <p className="mt-3 whitespace-pre-wrap text-sm text-fog">{report.details}</p>}
      <div className="mt-4 flex gap-2">{report.status !== "RESOLVED" && <button disabled={busy === report.id} onClick={() => setReportStatus(report.id, "RESOLVED")} className="btn-primary !px-4 !py-2 text-xs">Resolve</button>}{report.status !== "REJECTED" && <button disabled={busy === report.id} onClick={() => setReportStatus(report.id, "REJECTED")} className="btn-ghost !px-4 !py-2 text-xs">Reject</button>}{report.status !== "OPEN" && <button disabled={busy === report.id} onClick={() => setReportStatus(report.id, "OPEN")} className="btn-ghost !px-4 !py-2 text-xs">Reopen</button>}</div>
    </article>) : <p className="rounded-2xl border border-line p-8 text-center text-sm text-fog">No reports in this view.</p>}</div>
  </div>;
}
