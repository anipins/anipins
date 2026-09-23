import { NextResponse } from "next/server";

// Latest signed Android release metadata.
export function GET() {
  return NextResponse.json(
    { versionCode: 34, versionName: "2.5.13", apk: "/downloads/AniPins-2.5.13.apk" },
    { headers: { "Cache-Control": "no-store" } },
  );
}
