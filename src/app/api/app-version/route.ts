import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({ versionCode: 16, versionName: "2.4.0", apk: "/downloads/AniPins-2.4.0.apk" }, { headers: { "Cache-Control": "no-store" } });
}
