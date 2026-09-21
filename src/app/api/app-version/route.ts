import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({ versionCode: 15, versionName: "2.3.3", apk: "/downloads/AniPins-2.3.3.apk" }, { headers: { "Cache-Control": "no-store" } });
}
