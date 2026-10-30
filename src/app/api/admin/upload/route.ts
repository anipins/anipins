import { NextRequest, NextResponse } from "next/server";
import { run, row, rows, slugify } from "@/lib/db";
import { getUser, isAdmin } from "@/lib/auth";
import { fingerprintImage, hashDistance, processUploadedArtwork, readArtworkUpload, saveImage } from "@/lib/media";
import { notifyFollowers } from "@/lib/activity";
import { audit, requestInfo } from "@/lib/admin-security";
import { ensurePremiumArtworkSchema } from "@/lib/premium-artwork";

export const runtime = "nodejs";
// High-resolution source images need server-side hashing plus a WebP thumbnail.
// Keep the function alive long enough to finish that work after the browser has
// already completed its direct storage upload.
export const maxDuration = 300;

const MAX_ARTWORK_BYTES = 40 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function POST(req: NextRequest) {
  const u = await getUser();
  if (!isAdmin(u)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  let phase = "database-schema";
  try {
  await ensurePremiumArtworkSchema();
  phase = "request-validation";
  const direct = req.headers.get("content-type")?.includes("application/json") === true;
  const body = direct ? await req.json() : null;
  const form = direct ? null : await req.formData();
  const files = form ? form.getAll("files") as File[] : [];
  const storageKey = direct ? String(body?.storageKey || "") : "";
  const fileName = direct ? String(body?.fileName || "") : "";
  const fileType = direct ? String(body?.fileType || "").toLowerCase() : "";
  const fileSize = direct ? Number(body?.fileSize || 0) : 0;
  if (!direct && !files.length) return NextResponse.json({ error: "No files" }, { status: 400 });
  if (!direct && files.length > 20) return NextResponse.json({ error: "Upload no more than 20 files at once." }, { status: 400 });
  if (direct && (!/^o\/[a-f0-9]{32}\.(?:jpg|jpeg|png|webp)$/.test(storageKey) || !fileName || !ALLOWED_TYPES.has(fileType) || !Number.isFinite(fileSize) || fileSize < 1 || fileSize > MAX_ARTWORK_BYTES)) {
    return NextResponse.json({ error: "Invalid direct artwork upload." }, { status: 400 });
  }
  if (!direct && files.some(file => !ALLOWED_TYPES.has(file.type) || file.size < 1 || file.size > MAX_ARTWORK_BYTES)) {
    return NextResponse.json({ error: "Each artwork must be a JPG, PNG or WebP image no larger than 40 MB." }, { status: 400 });
  }

  const value = (name: string) => direct ? body?.[name] : form?.get(name);

  const character = String(value("character") || "").trim();
  const anime = String(value("anime") || "").trim();
  const premium = value("premium") === (direct ? true : "1") ? 1 : 0;
  // Keep omitted character/series metadata empty so public uploads can be
  // published as standalone artwork without inventing searchable labels.
  const storedCharacter = character || (premium ? "Premium reference" : "");
  const storedAnime = anime || (premium ? "AniPins Premium" : "");

  const title = String(value("title") || "").trim().slice(0, 160);
  const description = String(value("description") || "").trim().slice(0, 2000);
  const creator = String(value("creator") || "").trim().slice(0, 120);
  const sourceUrl = String(value("sourceUrl") || "").trim().slice(0, 1000);
  const tags = String(value("tags") || "").trim().slice(0, 1000);
  const gender = String(value("gender") || "").trim();
  const category = String(value("category") || "").trim();
  const featured = value("featured") === (direct ? true : "1") ? 1 : 0;
  const published = value("published") === (direct ? true : "1") ? 1 : 0;
  const allowDuplicate = value("allowDuplicate") === (direct ? true : "1");

  phase = "read-original";
  const prepared = direct
    ? (() => Promise.resolve(readArtworkUpload(storageKey, Boolean(premium))).then(async buffer => {
        phase = "fingerprint-image";
        return [{ name: fileName, buffer, fingerprint: await fingerprintImage(buffer) }];
      }))()
    : Promise.all(files.map(async file => {
        const buffer = Buffer.from(await file.arrayBuffer());
        phase = "fingerprint-image";
        return { name: file.name, buffer, fingerprint: await fingerprintImage(buffer) };
      }));
  const uploaded = await prepared;
  if (!allowDuplicate) {
    phase = "duplicate-check";
    const known = await rows("SELECT id, title, character_name, anime_name, content_hash, perceptual_hash, thumb FROM artworks WHERE content_hash != '' OR perceptual_hash != ''");
    const duplicates: any[] = [];
    uploaded.forEach((item, index) => {
      const existing = known.map((art: any) => ({ art, distance: hashDistance(item.fingerprint.perceptualHash, art.perceptual_hash) }))
        .filter((match: any) => match.art.content_hash === item.fingerprint.contentHash || match.distance <= 6)
        .sort((a: any, b: any) => a.distance - b.distance)[0];
      const sameBatch = uploaded.slice(0, index).find(previous => previous.fingerprint.contentHash === item.fingerprint.contentHash || hashDistance(previous.fingerprint.perceptualHash, item.fingerprint.perceptualHash) <= 6);
      if (existing) duplicates.push({ file: item.name, artwork: existing.art, exact: existing.art.content_hash === item.fingerprint.contentHash, distance: existing.distance });
      else if (sameBatch) duplicates.push({ file: item.name, artwork: null, exact: sameBatch.fingerprint.contentHash === item.fingerprint.contentHash, distance: hashDistance(sameBatch.fingerprint.perceptualHash, item.fingerprint.perceptualHash) });
    });
    if (duplicates.length) return NextResponse.json({ error: "Possible duplicate artwork detected.", duplicates, canOverride: true }, { status: 409 });
  }

  const ids: number[] = [];
  for (const item of uploaded) {
    phase = "thumbnail-generation-and-storage";
    const m = direct ? await processUploadedArtwork(item.buffer, storageKey, Boolean(premium)) : await saveImage(item.buffer, item.name, Boolean(premium));
    phase = "database-insert";
    await run(
      `INSERT INTO artworks (title, character_name, character_slug, anime_name, anime_slug, description, tags, gender, category, premium, featured, published, orig, thumb, width, height, content_hash, perceptual_hash, creator_name, source_url)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      title || storedCharacter || item.name.replace(/\.[^.]+$/, "").trim().slice(0, 160) || "Untitled artwork", storedCharacter, slugify(storedCharacter), storedAnime, slugify(storedAnime), description, tags, gender, category, premium, featured, published, m.orig, m.thumb, m.width, m.height, item.fingerprint.contentHash, item.fingerprint.perceptualHash, creator, sourceUrl);
    const r = await row("SELECT id FROM artworks WHERE orig=?", m.orig);
    ids.push(r.id);
    if (published && !premium && (character || anime)) await notifyFollowers(r.id, slugify(storedCharacter), storedCharacter || "New", slugify(storedAnime), storedAnime || "AniPins");
  }
  phase = "audit-log";
  const metadataSummary = [character, anime].filter(Boolean).join(" · ") || "metadata omitted";
  await audit(u!.id, "ARTWORK_UPLOAD", "artwork", ids.join(","), `${ids.length} artwork(s): ${metadataSummary}`, requestInfo(req).ip);
  return NextResponse.json({ ok: true, ids });
  } catch (error) {
    // Return a retryable response rather than dropping the browser connection.
    // Never expose storage/database details to the public upload UI.
    const detail = error instanceof Error ? error.message : String(error);
    console.error("Artwork upload failed", { phase, detail, name: error instanceof Error ? error.name : "UnknownError" });
    return NextResponse.json(
      { error: `The upload service failed during ${phase.replaceAll("-", " ")}. This image is still safe to retry.` },
      { status: 503, headers: { "Retry-After": "2" } },
    );
  }
}
