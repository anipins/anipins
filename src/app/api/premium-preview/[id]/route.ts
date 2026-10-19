import { NextResponse } from "next/server";
import path from "path";
import fs from "fs";
import sharp from "sharp";
import { row, UPLOADS_DIR } from "@/lib/db";
import { isSafeMediaKey, USE_R2_MEDIA } from "@/lib/media";
import { r2Get } from "@/lib/r2";

export const runtime = "nodejs";

/** Only an aggressively blurred derivative is public; originals stay Premium. */
export async function GET(_req: Request, props: { params: Promise<{ id: string }> }) {
  const { id: rawId } = await props.params;
  const id = Number(rawId);
  if (!Number.isInteger(id) || id < 1) return new NextResponse("Not found", { status: 404 });
  const artwork = await row("SELECT thumb FROM artworks WHERE id=? AND published=1 AND COALESCE(premium, 0)=1", id);
  const key = String(artwork?.thumb || "");
  if (!isSafeMediaKey(key)) return new NextResponse("Not found", { status: 404 });
  let source: Buffer;
  if (USE_R2_MEDIA) {
    try {
      const object = await r2Get(key, true);
      if (!object.Body) return new NextResponse("Not found", { status: 404 });
      source = Buffer.from(await object.Body.transformToByteArray());
    } catch (error: any) {
      const status = error?.$metadata?.httpStatusCode === 404 || error?.name === "NoSuchKey" ? 404 : 502;
      return new NextResponse(status === 404 ? "Not found" : "Preview temporarily unavailable", { status });
    }
  } else {
    const file = path.normalize(path.join(UPLOADS_DIR, key));
    if (!file.startsWith(UPLOADS_DIR) || !fs.existsSync(file)) return new NextResponse("Not found", { status: 404 });
    source = fs.readFileSync(file);
  }
  const preview = await sharp(source).rotate().resize({ width: 56, withoutEnlargement: true }).blur(15).resize({ width: 560, withoutEnlargement: false }).webp({ quality: 38, effort: 3 }).toBuffer();
  return new NextResponse(new Uint8Array(preview), { headers: { "Content-Type": "image/webp", "Cache-Control": "public, max-age=3600, s-maxage=3600" } });
}
