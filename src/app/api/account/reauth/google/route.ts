import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { createGoogleReauthProof } from "@/lib/account-reauth";
import { row } from "@/lib/db";
import {
  ensureGoogleAuthSchema,
  GOOGLE_NONCE_COOKIE,
  verifyGoogleCredential,
} from "@/lib/google-auth";

export const dynamic = "force-dynamic";

const PROOF_COOKIE = "anipins_account_reauth";
const PROOF_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  path: "/api/account",
  maxAge: 5 * 60,
  priority: "high" as const,
};

export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Sign in before confirming account deletion." }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const credential = String(body.credential || "");
  const nonce = req.cookies.get(GOOGLE_NONCE_COOKIE)?.value || "";
  const response = (payload: { error?: string; ok?: boolean }, status = 200) => {
    const result = NextResponse.json(payload, { status, headers: { "Cache-Control": "private, no-store" } });
    result.cookies.set(GOOGLE_NONCE_COOKIE, "", { path: "/", maxAge: 0 });
    return result;
  };

  try {
    await ensureGoogleAuthSchema();
    const google = await verifyGoogleCredential(credential, nonce);
    const linked = await row(
      "SELECT user_id FROM auth_identities WHERE provider='google' AND provider_subject=? AND user_id=?",
      google.sub,
      user.id,
    );
    if (!linked) return response({ error: "That Google account is not linked to your signed-in AniPins account." }, 403);

    const secret = process.env.NEXTAUTH_SECRET || "";
    const proof = createGoogleReauthProof(user.id, secret);
    const result = response({ ok: true });
    result.cookies.set(PROOF_COOKIE, proof, PROOF_COOKIE_OPTIONS);
    return result;
  } catch (error) {
    const code = error instanceof Error ? error.message : "";
    const status = code === "GOOGLE_NOT_CONFIGURED" ? 503 : 401;
    const message = code === "GOOGLE_NOT_CONFIGURED"
      ? "Google reauthentication is not configured."
      : "Google account verification failed. Please try again.";
    return response({ error: message }, status);
  }
}
