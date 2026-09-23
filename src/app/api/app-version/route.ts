import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json(
    { versionCode: 21, versionName: "2.5.0", apk: "/downloads/AniPins-2.5.0.apk" },
    { headers: { "Cache-Control": "no-store" } },
  );
}
