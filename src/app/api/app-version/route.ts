import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({ versionCode: 7, versionName: "2.0.2", apk: "/downloads/AniPins.apk" }, { headers: { "Cache-Control": "public, max-age=300, s-maxage=300" } });
}
