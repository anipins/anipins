import { NextRequest, NextResponse } from "next/server";
import { rows, row, run } from "@/lib/db";
import { getUser } from "@/lib/auth";
export const dynamic = "force-dynamic";

export async function GET() {
  const u = await getUser();
  if (!u) return NextResponse.json({ collections: [], guest: true });
  const cols = await rows(
    `SELECT c.id, c.name, c.is_private,
      (SELECT COUNT(*) FROM saves s WHERE s.collection_id = c.id) AS count,
      (SELECT a.thumb FROM saves s JOIN artworks a ON a.id = s.artwork_id WHERE s.collection_id = c.id ORDER BY s.id DESC LIMIT 1) AS cover
     FROM collections c WHERE c.user_id = ? ORDER BY c.id DESC`, u.id);
  const saved = (await rows("SELECT DISTINCT artwork_id FROM saves WHERE user_id=?", u.id)).map((r: any) => r.artwork_id);
  return NextResponse.json({ collections: cols, saved });
}

export async function POST(req: NextRequest) {
  const u = await getUser();
  if (!u) return NextResponse.json({ error: "Sign in to create collections." }, { status: 401 });
  const { name, isPrivate = true } = await req.json();
  if (!name || !name.trim()) return NextResponse.json({ error: "Name required" }, { status: 400 });
  await run("INSERT INTO collections (user_id, name, is_private) VALUES (?,?,?)", u.id, name.trim(), isPrivate ? 1 : 0);
  const c = await row("SELECT id FROM collections WHERE user_id=? ORDER BY id DESC LIMIT 1", u.id);
  return NextResponse.json({ ok: true, id: c.id });
}
