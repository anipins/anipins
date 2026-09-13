import { NextResponse } from "next/server";

export function GET() {
  const sideLoadCertificate = "63:2A:F3:68:1D:B8:F4:6C:66:07:3F:D6:0A:51:A0:BA:A8:8B:9D:B8:53:9A:3F:2C:DE:0C:22:6B:86:68:7A:CC";
  const fingerprints = [sideLoadCertificate, ...(process.env.ANDROID_APP_LINKS_SHA256 || "").split(",")].map(value => value.trim()).filter(Boolean);
  const body = fingerprints.length ? [{ relation: ["delegate_permission/common.handle_all_urls"], target: { namespace: "android_app", package_name: "com.anipins.app", sha256_cert_fingerprints: fingerprints } }] : [];
  return NextResponse.json(body, { headers: { "Cache-Control": "public, max-age=3600" } });
}
