import { NextResponse } from "next/server";

// Google/browser authentication fallback release metadata.
export function GET() {
  return NextResponse.json(
    { versionCode: 26, versionName: "2.5.5", apk: "/downloads/AniPins-2.5.5.apk" },
    { headers: { "Cache-Control": "no-store" } },
  );
}
