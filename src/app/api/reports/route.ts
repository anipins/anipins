import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { row, run } from "@/lib/db";
import { readBoundedJson, RequestBodyError } from "@/lib/request-validation";

export async function POST(req: NextRequest) {
  const user = await getUser();
  let body: Record<string, unknown>;
  try { body = await readBoundedJson(req, 4 * 1024); }
  catch (error) {
    const status = error instanceof RequestBodyError ? error.status : 400;
    return NextResponse.json({ error: status === 413 ? "Request body is too large." : "Invalid request." }, { status });
  }
  const { artworkId, reason, details } = body;
  const id = Number(artworkId);
  const allowed = ["wrong-info", "duplicate", "broken", "copyright", "inappropriate", "other"];
  if (!Number.isInteger(id) || typeof reason !== "string" || !allowed.includes(reason)) return NextResponse.json({ error: "Choose a valid report reason." }, { status: 400 });
  if (!(await row("SELECT id FROM artworks WHERE id=?", id))) return NextResponse.json({ error: "Artwork not found." }, { status: 404 });
  await run("INSERT INTO content_reports (user_id, artwork_id, reason, details) VALUES (?,?,?,?)", user?.id || null, id, reason, String(details || "").trim().slice(0, 500));
  return NextResponse.json({ ok: true });
}
