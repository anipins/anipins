import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const APK_NAMES = new Set(["AniPins.apk", "AniPins-2.4.3.apk"]);

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ filename: string }> },
) {
  const { filename } = await params;
  if (!APK_NAMES.has(filename)) {
    return NextResponse.json({ error: "APK not found." }, { status: 404 });
  }

  const base = process.env.SUPABASE_URL?.replace(/\/$/, "");
  if (!base) {
    return NextResponse.json({ error: "APK storage is not configured." }, { status: 503 });
  }

  const storageUrl = `${base}/storage/v1/object/public/anipins-downloads/${encodeURIComponent(filename)}`;
  const upstream = await fetch(storageUrl, { cache: "no-store" });

  if (!upstream.ok || !upstream.body) {
    return NextResponse.json({ error: "APK is temporarily unavailable." }, { status: 502 });
  }

  const headers = new Headers();
  headers.set("Content-Type", "application/vnd.android.package-archive");
  headers.set("Content-Disposition", `attachment; filename="${filename}"`);
  headers.set("Cache-Control", "public, max-age=300, must-revalidate");
  const length = upstream.headers.get("content-length");
  if (length) headers.set("Content-Length", length);

  return new Response(upstream.body, { status: 200, headers });
}
