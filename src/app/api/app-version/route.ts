import { NextResponse } from "next/server";

// Google/browser authentication fallback release metadata.
export function GET() {
  return NextResponse.json(
    { versionCode: 29, versionName: "2.5.8", apk: "/downloads/AniPins-2.5.8.apk" },
    { headers: { "Cache-Control": "no-store" } },
  );
}
