import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";
import { row, run, UPLOADS_DIR, slugify } from "@/lib/db";
import { USE_SUPABASE_STORAGE, sbPublicUrl } from "@/lib/media";
import { getUser } from "@/lib/auth";
import { recordActivity } from "@/lib/activity";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const id = parseInt(params.id);
  const art = await row("SELECT * FROM artworks WHERE id=?", id);
  if (!art) return new NextResponse("Not found", { status: 404 });
  await run("UPDATE artworks SET downloads = downloads + 1 WHERE id=?", id);
  const user = await getUser();
  if (user) await recordActivity(user.id, id, "download", 2);
  const name = `anipins-${slugify(art.character_name)}-${id}${path.extname(art.orig) || ".jpg"}`;

  if (USE_SUPABASE_STORAGE) {
    const r = await fetch(sbPublicUrl(art.orig));
    if (!r.ok) return new NextResponse("File missing", { status: 404 });
    const buf = Buffer.from(await r.arrayBuffer());
    return new NextResponse(buf, {
      headers: { "Content-Type": "application/octet-stream", "Content-Disposition": `attachment; filename="${name}"` },
    });
  }
  const file = path.join(UPLOADS_DIR, art.orig);
  if (!fs.existsSync(file)) return new NextResponse("File missing", { status: 404 });
  return new NextResponse(fs.readFileSync(file), {
    headers: { "Content-Type": "application/octet-stream", "Content-Disposition": `attachment; filename="${name}"` },
  });
}
