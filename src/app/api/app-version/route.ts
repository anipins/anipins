import { NextResponse } from "next/server";

// Latest signed Android release metadata.
export function GET() {
  return NextResponse.json(
    { versionCode: 33, versionName: "2.5.12", apk: "/downloads/AniPins-2.5.12.apk" },
    { headers: { "Cache-Control": "no-store" } },
  );
}
