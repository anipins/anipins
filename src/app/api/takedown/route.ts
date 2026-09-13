import { NextRequest, NextResponse } from "next/server";
import { run } from "@/lib/db";

export async function POST(req: NextRequest) {
  const { name, email, artworkUrl, reason } = await req.json();
  const cleanEmail = String(email || "").trim().slice(0, 254);
  const cleanReason = String(reason || "").trim().slice(0, 2000);
  if (!cleanEmail || !cleanReason) return NextResponse.json({ error: "Email and reason are required." }, { status: 400 });
  await run("INSERT INTO takedowns (name,email,artwork_url,reason) VALUES (?,?,?,?)", String(name || "").trim().slice(0, 120), cleanEmail, String(artworkUrl || "").trim().slice(0, 1000), cleanReason);
  return NextResponse.json({ ok: true });
}
