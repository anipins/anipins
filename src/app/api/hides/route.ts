import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { run } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ ok: true, guest: true });
  const artworkId = Number((await req.json()).artworkId);
  if (!Number.isInteger(artworkId) || artworkId < 1) return NextResponse.json({ error: "Invalid artwork." }, { status: 400 });
  await run("INSERT INTO hidden_artworks (user_id, artwork_id) VALUES (?,?) ON CONFLICT(user_id, artwork_id) DO NOTHING", user.id, artworkId);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const artworkId = Number(req.nextUrl.searchParams.get("artworkId"));
  await run("DELETE FROM hidden_artworks WHERE user_id=? AND artwork_id=?", user.id, artworkId);
  return NextResponse.json({ ok: true });
}
