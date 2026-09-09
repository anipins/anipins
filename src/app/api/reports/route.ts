import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { row, run } from "@/lib/db";

export async function POST(req: NextRequest) {
  const user = await getUser();
  const { artworkId, reason, details } = await req.json();
  const id = Number(artworkId);
  const allowed = ["wrong-info", "duplicate", "broken", "copyright", "inappropriate", "other"];
  if (!Number.isInteger(id) || !allowed.includes(reason)) return NextResponse.json({ error: "Choose a valid report reason." }, { status: 400 });
  if (!(await row("SELECT id FROM artworks WHERE id=?", id))) return NextResponse.json({ error: "Artwork not found." }, { status: 404 });
  await run("INSERT INTO content_reports (user_id, artwork_id, reason, details) VALUES (?,?,?,?)", user?.id || null, id, reason, String(details || "").trim().slice(0, 500));
  return NextResponse.json({ ok: true });
}
