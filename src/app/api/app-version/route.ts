import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({ versionCode: 14, versionName: "2.3.2", apk: "/downloads/AniPins.apk" }, { headers: { "Cache-Control": "public, max-age=300, s-maxage=300" } });
}
