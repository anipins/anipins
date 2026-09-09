import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { row, rows } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const id = parseInt(params.id, 10);
  if (!Number.isFinite(id)) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const viewer = await getUser();
  const profile = await row("SELECT id, nickname, name, avatar, cover, bio, is_public, created_at FROM users WHERE id=?", id);
  if (!profile || (!profile.is_public && viewer?.id !== id)) return NextResponse.json({ error: "This profile is private." }, { status: 404 });
  const collections = await rows(
    `SELECT c.id, c.name, COUNT(s.id) AS count,
      (SELECT a.thumb FROM saves sx JOIN artworks a ON a.id=sx.artwork_id WHERE sx.collection_id=c.id ORDER BY sx.id DESC LIMIT 1) AS cover
     FROM collections c LEFT JOIN saves s ON s.collection_id=c.id WHERE c.user_id=? GROUP BY c.id, c.name ORDER BY c.id DESC LIMIT 12`, id,
  );
  const liked = await rows(
    `SELECT a.id, a.title, a.character_name, a.anime_name, a.thumb, a.width, a.height
     FROM likes l JOIN artworks a ON a.id=l.artwork_id WHERE l.user_id=? AND a.published=1 ORDER BY l.id DESC LIMIT 24`, id,
  );
  return NextResponse.json({ profile, collections, liked });
}
