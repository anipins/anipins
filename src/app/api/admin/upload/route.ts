import { NextRequest, NextResponse } from "next/server";
import { run, row, rows, slugify } from "@/lib/db";
import { getUser, isAdmin } from "@/lib/auth";
import { fingerprintImage, hashDistance, saveImage } from "@/lib/media";
import { notifyFollowers } from "@/lib/activity";

export const runtime = "nodejs";
export const maxDuration = 60;

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
  const creator = String(form.get("creator") || "").trim().slice(0, 120);
  const sourceUrl = String(form.get("sourceUrl") || "").trim().slice(0, 1000);
  const tags = String(form.get("tags") || "").trim();
  const gender = String(form.get("gender") || "").trim();
  const category = String(form.get("category") || "").trim();
  const featured = form.get("featured") === "1" ? 1 : 0;
  const published = form.get("published") === "1" ? 1 : 0;
  const allowDuplicate = form.get("allowDuplicate") === "1";

  const prepared = await Promise.all(files.map(async file => {
    const buffer = Buffer.from(await file.arrayBuffer());
    return { file, buffer, fingerprint: await fingerprintImage(buffer) };
  }));
  if (!allowDuplicate) {
    const known = await rows("SELECT id, title, character_name, anime_name, content_hash, perceptual_hash, thumb FROM artworks WHERE content_hash != '' OR perceptual_hash != ''");
    const duplicates: any[] = [];
    prepared.forEach((item, index) => {
      const existing = known.map((art: any) => ({ art, distance: hashDistance(item.fingerprint.perceptualHash, art.perceptual_hash) }))
        .filter((match: any) => match.art.content_hash === item.fingerprint.contentHash || match.distance <= 6)
        .sort((a: any, b: any) => a.distance - b.distance)[0];
      const sameBatch = prepared.slice(0, index).find(previous => previous.fingerprint.contentHash === item.fingerprint.contentHash || hashDistance(previous.fingerprint.perceptualHash, item.fingerprint.perceptualHash) <= 6);
      if (existing) duplicates.push({ file: item.file.name, artwork: existing.art, exact: existing.art.content_hash === item.fingerprint.contentHash, distance: existing.distance });
      else if (sameBatch) duplicates.push({ file: item.file.name, artwork: null, exact: sameBatch.fingerprint.contentHash === item.fingerprint.contentHash, distance: hashDistance(sameBatch.fingerprint.perceptualHash, item.fingerprint.perceptualHash) });
    });
    if (duplicates.length) return NextResponse.json({ error: "Possible duplicate artwork detected.", duplicates, canOverride: true }, { status: 409 });
  }

  const ids: number[] = [];
  for (const item of prepared) {
    const m = await saveImage(item.buffer, item.file.name);
    await run(
      `INSERT INTO artworks (title, character_name, character_slug, anime_name, anime_slug, description, tags, gender, category, featured, published, orig, thumb, width, height, content_hash, perceptual_hash, creator_name, source_url)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      title || character, character, slugify(character), anime, slugify(anime), description, tags, gender, category, featured, published, m.orig, m.thumb, m.width, m.height, item.fingerprint.contentHash, item.fingerprint.perceptualHash, creator, sourceUrl);
    const r = await row("SELECT id FROM artworks WHERE orig=?", m.orig);
    ids.push(r.id);
    if (published) await notifyFollowers(r.id, slugify(character), character, slugify(anime), anime);
  }
  return NextResponse.json({ ok: true, ids });
}
