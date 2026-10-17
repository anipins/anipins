import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const APK_NAMES = new Set(["AniPins.apk", "AniPins-2.4.3.apk", "AniPins-2.4.4.apk", "AniPins-2.5.0.apk", "AniPins-2.5.1.apk", "AniPins-2.5.2.apk", "AniPins-2.5.3.apk", "AniPins-2.5.4.apk", "AniPins-2.5.5.apk", "AniPins-2.5.6.apk", "AniPins-2.5.7.apk", "AniPins-2.5.8.apk", "AniPins-2.5.9.apk", "AniPins-2.5.10.apk", "AniPins-2.5.11.apk", "AniPins-2.5.12.apk", "AniPins-2.5.13.apk", "AniPins-2.5.14.apk", "AniPins-2.5.15.apk", "AniPins-2.5.18.apk", "AniPins-2.5.19.apk", "AniPins-2.5.20.apk", "AniPins-2.5.21.apk"]);

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

  // Serve checked-in releases directly from the app image first. In particular,
  // the current APK must not depend on the retired Supabase downloads bucket.
  try {
    const bytes = await readFile(path.join(process.cwd(), "public", "downloads", filename));
    if (bytes.byteLength > 0) {
      headers.set("Content-Length", String(bytes.byteLength));
      return new Response(bytes, { status: 200, headers });
    }
  } catch {
    // Older releases may still be available from the legacy public archive.
  }

  const base = process.env.SUPABASE_URL?.replace(/\/$/, "");
  if (!base) {
    return NextResponse.json({ error: "APK storage is not configured." }, { status: 503 });
  }

  const storageUrl = `${base}/storage/v1/object/public/anipins-downloads/${encodeURIComponent(filename)}`;
  const upstream = await fetch(storageUrl, { cache: "no-store" });

  if (!upstream.ok) {
    return NextResponse.json({ error: "APK is temporarily unavailable." }, { status: 502 });
  }

  const bytes = await upstream.arrayBuffer();
  if (bytes.byteLength === 0) {
    return NextResponse.json({ error: "APK is empty." }, { status: 502 });
  }

  headers.set("Content-Length", String(bytes.byteLength));

  return new Response(bytes, { status: 200, headers });
}
