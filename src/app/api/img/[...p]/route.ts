import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";
import { row, UPLOADS_DIR } from "@/lib/db";
import { USE_R2_MEDIA, USE_SUPABASE_STORAGE, isSafeMediaKey, sbPublicUrl } from "@/lib/media";
import { r2Get } from "@/lib/r2";
import { getUser } from "@/lib/auth";
import { canAccessPremium } from "@/lib/billing";
import sharp from "sharp";

export const runtime = "nodejs";

const TYPES: Record<string, string> = { ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp", ".gif": "image/gif" };

export async function GET(_req: NextRequest, props: { params: Promise<{ p: string[] }> }) {
  const params = await props.params;
  const rel = params.p.join("/");
  if (!isSafeMediaKey(rel)) return new NextResponse("Not found", { status: 404 });
  const artwork = await row("SELECT premium FROM artworks WHERE orig=? OR thumb=? LIMIT 1", rel, rel);
  const premium = Number(artwork?.premium || 0) === 1;
  if (premium) {
    const user = await getUser();
    if (!user || !(await canAccessPremium(user))) return new NextResponse("Not found", { status: 404 });
  }
  const cacheControl = premium
    ? "private, no-store"
    : "public, max-age=31536000, s-maxage=31536000, stale-while-revalidate=86400, immutable";
  if (USE_R2_MEDIA) {
    try {
      const source = await r2Get(rel, premium);
      if (!source.Body) return new NextResponse("Not found", { status: 404 });
      if (rel.startsWith("t/") && !rel.toLowerCase().endsWith(".webp")) {
        const optimized = await sharp(Buffer.from(await source.Body.transformToByteArray()))
          .rotate().resize({ width: 480, withoutEnlargement: true, fastShrinkOnLoad: true }).webp({ quality: 66, effort: 3 }).toBuffer();
        return new NextResponse(new Uint8Array(optimized), { headers: { "Content-Type": "image/webp", "Cache-Control": cacheControl, "CDN-Cache-Control": premium ? "private, no-store" : "public, max-age=31536000, immutable" } });
      }
      return new NextResponse(source.Body.transformToWebStream(), { headers: {
        "Content-Type": source.ContentType || TYPES[path.extname(rel).toLowerCase()] || "application/octet-stream",
        "Cache-Control": cacheControl,
        "CDN-Cache-Control": premium ? "private, no-store" : "public, max-age=31536000, immutable",
      } });
    } catch (error: any) {
      const status = error?.$metadata?.httpStatusCode === 404 || error?.name === "NoSuchKey" ? 404 : 502;
      return new NextResponse(status === 404 ? "Not found" : "Media temporarily unavailable", { status });
    }
  }
  if (USE_SUPABASE_STORAGE) {
    const source = await fetch(sbPublicUrl(rel), { next: { revalidate: 31536000 } });
    if (!source.ok || !source.body) return new NextResponse("Not found", { status: source.status === 404 ? 404 : 502 });
    if (rel.startsWith("t/") && !rel.toLowerCase().endsWith(".webp")) {
      const optimized = await sharp(Buffer.from(await source.arrayBuffer()))
        .rotate()
        .resize({ width: 480, withoutEnlargement: true, fastShrinkOnLoad: true })
        .webp({ quality: 66, effort: 3 })
        .toBuffer();
      return new NextResponse(new Uint8Array(optimized), { headers: {
        "Content-Type": "image/webp",
        "Cache-Control": cacheControl,
        "CDN-Cache-Control": premium ? "private, no-store" : "public, max-age=31536000, immutable",
      } });
    }
    return new NextResponse(source.body, { headers: {
      "Content-Type": source.headers.get("content-type") || TYPES[path.extname(rel).toLowerCase()] || "application/octet-stream",
      "Cache-Control": cacheControl,
      "CDN-Cache-Control": premium ? "private, no-store" : "public, max-age=31536000, immutable",
    } });
  }
  const file = path.normalize(path.join(UPLOADS_DIR, rel));
  if (!file.startsWith(UPLOADS_DIR) || !fs.existsSync(file)) {
    return new NextResponse("Not found", { status: 404 });
  }
  const buf = fs.readFileSync(file);
  const type = TYPES[path.extname(file).toLowerCase()] || "application/octet-stream";
  return new NextResponse(buf, {
    headers: { "Content-Type": type, "Cache-Control": premium ? "private, no-store" : "public, max-age=31536000, immutable" },
  });
}
