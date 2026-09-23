import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json(
    { versionCode: 24, versionName: "2.5.3", apk: "/downloads/AniPins-2.5.3.apk" },
    { headers: { "Cache-Control": "no-store" } },
  );
}
