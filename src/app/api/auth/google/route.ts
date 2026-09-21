import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { COOKIE, createSession, SESSION_COOKIE_OPTIONS } from "@/lib/auth";
import {
  createLoginAlert,
  ensureSecuritySchema,
  requestInfo,
} from "@/lib/admin-security";
import { run } from "@/lib/db";
import {
  ensureGoogleAuthSchema,
  findOrCreateGoogleUser,
  GOOGLE_NONCE_COOKIE,
  verifyGoogleCredential,
} from "@/lib/google-auth";

export const dynamic = "force-dynamic";

function errorMessage(error: unknown) {
  const code = error instanceof Error ? error.message : "";
  if (code === "GOOGLE_NOT_CONFIGURED") return { status: 503, error: "Google sign-in is not configured." };
  if (code === "UNVERIFIED_GOOGLE_ACCOUNT") return { status: 401, error: "Use a verified Google account." };
  if (code === "INVALID_GOOGLE_NONCE") return { status: 401, error: "Google sign-in expired. Please try again." };
  if (code === "GOOGLE_ACCOUNT_ALREADY_LINKED") return { status: 409, error: "This AniPins account is linked to another Google account." };
  return { status: 401, error: "Google sign-in could not be verified." };
}

export async function POST(req: NextRequest) {
  const nonce = req.cookies.get(GOOGLE_NONCE_COOKIE)?.value || "";
  const clearNonce = (response: NextResponse) => {
    response.cookies.set(GOOGLE_NONCE_COOKIE, "", { path: "/", maxAge: 0 });
    return response;
  };

  try {
    const body = await req.json();
    await ensureSecuritySchema();
    await ensureGoogleAuthSchema();
    const payload = await verifyGoogleCredential(String(body.credential || ""), nonce);
    const user = await findOrCreateGoogleUser(payload);
    const info = requestInfo(req);

    if (user.role === "ADMIN" && Number(user.two_factor_enabled) === 1) {
      const challenge = crypto.randomBytes(32).toString("base64url");
      await run("DELETE FROM login_challenges WHERE expires_at<=?", Date.now());
      await run(
        "INSERT INTO login_challenges (token,user_id,expires_at,ip_address,user_agent) VALUES (?,?,?,?,?)",
        challenge,
        user.id,
        Date.now() + 5 * 60_000,
        info.ip,
        info.ua,
      );
      return clearNonce(NextResponse.json({ requiresTwoFactor: true, challenge }));
    }

    const token = await createSession(user.id, info);
    if (user.role === "ADMIN") await createLoginAlert(user.id, info.ip, info.ua);
    const response = NextResponse.json({ ok: true, role: user.role });
    response.cookies.set(COOKIE, token, SESSION_COOKIE_OPTIONS);
    return clearNonce(response);
  } catch (error) {
    const detail = errorMessage(error);
    return clearNonce(NextResponse.json({ error: detail.error }, { status: detail.status }));
  }
}
