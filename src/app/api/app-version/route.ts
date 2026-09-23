import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json(
    { versionCode: 25, versionName: "2.5.4", apk: "/downloads/AniPins-2.5.4.apk" },
    { headers: { "Cache-Control": "no-store" } },
  );
}
