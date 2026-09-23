import { NextResponse } from "next/server";

// Google/browser authentication fallback release metadata.
export function GET() {
  return NextResponse.json(
    { versionCode: 27, versionName: "2.5.6", apk: "/downloads/AniPins-2.5.6.apk" },
    { headers: { "Cache-Control": "no-store" } },
  );
}
