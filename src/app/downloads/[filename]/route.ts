import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const APK_NAMES = new Set(["AniPins.apk", "AniPins-2.3.2.apk", "AniPins-2.3.3.apk", "AniPins-2.4.0.apk", "AniPins-2.4.1.apk", "AniPins-2.4.2.apk", "AniPins-2.5.11.apk", "AniPins-2.5.12.apk", "AniPins-2.5.13.apk", "AniPins-2.5.14.apk", "AniPins-2.5.15.apk", "AniPins-2.5.18.apk", "AniPins-2.5.19.apk", "AniPins-2.5.21.apk"]);

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ filename: string }> },
) {
  const { filename } = await params;
  if (!APK_NAMES.has(filename)) {
    return NextResponse.json({ error: "APK not found." }, { status: 404 });
  }

  const headers = new Headers({
    "Content-Type": "application/vnd.android.package-archive",
    "Content-Disposition": `attachment; filename="${filename}"`,
    "Cache-Control": "public, max-age=300, must-revalidate",
    "X-Content-Type-Options": "nosniff",
  });

  // Releases are served from the checked-in Cloudflare app image.
  try {
    const bytes = await readFile(path.join(process.cwd(), "public", "downloads", filename));
    if (bytes.byteLength > 0) {
      headers.set("Content-Length", String(bytes.byteLength));
      return new Response(bytes, { status: 200, headers });
    }
  } catch {
    return NextResponse.json({ error: "APK not found in the Cloudflare release archive." }, { status: 404 });
  }
}
