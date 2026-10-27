import { NextRequest, NextResponse } from "next/server";
import { row, run } from "@/lib/db";
import { hashPassword, createSession, COOKIE, rememberAccountSession, SESSION_COOKIE_OPTIONS } from "@/lib/auth";
import { ensureSecuritySchema, requestInfo } from "@/lib/admin-security";
import { sendWelcomeEmail } from "@/lib/email";
import { readBoundedJson, RequestBodyError } from "@/lib/request-validation";

export async function POST(req: NextRequest) {
  await ensureSecuritySchema();
  let body: Record<string, unknown>;
  try { body = await readBoundedJson(req, 8 * 1024); }
  catch (error) {
    const status = error instanceof RequestBodyError ? error.status : 400;
    return NextResponse.json({ error: status === 413 ? "Request body is too large." : "Invalid request." }, { status });
  }
  const { email, password, name } = body;
  const validEmail = typeof email === "string" && email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const passwordBytes = typeof password === "string" ? new TextEncoder().encode(password).byteLength : 0;
  if (!validEmail || typeof password !== "string" || password.length < 8 || passwordBytes > 72) {
    return NextResponse.json({ error: "Enter a valid email and a password of 8–72 UTF-8 bytes." }, { status: 400 });
  }
  const em = email.toLowerCase().trim();
  const exists = await row("SELECT id FROM users WHERE email=?", em);
  if (exists) return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
  const role = "USER";
  const displayName = (typeof name === "string" ? name : "").trim().slice(0, 40);
  await run("INSERT INTO users (email,password_hash,name,nickname,role) VALUES (?,?,?,?,?)", em, hashPassword(password), displayName, displayName, role);
  const u = await row("SELECT id FROM users WHERE email=?", em);
  const info = requestInfo(req); const token = await createSession(u.id, info);
  void sendWelcomeEmail(em, displayName);
  const res = NextResponse.json({ ok: true, role });
  res.cookies.set(COOKIE, token, SESSION_COOKIE_OPTIONS);
  await rememberAccountSession(req, res, token, u.id);
  return res;
}
