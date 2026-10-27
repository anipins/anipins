import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { row, run } from "@/lib/db";
import { checkPassword, createSession, COOKIE, rememberAccountSession, SESSION_COOKIE_OPTIONS } from "@/lib/auth";
import { createLoginAlert, decryptSecret, ensureSecuritySchema, hashRecovery, requestInfo, verifyTotp } from "@/lib/admin-security";
import { readBoundedJson, RequestBodyError } from "@/lib/request-validation";

export async function POST(req: NextRequest) {
  await ensureSecuritySchema();
  let body: Record<string, unknown>;
  try { body = await readBoundedJson(req, 8 * 1024); }
  catch (error) {
    const status = error instanceof RequestBodyError ? error.status : 400;
    return NextResponse.json({ error: status === 413 ? "Request body is too large." : "Invalid request." }, { status });
  }
  const { email, password, challenge, code } = body;
  const info = requestInfo(req);
  if (challenge) {
    const pending = await row("SELECT c.*, u.role, u.two_factor_secret, u.recovery_codes FROM login_challenges c JOIN users u ON u.id=c.user_id WHERE c.token=? AND c.expires_at>?", String(challenge), Date.now());
    if (!pending) return NextResponse.json({ error: "This verification request expired. Sign in again." }, { status: 401 });
    let valid = false; const entered = String(code || "");
    try { valid = verifyTotp(decryptSecret(pending.two_factor_secret), entered); } catch {}
    if (!valid) {
      const wanted = hashRecovery(entered); const recovery: string[] = JSON.parse(pending.recovery_codes || "[]"); const index = recovery.indexOf(wanted);
      if (index >= 0) { recovery.splice(index, 1); await run("UPDATE users SET recovery_codes=? WHERE id=?", JSON.stringify(recovery), pending.user_id); valid = true; }
    }
    if (!valid) return NextResponse.json({ error: "Incorrect authentication or recovery code." }, { status: 401 });
    await run("DELETE FROM login_challenges WHERE token=?", String(challenge));
    const token = await createSession(pending.user_id, info); await createLoginAlert(pending.user_id, info.ip, info.ua);
    const res = NextResponse.json({ ok: true, role: pending.role }); res.cookies.set(COOKIE, token, SESSION_COOKIE_OPTIONS); await rememberAccountSession(req, res, token, pending.user_id); return res;
  }
  if (typeof password !== "string" || new TextEncoder().encode(password).byteLength > 72) return NextResponse.json({ error: "Incorrect email or password." }, { status: 401 });
  const em = typeof email === "string" ? email.toLowerCase().trim().slice(0, 254) : "";
  const u = await row("SELECT * FROM users WHERE email=?", em);
  if (!u || !checkPassword(password || "", u.password_hash)) {
    return NextResponse.json({ error: "Incorrect email or password." }, { status: 401 });
  }
  if (u.role === "ADMIN" && Number(u.two_factor_enabled) === 1) {
    const token = crypto.randomBytes(32).toString("base64url");
    await run("DELETE FROM login_challenges WHERE expires_at<=?", Date.now());
    await run("INSERT INTO login_challenges (token,user_id,expires_at,ip_address,user_agent) VALUES (?,?,?,?,?)", token, u.id, Date.now()+5*60_000, info.ip, info.ua);
    return NextResponse.json({ requiresTwoFactor: true, challenge: token });
  }
  const token = await createSession(u.id, info);
  if (u.role === "ADMIN") await createLoginAlert(u.id, info.ip, info.ua);
  const res = NextResponse.json({ ok: true, role: u.role });
  res.cookies.set(COOKIE, token, SESSION_COOKIE_OPTIONS);
  await rememberAccountSession(req, res, token, u.id);
  return res;
}
