import { NextRequest, NextResponse } from "next/server";
import { rows, row, run } from "@/lib/db";
import { getUser } from "@/lib/auth";
import { publicMediaUrl } from "@/lib/media";
export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const u = await getUser();
  const col = await row("SELECT c.*, u.nickname, u.name FROM collections c JOIN users u ON u.id=c.user_id WHERE c.id=? AND (c.is_private=0 OR c.user_id=?)", parseInt(params.id), u?.id || 0);
  if (!col) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const items = await rows(
    `SELECT a.id, a.title, a.character_name, a.anime_name, a.thumb, a.width, a.height
     FROM saves s JOIN artworks a ON a.id = s.artwork_id WHERE s.collection_id = ? ORDER BY s.id DESC`, col.id);
  return NextResponse.json({ collection: col, owner: u?.id === col.user_id, items: items.map((item: any) => ({ ...item, thumb_url: publicMediaUrl(item.thumb) })) });
}

export async function DELETE(_req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const u = await getUser();
  if (!u) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  const id = parseInt(params.id);
  await run("DELETE FROM saves WHERE collection_id=? AND user_id=?", id, u.id);
  await run("DELETE FROM collections WHERE id=? AND user_id=?", id, u.id);
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const u = await getUser();
  if (!u) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  const id = parseInt(params.id);const body = await req.json();
  await run("UPDATE collections SET is_private=? WHERE id=? AND user_id=?", body.isPrivate ? 1 : 0, id, u.id);
  return NextResponse.json({ ok: true });
}
