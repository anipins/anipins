import { NextResponse } from "next/server";

// Latest signed Android release metadata.
export function GET() {
  return NextResponse.json(
    {
      versionCode: 42,
      versionName: "2.5.21",
      apk: "/downloads/AniPins-2.5.21.apk",
      requiresReinstall: false,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
