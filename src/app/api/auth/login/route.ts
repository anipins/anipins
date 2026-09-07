import { NextRequest, NextResponse } from "next/server";
import { row } from "@/lib/db";
import { checkPassword, createSession, COOKIE } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();
  const em = String(email || "").toLowerCase().trim();
  const u = await row("SELECT * FROM users WHERE email=?", em);
  if (!u || !checkPassword(password || "", u.password_hash)) {
    return NextResponse.json({ error: "Incorrect email or password." }, { status: 401 });
  }
  const token = await createSession(u.id);
  const res = NextResponse.json({ ok: true, role: u.role });
  res.cookies.set(COOKIE, token, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 30 });
  return res;
}
