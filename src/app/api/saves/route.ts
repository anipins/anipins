import { NextRequest, NextResponse } from "next/server";
import { row, run } from "@/lib/db";
import { getUser } from "@/lib/auth";
import { recordActivity } from "@/lib/activity";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const u = await getUser();
  if (!u) return NextResponse.json({ error: "Sign in to save artwork." }, { status: 401 });
  const { artworkId, collectionId, remove } = await req.json();
  if (remove) {
    if (collectionId) await run("DELETE FROM saves WHERE user_id=? AND artwork_id=? AND collection_id=?", u.id, artworkId, collectionId);
    else await run("DELETE FROM saves WHERE user_id=? AND artwork_id=?", u.id, artworkId);
    return NextResponse.json({ ok: true, saved: false });
  }
  let cid = collectionId;
  if (!cid) {
    let def = await row("SELECT id FROM collections WHERE user_id=? AND name='Saved'", u.id);
    if (!def) {
      await run("INSERT INTO collections (user_id,name) VALUES (?,'Saved')", u.id);
      def = await row("SELECT id FROM collections WHERE user_id=? AND name='Saved'", u.id);
    }
    cid = def.id;
  }
  const exists = await row("SELECT id FROM saves WHERE collection_id=? AND artwork_id=?", cid, artworkId);
  if (!exists) {
    await run("INSERT INTO saves (user_id, collection_id, artwork_id) VALUES (?,?,?)", u.id, cid, artworkId);
    await recordActivity(u.id, artworkId, "save", 2);
  }
  return NextResponse.json({ ok: true, saved: true });
}
