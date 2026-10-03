import { NextResponse } from "next/server";

// Latest signed Android release metadata.
export function GET() {
  return NextResponse.json(
    {
      versionCode: 39,
      versionName: "2.5.18",
      apk: "/downloads/AniPins-2.5.18.apk",
      // This release starts a new signing lineage, so old sideloaded builds
      // must be removed before Android can install it.
      requiresReinstall: true,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
