import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({ versionCode: 14, versionName: "2.3.2", apk: "/downloads/AniPins-2.3.2.apk" }, { headers: { "Cache-Control": "no-store" } });
}
