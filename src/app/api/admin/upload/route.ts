import { NextRequest, NextResponse } from "next/server";
import { run, row, slugify } from "@/lib/db";
import { getUser, isAdmin } from "@/lib/auth";
import { saveImage } from "@/lib/media";

export async function POST(req: NextRequest) {
  const u = await getUser();
  if (!isAdmin(u)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const form = await req.formData();
  const files = form.getAll("files") as File[];
  if (!files.length) return NextResponse.json({ error: "No files" }, { status: 400 });

  const character = String(form.get("character") || "").trim();
  const anime = String(form.get("anime") || "").trim();
  if (!character || !anime) return NextResponse.json({ error: "Character and anime names are required." }, { status: 400 });

  const title = String(form.get("title") || "").trim();
  const description = String(form.get("description") || "").trim();
  const tags = String(form.get("tags") || "").trim();
  const category = String(form.get("category") || "").trim();
  const featured = form.get("featured") === "1" ? 1 : 0;
  const published = form.get("published") === "1" ? 1 : 0;

  const ids: number[] = [];
  for (const f of files) {
    const buf = Buffer.from(await f.arrayBuffer());
    const m = await saveImage(buf, f.name);
    await run(
      `INSERT INTO artworks (title, character_name, character_slug, anime_name, anime_slug, description, tags, category, featured, published, orig, thumb, width, height)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      title || character, character, slugify(character), anime, slugify(anime), description, tags, category, featured, published, m.orig, m.thumb, m.width, m.height);
    const r = await row("SELECT id FROM artworks WHERE orig=?", m.orig);
    ids.push(r.id);
  }
  return NextResponse.json({ ok: true, ids });
}
