import { NextRequest, NextResponse } from "next/server";
import { row, run } from "@/lib/db";
import { getUser } from "@/lib/auth";
import { recordActivity } from "@/lib/activity";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const u = await getUser();
  if (!u) return NextResponse.json({ error: "Sign in to like artwork." }, { status: 401 });
  const { artworkId } = await req.json();
  const has = await row("SELECT id FROM likes WHERE user_id=? AND artwork_id=?", u.id, artworkId);
  if (has) await run("DELETE FROM likes WHERE user_id=? AND artwork_id=?", u.id, artworkId);
  else {
    await run("INSERT INTO likes (user_id, artwork_id) VALUES (?,?)", u.id, artworkId);
    await recordActivity(u.id, artworkId, "like", 2);
  }
  const c = await row("SELECT COUNT(*) AS c FROM likes WHERE artwork_id=?", artworkId);
  return NextResponse.json({ ok: true, liked: !has, count: c?.c ?? 0 });
}
