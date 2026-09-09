import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { run } from "@/lib/db";

export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Sign in to enable notifications." }, { status: 401 });
  const { token, platform = "android" } = await req.json();
  const clean = String(token || "").trim();
  if (clean.length < 20 || clean.length > 4096) return NextResponse.json({ error: "Invalid device token." }, { status: 400 });
  await run(
    `INSERT INTO push_devices (user_id, token, platform, updated_at) VALUES (?,?,?,CURRENT_TIMESTAMP)
     ON CONFLICT(token) DO UPDATE SET user_id=?, platform=?, updated_at=CURRENT_TIMESTAMP`,
    user.id, clean, String(platform).slice(0, 20), user.id, String(platform).slice(0, 20),
  );
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ ok: true });
  const { token } = await req.json();
  await run("DELETE FROM push_devices WHERE user_id=? AND token=?", user.id, String(token || ""));
  return NextResponse.json({ ok: true });
}
