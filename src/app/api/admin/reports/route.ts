import { NextRequest, NextResponse } from "next/server";
import { rows, row, run } from "@/lib/db";
import { getUser, isAdmin } from "@/lib/auth";
import { audit, requestInfo } from "@/lib/admin-security";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const user = await getUser();
  if (!isAdmin(user)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const status = (req.nextUrl.searchParams.get("status") || "all").toUpperCase();
  if (status !== "ALL" && !["OPEN", "RESOLVED", "REJECTED"].includes(status)) return NextResponse.json({ error: "Invalid report status." }, { status: 400 });
  const reports = await rows(
    `SELECT r.id, r.user_id, r.artwork_id, r.reason, r.details, r.status, r.created_at,
      u.email AS reporter_email, u.name AS reporter_name,
      a.title AS artwork_title, a.character_name, a.anime_name
     FROM content_reports r LEFT JOIN users u ON u.id=r.user_id
     JOIN artworks a ON a.id=r.artwork_id
     ${status === "ALL" ? "" : "WHERE upper(r.status)=?"}
     ORDER BY r.id DESC LIMIT 300`,
    ...(status === "ALL" ? [] : [status]),
  );
  return NextResponse.json({ reports }, { headers: { "Cache-Control": "private, no-store" } });
}

export async function PATCH(req: NextRequest) {
  const user = await getUser();
  if (!isAdmin(user)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }
  const id = Number(body?.id);
  const status = String(body?.status || "").toUpperCase();
  if (!Number.isSafeInteger(id) || id < 1 || !["OPEN", "RESOLVED", "REJECTED"].includes(status)) return NextResponse.json({ error: "Choose a valid report and status." }, { status: 400 });
  const report = await row("SELECT id,status FROM content_reports WHERE id=?", id);
  if (!report) return NextResponse.json({ error: "Report not found." }, { status: 404 });
  await run("UPDATE content_reports SET status=? WHERE id=?", status, id);
  await audit(Number(user.id), "REPORT_STATUS_CHANGED", "report", String(id), `${report.status} → ${status}`, requestInfo(req).ip);
  return NextResponse.json({ ok: true, status });
}
