import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";
import { row, run, UPLOADS_DIR, slugify } from "@/lib/db";
import { USE_R2_MEDIA, USE_SUPABASE_STORAGE, sbPublicUrl } from "@/lib/media";
import { r2Get } from "@/lib/r2";
import { getUser } from "@/lib/auth";
import { recordActivity } from "@/lib/activity";
import { canAccessPremium } from "@/lib/billing";

export async function GET(_req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const id = parseInt(params.id);
  const user = await getUser();
  const art = await row("SELECT * FROM artworks WHERE id=?", id);
  if (!art) return new NextResponse("Not found", { status: 404 });
  if (Number(art.premium || 0) === 1 && (!user || !(await canAccessPremium(user)))) return new NextResponse("Premium membership required", { status: 403 });
  await run("UPDATE artworks SET downloads = downloads + 1 WHERE id=?", id);
  // Public downloads are counted for artwork analytics. Personal history is
  // recorded only for visitors who have chosen to sign in.
  if (user) await recordActivity(user.id, id, "download", 1);
  const name = `anipins-${slugify(art.character_name)}-${id}${path.extname(art.orig) || ".jpg"}`;
  const extension = path.extname(art.orig).toLowerCase();
  const contentType = extension === ".png" ? "image/png" : extension === ".webp" ? "image/webp" : extension === ".gif" ? "image/gif" : "image/jpeg";

  if (USE_R2_MEDIA) {
    try {
      const source = await r2Get(art.orig, Number(art.premium || 0) === 1);
      if (!source.Body) return new NextResponse("File missing", { status: 404 });
      return new NextResponse(source.Body.transformToWebStream(), {
        headers: { "Content-Type": source.ContentType || contentType, "Content-Disposition": `attachment; filename="${name}"`, "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" },
      });
    } catch (error: any) {
      return new NextResponse("File missing", { status: error?.$metadata?.httpStatusCode === 404 ? 404 : 502 });
    }
  }
  if (USE_SUPABASE_STORAGE) {
    const r = await fetch(sbPublicUrl(art.orig));
    if (!r.ok) return new NextResponse("File missing", { status: 404 });
    const buf = Buffer.from(await r.arrayBuffer());
    return new NextResponse(buf, {
      headers: { "Content-Type": contentType, "Content-Length": String(buf.length), "Content-Disposition": `attachment; filename="${name}"`, "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" },
    });
  }
  const file = path.join(UPLOADS_DIR, art.orig);
  if (!fs.existsSync(file)) return new NextResponse("File missing", { status: 404 });
  return new NextResponse(fs.readFileSync(file), {
    headers: { "Content-Type": contentType, "Content-Disposition": `attachment; filename="${name}"`, "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" },
  });
}
