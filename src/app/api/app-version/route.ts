import { NextResponse } from "next/server";

// Latest signed Android release metadata.
export function GET() {
  return NextResponse.json(
    { versionCode: 32, versionName: "2.5.11", apk: "/downloads/AniPins-2.5.11.apk" },
    { headers: { "Cache-Control": "no-store" } },
  );
}
