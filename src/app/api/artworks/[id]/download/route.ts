import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";
import { row, run, UPLOADS_DIR, slugify } from "@/lib/db";
import { USE_R2_MEDIA } from "@/lib/media";
import { r2SignedDownloadUrl } from "@/lib/r2";
import { getUser } from "@/lib/auth";
import { recordActivity } from "@/lib/activity";
import { canAccessPremium } from "@/lib/billing";
import { positiveId } from "@/lib/input-validation";
import { mayDownloadArtwork } from "@/lib/artwork-access";

export async function GET(_req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const id = positiveId(params.id);
  if (!id) return new NextResponse("Not found", { status: 404 });
  const user = await getUser();
  const art = await row("SELECT * FROM artworks WHERE id=?", id);
  if (!mayDownloadArtwork(art, user)) return new NextResponse("Not found", { status: 404 });
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
      const location = await r2SignedDownloadUrl(art.orig, Number(art.premium || 0) === 1, name, contentType);
      return NextResponse.redirect(location, { status: 302, headers: { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } });
    } catch (error: any) {
      return new NextResponse("Download could not start", { status: error?.$metadata?.httpStatusCode === 404 ? 404 : 502 });
    }
  }
  const file = path.join(UPLOADS_DIR, art.orig);
  if (!fs.existsSync(file)) return new NextResponse("File missing", { status: 404 });
  return new NextResponse(fs.readFileSync(file), {
    headers: { "Content-Type": contentType, "Content-Disposition": `attachment; filename="${name}"`, "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" },
  });
}
