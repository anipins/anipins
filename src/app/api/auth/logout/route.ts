import { NextRequest, NextResponse } from "next/server";
import { COOKIE, destroySession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const token = req.cookies.get(COOKIE)?.value;
  if (token) await destroySession(token);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}
