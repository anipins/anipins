import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";
import { UPLOADS_DIR } from "@/lib/db";
import { USE_SUPABASE_STORAGE, sbPublicUrl } from "@/lib/media";

const TYPES: Record<string, string> = { ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp", ".gif": "image/gif" };

export async function GET(_req: NextRequest, { params }: { params: { p: string[] } }) {
  const rel = params.p.join("/");
  if (USE_SUPABASE_STORAGE) {
    return NextResponse.redirect(sbPublicUrl(rel), { status: 307 });
  }
  const file = path.normalize(path.join(UPLOADS_DIR, rel));
  if (!file.startsWith(UPLOADS_DIR) || !fs.existsSync(file)) {
    return new NextResponse("Not found", { status: 404 });
  }
  const buf = fs.readFileSync(file);
  const type = TYPES[path.extname(file).toLowerCase()] || "application/octet-stream";
  return new NextResponse(buf, {
    headers: { "Content-Type": type, "Cache-Control": "public, max-age=31536000, immutable" },
  });
}
