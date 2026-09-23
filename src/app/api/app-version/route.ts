import { NextResponse } from "next/server";

// Google/browser authentication fallback release metadata.
export function GET() {
  return NextResponse.json(
    { versionCode: 28, versionName: "2.5.7", apk: "/downloads/AniPins-2.5.7.apk" },
    { headers: { "Cache-Control": "no-store" } },
  );
}
