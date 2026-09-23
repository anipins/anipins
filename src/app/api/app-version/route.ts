import { NextResponse } from "next/server";

// Latest signed Android release metadata.
export function GET() {
  return NextResponse.json(
    { versionCode: 36, versionName: "2.5.15", apk: "/downloads/AniPins-2.5.15.apk" },
    { headers: { "Cache-Control": "no-store" } },
  );
}
