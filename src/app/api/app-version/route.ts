import { NextResponse } from "next/server";

// Latest signed Android release metadata.
export function GET() {
  return NextResponse.json(
    {
      versionCode: 40,
      versionName: "2.5.19",
      apk: "/downloads/AniPins-2.5.19.apk",
      requiresReinstall: false,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
