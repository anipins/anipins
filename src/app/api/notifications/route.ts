import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { row, rows, run } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ notifications: [], unread: 0, guest: true });
  const limit = Math.min(30, Math.max(1, parseInt(req.nextUrl.searchParams.get("limit") || "12", 10)));
  const onlyUnread = req.nextUrl.searchParams.get("unread") === "1";
  const notifications = await rows(
    `SELECT n.id, n.artwork_id, n.title, n.body, n.read_at, n.created_at, a.thumb
     FROM notifications n JOIN artworks a ON a.id=n.artwork_id
     WHERE n.user_id=? ${onlyUnread ? "AND n.read_at IS NULL" : ""} ORDER BY n.id DESC LIMIT ?`,
    user.id, limit,
  );
  const count = await row("SELECT COUNT(*) AS c FROM notifications WHERE user_id=? AND read_at IS NULL", user.id);
  return NextResponse.json({ notifications, unread: count?.c || 0 }, { headers: { "Cache-Control": "private, no-store" } });
}

export async function PATCH(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const { id, all } = await req.json();
  if (all) await run("UPDATE notifications SET read_at=CURRENT_TIMESTAMP WHERE user_id=? AND read_at IS NULL", user.id);
  else if (id) await run("UPDATE notifications SET read_at=CURRENT_TIMESTAMP WHERE id=? AND user_id=?", id, user.id);
  return NextResponse.json({ ok: true });
}
