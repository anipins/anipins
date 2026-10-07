import { NextResponse } from "next/server";

// Latest signed Android release metadata.
export function GET() {
  return NextResponse.json(
    {
      versionCode: 41,
      versionName: "2.5.20",
      apk: "/downloads/AniPins-2.5.20.apk",
      requiresReinstall: false,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
