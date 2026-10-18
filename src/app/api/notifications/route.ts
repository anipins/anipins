import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { row, rows, run } from "@/lib/db";
import { ensureAdminAnnouncementSchema } from "@/lib/admin-announcements";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ notifications: [], unread: 0, guest: true });
  await ensureAdminAnnouncementSchema();
  const limit = Math.min(30, Math.max(1, parseInt(req.nextUrl.searchParams.get("limit") || "12", 10)));
  const onlyUnread = req.nextUrl.searchParams.get("unread") === "1";
  const notifications = await rows(
    `SELECT * FROM (
       SELECT 'n:' || n.id AS id, n.artwork_id, n.title, n.body, n.read_at, n.created_at, a.thumb, 'artwork' AS kind
       FROM notifications n JOIN artworks a ON a.id=n.artwork_id
       WHERE n.user_id=? ${onlyUnread ? "AND n.read_at IS NULL" : ""}
       UNION ALL
       SELECT 'a:' || a.id AS id, a.artwork_id, a.title, a.body, r.read_at, a.created_at, w.thumb, 'announcement' AS kind
       FROM admin_announcement_recipients r JOIN admin_announcements a ON a.id=r.announcement_id
       LEFT JOIN artworks w ON w.id=a.artwork_id
       WHERE r.user_id=? ${onlyUnread ? "AND r.read_at IS NULL" : ""}
     ) feed ORDER BY created_at DESC LIMIT ?`,
    user.id, user.id, limit,
  );
  const [legacyCount, announcementCount] = await Promise.all([
    row("SELECT COUNT(*) AS c FROM notifications WHERE user_id=? AND read_at IS NULL", user.id),
    row("SELECT COUNT(*) AS c FROM admin_announcement_recipients WHERE user_id=? AND read_at IS NULL", user.id),
  ]);
  return NextResponse.json({ notifications, unread: Number(legacyCount?.c || 0) + Number(announcementCount?.c || 0) }, { headers: { "Cache-Control": "private, no-store" } });
}

export async function PATCH(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  await ensureAdminAnnouncementSchema();
  const { id, all } = await req.json();
  if (all) {
    await run("UPDATE notifications SET read_at=CURRENT_TIMESTAMP WHERE user_id=? AND read_at IS NULL", user.id);
    await run("UPDATE admin_announcement_recipients SET read_at=CURRENT_TIMESTAMP WHERE user_id=? AND read_at IS NULL", user.id);
  } else if (typeof id === "string" && id.startsWith("a:")) {
    const announcementId = Number(id.slice(2));
    if (Number.isSafeInteger(announcementId) && announcementId > 0) await run("UPDATE admin_announcement_recipients SET read_at=CURRENT_TIMESTAMP WHERE announcement_id=? AND user_id=?", announcementId, user.id);
  } else if (typeof id === "string" && id.startsWith("n:")) {
    const notificationId = Number(id.slice(2));
    if (Number.isSafeInteger(notificationId) && notificationId > 0) await run("UPDATE notifications SET read_at=CURRENT_TIMESTAMP WHERE id=? AND user_id=?", notificationId, user.id);
  }
  return NextResponse.json({ ok: true });
}
