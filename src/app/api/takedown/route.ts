import { NextRequest, NextResponse } from "next/server";
import { run } from "@/lib/db";

export async function POST(req: NextRequest) {
  const { name, email, artworkUrl, reason } = await req.json();
  if (!email || !reason) return NextResponse.json({ error: "Email and reason are required." }, { status: 400 });
  await run("INSERT INTO takedowns (name,email,artwork_url,reason) VALUES (?,?,?,?)", name || "", email, artworkUrl || "", reason);
  return NextResponse.json({ ok: true });
}
