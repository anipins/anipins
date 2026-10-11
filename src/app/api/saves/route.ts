import { NextRequest, NextResponse } from "next/server";
import { row, run } from "@/lib/db";
import { getUser } from "@/lib/auth";
import { canAccessPremium } from "@/lib/billing";
import { recordActivity } from "@/lib/activity";
import { positiveId } from "@/lib/input-validation";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const u = await getUser();
  if (!u) return NextResponse.json({ error: "Sign in to save artwork." }, { status: 401 });

  const payload = await req.json().catch(() => null);
  const artworkId = positiveId(payload?.artworkId);
  if (!artworkId) return NextResponse.json({ error: "Invalid artwork." }, { status: 400 });

  const collectionId = payload?.collectionId;
  const cid = collectionId == null ? null : positiveId(collectionId);
  if (collectionId != null && !cid) return NextResponse.json({ error: "Invalid collection." }, { status: 400 });

  if (payload?.remove) {
    if (cid) await run("DELETE FROM saves WHERE user_id=? AND artwork_id=? AND collection_id=?", u.id, artworkId, cid);
    else await run("DELETE FROM saves WHERE user_id=? AND artwork_id=?", u.id, artworkId);
    return NextResponse.json({ ok: true, saved: false });
  }

  // Only published, authorised artwork may enter a user's collection.
  const art = await row("SELECT id, COALESCE(premium, 0) AS premium FROM artworks WHERE id=? AND published=1", artworkId);
  if (!art) return NextResponse.json({ error: "Artwork not found." }, { status: 404 });
  if (Number(art.premium || 0) === 1 && !(await canAccessPremium(u))) {
    return NextResponse.json({ error: "Premium membership required." }, { status: 403 });
  }

  let targetCollectionId = cid;
  if (targetCollectionId) {
    // A caller must not write saves into another account's collection.
    const owned = await row("SELECT id FROM collections WHERE id=? AND user_id=?", targetCollectionId, u.id);
    if (!owned) return NextResponse.json({ error: "Collection not found." }, { status: 404 });
  } else {
    let def = await row("SELECT id FROM collections WHERE user_id=? AND name='Saved'", u.id);
    if (!def) {
      await run("INSERT INTO collections (user_id,name) VALUES (?,'Saved')", u.id);
      def = await row("SELECT id FROM collections WHERE user_id=? AND name='Saved'", u.id);
    }
    targetCollectionId = def.id;
  }

  const exists = await row("SELECT id FROM saves WHERE user_id=? AND collection_id=? AND artwork_id=?", u.id, targetCollectionId, artworkId);
  if (!exists) {
    await run("INSERT INTO saves (user_id, collection_id, artwork_id) VALUES (?,?,?)", u.id, targetCollectionId, artworkId);
    await recordActivity(u.id, artworkId, "save", 2);
  }
  return NextResponse.json({ ok: true, saved: true });
}
