import { NextRequest, NextResponse } from "next/server";
import { rows, row, run } from "@/lib/db";
import { getUser } from "@/lib/auth";
export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const u = await getUser();
  if (!u) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  const col = await row("SELECT * FROM collections WHERE id=? AND user_id=?", parseInt(params.id), u.id);
  if (!col) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const items = await rows(
    `SELECT a.id, a.title, a.character_name, a.anime_name, a.thumb, a.width, a.height
     FROM saves s JOIN artworks a ON a.id = s.artwork_id WHERE s.collection_id = ? ORDER BY s.id DESC`, col.id);
  return NextResponse.json({ collection: col, items });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const u = await getUser();
  if (!u) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  const id = parseInt(params.id);
  await run("DELETE FROM saves WHERE collection_id=? AND user_id=?", id, u.id);
  await run("DELETE FROM collections WHERE id=? AND user_id=?", id, u.id);
  return NextResponse.json({ ok: true });
}
