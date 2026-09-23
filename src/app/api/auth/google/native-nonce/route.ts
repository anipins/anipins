import { NextResponse } from "next/server";
import { generateGoogleNonce, GOOGLE_NONCE_COOKIE, GOOGLE_NONCE_COOKIE_OPTIONS, googleClientId } from "@/lib/google-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!googleClientId()) return NextResponse.json({ error: "Google sign-in is not configured." }, { status: 503 });
  const nonce = generateGoogleNonce();
  const response = NextResponse.json({ nonce: nonce.raw }, { headers: { "Cache-Control": "private, no-store" } });
  response.cookies.set(GOOGLE_NONCE_COOKIE, nonce.raw, GOOGLE_NONCE_COOKIE_OPTIONS);
  return response;
}
