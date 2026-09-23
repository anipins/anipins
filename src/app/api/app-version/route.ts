import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json(
    { versionCode: 20, versionName: "2.4.4", apk: "/downloads/AniPins-2.4.4.apk" },
    { headers: { "Cache-Control": "no-store" } },
  );
}
