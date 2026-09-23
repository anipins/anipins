import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json(
    { versionCode: 22, versionName: "2.5.1", apk: "/downloads/AniPins-2.5.1.apk" },
    { headers: { "Cache-Control": "no-store" } },
  );
}
