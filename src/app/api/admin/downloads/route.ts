import { NextResponse } from "next/server";
import { getUser, isAdmin } from "@/lib/auth";
import { rows } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getUser();
  if (!isAdmin(user)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const downloads = await rows(
    `SELECT i.user_id, u.email, u.name, a.id AS artwork_id,
       a.title, a.character_name, a.anime_name, i.strength AS download_count, i.updated_at
     FROM interactions i
     JOIN users u ON u.id=i.user_id
     JOIN artworks a ON a.id=i.artwork_id
     WHERE i.kind='download'
     ORDER BY i.updated_at DESC
     LIMIT 100`,
  );
  return NextResponse.json({ downloads });
}
