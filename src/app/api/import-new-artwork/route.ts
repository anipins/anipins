import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { row, run, slugify } from "@/lib/db";
import { saveImage } from "@/lib/media";
import { NEW_ARTWORK_CATALOG } from "@/lib/newArtworkCatalog";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const index = Number(form.get("index"));
  const file = form.get("file");
  const item = Number.isInteger(index) ? NEW_ARTWORK_CATALOG[index - 1] : null;
  if (!item || !(file instanceof File) || file.size === 0 || file.size > 8 * 1024 * 1024) {
    return NextResponse.json({ error: "Invalid import item." }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const digest = crypto.createHash("sha256").update(buffer).digest("hex");
  if (digest !== item[0]) {
    return NextResponse.json({ error: "File is not part of the approved artwork set." }, { status: 403 });
  }

  const marker = `source:new-artwork-2026-09-08:${digest.slice(0, 20)}`;
  const existing = await row("SELECT id FROM artworks WHERE tags LIKE ? LIMIT 1", `%${marker}%`);
  if (existing) return NextResponse.json({ ok: true, id: existing.id, skipped: true });

  const [, character, series, gender, style] = item;
  const media = await saveImage(buffer, file.name);
  const title = style ? `${character} — ${style}` : character;
  const description = style
    ? `${character} fan artwork from ${series}, presented in a ${style.toLowerCase()} style.`
    : `Fan artwork of ${character} from ${series}.`;
  const tags = [character, series, gender.toLowerCase(), style || "fan art", marker].join(",");
  const category = `${gender} Characters`;

  await run(
    `INSERT INTO artworks (title, character_name, character_slug, anime_name, anime_slug, description, tags, gender, category, featured, published, orig, thumb, width, height)
     VALUES (?,?,?,?,?,?,?,?,?,0,1,?,?,?,?)`,
    title, character, slugify(character), series, slugify(series), description, tags, gender, category,
    media.orig, media.thumb, media.width, media.height
  );
  const created = await row("SELECT id FROM artworks WHERE orig=?", media.orig);
  return NextResponse.json({ ok: true, id: created.id, skipped: false });
}
