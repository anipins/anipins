import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({ versionCode: 17, versionName: "2.4.1", apk: "/downloads/AniPins-2.4.1.apk" }, { headers: { "Cache-Control": "no-store" } });
}
