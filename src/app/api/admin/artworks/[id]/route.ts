import { NextRequest, NextResponse } from "next/server";
import { row, run, slugify } from "@/lib/db";
import { getUser, isAdmin } from "@/lib/auth";
import { enqueueMediaCleanup, moveArtworkVisibility, processMediaCleanupQueue, saveImage } from "@/lib/media";
import { audit, requestInfo } from "@/lib/admin-security";

async function guard() {
  const u = await getUser();
  return isAdmin(u) ? u : null;
}

export async function GET(_req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const g = await guard();if (!g) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const art = await row("SELECT * FROM artworks WHERE id=?", parseInt(params.id));
  if (!art) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ art });
}

export async function PATCH(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const g = await guard();if (!g) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const id = parseInt(params.id);
  const art = await row("SELECT * FROM artworks WHERE id=?", id);
  if (!art) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const ct = req.headers.get("content-type") || "";
  let body: any = {};
  let newImage: File | null = null;
  if (ct.includes("multipart/form-data")) {
    const form = await req.formData();
    for (const [k, v] of form.entries()) if (typeof v === "string") body[k] = v;
    const f = form.get("image");
    if (f && typeof f !== "string" && (f as File).size > 0) newImage = f as File;
  } else {
    body = await req.json();
  }

  const fields: string[] = [];
  const args: any[] = [];
  const map: Record<string, string> = { title: "title", description: "description", tags: "tags", category: "category", gender: "gender", creator: "creator_name", sourceUrl: "source_url" };
  for (const k of Object.keys(map)) if (body[k] !== undefined) { fields.push(`${map[k]}=?`); args.push(String(body[k])); }
  if (body.character !== undefined) { fields.push("character_name=?", "character_slug=?"); args.push(String(body.character), slugify(String(body.character))); }
  if (body.anime !== undefined) { fields.push("anime_name=?", "anime_slug=?"); args.push(String(body.anime), slugify(String(body.anime))); }
  if (body.featured !== undefined) { fields.push("featured=?"); args.push(body.featured === "1" || body.featured === 1 || body.featured === true ? 1 : 0); }
  if (body.premium !== undefined) { fields.push("premium=?"); args.push(body.premium === "1" || body.premium === 1 || body.premium === true ? 1 : 0); }
  if (body.published !== undefined) { fields.push("published=?"); args.push(body.published === "1" || body.published === 1 || body.published === true ? 1 : 0); }

  const cleanup: { key: string; premium: boolean }[] = [];
  const fromPremium = Number(art.premium || 0) === 1;
  const targetPremium = body.premium === undefined ? fromPremium : (body.premium === "1" || body.premium === 1 || body.premium === true);
  if (newImage) {
    const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
    if (!allowedTypes.has(newImage.type) || newImage.size > 15 * 1024 * 1024) {
      return NextResponse.json({ error: "Replacement must be a JPG, PNG or WebP image no larger than 15 MB." }, { status: 400 });
    }
    const buf = Buffer.from(await newImage.arrayBuffer());
    const m = await saveImage(buf, newImage.name, targetPremium);
    cleanup.push({ key: m.orig, premium: targetPremium }, { key: m.thumb, premium: targetPremium });
    if (art.orig) cleanup.push({ key: String(art.orig), premium: fromPremium });
    if (art.thumb) cleanup.push({ key: String(art.thumb), premium: fromPremium });
    fields.push("orig=?", "thumb=?", "width=?", "height=?");
    args.push(m.orig, m.thumb, m.width, m.height);
  }
  if (!newImage && body.premium !== undefined && fromPremium !== targetPremium) {
    await moveArtworkVisibility(art.orig, art.thumb, fromPremium, targetPremium);
    cleanup.push({ key: String(art.orig), premium: fromPremium }, { key: String(art.thumb), premium: fromPremium });
    if (fromPremium && !targetPremium) cleanup.push({ key: String(art.orig), premium: false }, { key: String(art.thumb), premium: false });
    if (!fromPremium && targetPremium) cleanup.push({ key: String(art.orig), premium: true }, { key: String(art.thumb), premium: true });
  }

  if (cleanup.length) await enqueueMediaCleanup(cleanup);
  try {
    if (fields.length) await run(`UPDATE artworks SET ${fields.join(",")} WHERE id=?`, ...args, id);
  } finally {
    if (cleanup.length) await processMediaCleanupQueue();
  }
  await audit(g.id,"ARTWORK_UPDATED","artwork",String(id),fields.map(field=>field.split("=")[0]).join(","),requestInfo(req).ip);
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const g = await guard();if (!g) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const id = parseInt(params.id);
  const art = await row("SELECT * FROM artworks WHERE id=?", id);
  if (!art) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await enqueueMediaCleanup([
    { key: String(art.orig), premium: Number(art.premium || 0) === 1 },
    { key: String(art.thumb), premium: Number(art.premium || 0) === 1 },
  ]);
  await run("DELETE FROM saves WHERE artwork_id=?", id);
  await run("DELETE FROM likes WHERE artwork_id=?", id);
  await run("DELETE FROM artworks WHERE id=?", id);
  const cleanup = await processMediaCleanupQueue();
  await audit(g.id,"ARTWORK_DELETED","artwork",String(id),`${art.character_name} · ${art.anime_name}`,requestInfo(_req).ip);
  return NextResponse.json({ ok: true, mediaCleanupPending: cleanup.pending > 0 });
}
