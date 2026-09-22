import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({ versionCode: 18, versionName: "2.4.2", apk: "/downloads/AniPins-2.4.2.apk" }, { headers: { "Cache-Control": "no-store" } });
}
