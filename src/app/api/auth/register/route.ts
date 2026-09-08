import { NextRequest, NextResponse } from "next/server";
import { row, run } from "@/lib/db";
import { hashPassword, createSession, COOKIE, ADMIN_EMAIL } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { email, password, name } = await req.json();
  if (!email || !password || password.length < 6) {
    return NextResponse.json({ error: "Valid email and a password of 6+ characters required." }, { status: 400 });
  }
  const em = String(email).toLowerCase().trim();
  const exists = await row("SELECT id FROM users WHERE email=?", em);
  if (exists) return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
  const role = em === ADMIN_EMAIL ? "ADMIN" : "USER";
  const displayName = String(name || "").trim().slice(0, 40);
  await run("INSERT INTO users (email,password_hash,name,nickname,role) VALUES (?,?,?,?,?)", em, hashPassword(password), displayName, displayName, role);
  const u = await row("SELECT id FROM users WHERE email=?", em);
  const token = await createSession(u.id);
  const res = NextResponse.json({ ok: true, role });
  res.cookies.set(COOKIE, token, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 30 });
  return res;
}
