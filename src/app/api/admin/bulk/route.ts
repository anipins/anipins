import { NextRequest, NextResponse } from "next/server";
import { rows, run } from "@/lib/db";
import { getUser, isAdmin } from "@/lib/auth";
import { deleteFiles } from "@/lib/media";

export async function POST(req: NextRequest) {
  const u = await getUser();
  if (!isAdmin(u)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { action, ids } = await req.json();
  if (!Array.isArray(ids) || !ids.length) return NextResponse.json({ error: "No items selected" }, { status: 400 });
  const list = ids.map(() => "?").join(",");
  if (action === "delete") {
    const arts = await rows(`SELECT * FROM artworks WHERE id IN (${list})`, ...ids);
    for (const a of arts) await deleteFiles(a.orig, a.thumb);
    await run(`DELETE FROM saves WHERE artwork_id IN (${list})`, ...ids);
    await run(`DELETE FROM likes WHERE artwork_id IN (${list})`, ...ids);
    await run(`DELETE FROM artworks WHERE id IN (${list})`, ...ids);
  } else if (action === "publish") await run(`UPDATE artworks SET published=1 WHERE id IN (${list})`, ...ids);
  else if (action === "unpublish") await run(`UPDATE artworks SET published=0 WHERE id IN (${list})`, ...ids);
  else if (action === "feature") await run(`UPDATE artworks SET featured=1 WHERE id IN (${list})`, ...ids);
  else if (action === "unfeature") await run(`UPDATE artworks SET featured=0 WHERE id IN (${list})`, ...ids);
  else return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  return NextResponse.json({ ok: true });
}
