import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { rows, run } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ follows: [], guest: true });
  return NextResponse.json({ follows: await rows("SELECT id, kind, value, label FROM follows WHERE user_id=? ORDER BY id DESC", user.id) });
}

export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Sign in to follow characters and series." }, { status: 401 });
  const { kind, value, label, remove } = await req.json();
  if (!["character", "anime"].includes(kind) || !value || !label) return NextResponse.json({ error: "Invalid follow target." }, { status: 400 });
  if (remove) await run("DELETE FROM follows WHERE user_id=? AND kind=? AND value=?", user.id, kind, value);
  else await run("INSERT INTO follows (user_id, kind, value, label) VALUES (?,?,?,?) ON CONFLICT(user_id, kind, value) DO NOTHING", user.id, kind, value, String(label).slice(0, 100));
  return NextResponse.json({ ok: true, following: !remove });
}
