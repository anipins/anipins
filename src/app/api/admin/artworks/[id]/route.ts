import { NextRequest, NextResponse } from "next/server";
import { row, run, slugify } from "@/lib/db";
import { getUser, isAdmin } from "@/lib/auth";
import { deleteFiles, saveImage } from "@/lib/media";

async function guard() {
  const u = await getUser();
  if (!isAdmin(u)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return null;
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const g = await guard(); if (g) return g;
  const art = await row("SELECT * FROM artworks WHERE id=?", parseInt(params.id));
  if (!art) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ art });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const g = await guard(); if (g) return g;
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
  const map: Record<string, string> = { title: "title", description: "description", tags: "tags", category: "category" };
  for (const k of Object.keys(map)) if (body[k] !== undefined) { fields.push(`${map[k]}=?`); args.push(String(body[k])); }
  if (body.character !== undefined) { fields.push("character_name=?", "character_slug=?"); args.push(String(body.character), slugify(String(body.character))); }
  if (body.anime !== undefined) { fields.push("anime_name=?", "anime_slug=?"); args.push(String(body.anime), slugify(String(body.anime))); }
  if (body.featured !== undefined) { fields.push("featured=?"); args.push(body.featured === "1" || body.featured === 1 || body.featured === true ? 1 : 0); }
  if (body.published !== undefined) { fields.push("published=?"); args.push(body.published === "1" || body.published === 1 || body.published === true ? 1 : 0); }

  if (newImage) {
    const buf = Buffer.from(await newImage.arrayBuffer());
    const m = await saveImage(buf, newImage.name);
    await deleteFiles(art.orig, art.thumb);
    fields.push("orig=?", "thumb=?", "width=?", "height=?");
    args.push(m.orig, m.thumb, m.width, m.height);
  }

  if (fields.length) await run(`UPDATE artworks SET ${fields.join(",")} WHERE id=?`, ...args, id);
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const g = await guard(); if (g) return g;
  const id = parseInt(params.id);
  const art = await row("SELECT * FROM artworks WHERE id=?", id);
  if (!art) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await deleteFiles(art.orig, art.thumb);
  await run("DELETE FROM saves WHERE artwork_id=?", id);
  await run("DELETE FROM likes WHERE artwork_id=?", id);
  await run("DELETE FROM artworks WHERE id=?", id);
  return NextResponse.json({ ok: true });
}
