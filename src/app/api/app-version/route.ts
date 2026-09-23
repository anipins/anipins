import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json(
    { versionCode: 23, versionName: "2.5.2", apk: "/downloads/AniPins-2.5.2.apk" },
    { headers: { "Cache-Control": "no-store" } },
  );
}
