import { NextRequest, NextResponse } from "next/server";
import { row, rows, run } from "@/lib/db";
import { getUser, isAdmin } from "@/lib/auth";
import { audit, requestInfo } from "@/lib/admin-security";
import { ensureAdminAnnouncementSchema } from "@/lib/admin-announcements";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getUser();
  if (!isAdmin(user)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  await ensureAdminAnnouncementSchema();
  const [announcements, users, artworks] = await Promise.all([
    rows(`SELECT n.id, n.title, n.body, n.artwork_id, n.created_at, u.email AS creator_email,
      COUNT(r.user_id) AS recipient_count
      FROM admin_announcements n JOIN users u ON u.id=n.created_by
      LEFT JOIN admin_announcement_recipients r ON r.announcement_id=n.id
      GROUP BY n.id,u.email ORDER BY n.id DESC LIMIT 50`),
    rows("SELECT id,email,name FROM users ORDER BY email LIMIT 500"),
    rows("SELECT id,title,character_name,anime_name FROM artworks WHERE published=1 AND COALESCE(premium,0)=0 ORDER BY id DESC LIMIT 500"),
  ]);
  return NextResponse.json({ announcements, users, artworks }, { headers: { "Cache-Control": "private, no-store" } });
}

export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!isAdmin(user)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  await ensureAdminAnnouncementSchema();
  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }
  const title = String(body?.title || "").trim();
  const message = String(body?.body || "").trim();
  const audience = body?.audience;
  const artworkId = body?.artworkId ? Number(body.artworkId) : null;
  if (!title || title.length > 120 || message.length > 500) return NextResponse.json({ error: "Add a title (up to 120 characters) and a message (up to 500 characters)." }, { status: 400 });
  if (artworkId !== null && (!Number.isSafeInteger(artworkId) || artworkId < 1 || !(await row("SELECT id FROM artworks WHERE id=? AND published=1 AND COALESCE(premium,0)=0", artworkId)))) {
    return NextResponse.json({ error: "Choose a published public artwork, or leave the artwork unset." }, { status: 400 });
  }
  let recipientSql = "SELECT id FROM users";
  let recipientArgs: number[] = [];
  if (audience !== "all") {
    const rawIds = Array.isArray(body?.userIds) ? body.userIds : [];
    const ids: number[] = Array.from(new Set<number>((rawIds as unknown[]).map(Number).filter((id: number) => Number.isSafeInteger(id) && id > 0)));
    if (!ids.length || ids.length > 500 || ids.length !== rawIds.length) return NextResponse.json({ error: "Choose between 1 and 500 valid member accounts." }, { status: 400 });
    recipientSql = `SELECT id FROM users WHERE id IN (${ids.map(() => "?").join(",")})`;
    recipientArgs = ids;
  }
  const recipients = await rows(recipientSql, ...recipientArgs);
  if (!recipients.length || recipients.length !== (audience === "all" ? recipients.length : recipientArgs.length)) return NextResponse.json({ error: "One or more selected members no longer exist." }, { status: 400 });
  const inserted = await rows("INSERT INTO admin_announcements (title,body,artwork_id,created_by) VALUES (?,?,?,?) RETURNING id", title, message, artworkId, Number(user.id));
  const announcementId = Number(inserted[0]?.id);
  if (!Number.isSafeInteger(announcementId) || announcementId < 1) throw new Error("Notification announcement could not be created.");
  if (audience === "all") {
    await run("INSERT INTO admin_announcement_recipients (announcement_id,user_id) SELECT ?,id FROM users", announcementId);
  } else {
    await run(`INSERT INTO admin_announcement_recipients (announcement_id,user_id) SELECT ?,id FROM users WHERE id IN (${recipientArgs.map(() => "?").join(",")})`, announcementId, ...recipientArgs);
  }
  await audit(Number(user.id), "ANNOUNCEMENT_SENT", "announcement", String(announcementId), `${recipients.length} recipients`, requestInfo(req).ip);
  return NextResponse.json({ ok: true, id: announcementId, recipientCount: recipients.length });
}
