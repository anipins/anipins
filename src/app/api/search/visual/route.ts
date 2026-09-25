import { NextRequest, NextResponse } from "next/server";
import { row, rows } from "@/lib/db";
import { fingerprintImage, hashDistance } from "@/lib/media";
import { publicMediaUrl } from "@/lib/media";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function matches(hash: string, excludeId = 0) {
  const candidates = await rows("SELECT id, title, character_name, character_slug, anime_name, anime_slug, gender, category, thumb, width, height, perceptual_hash FROM artworks WHERE published=1 AND perceptual_hash != '' ORDER BY id DESC LIMIT 3000");
  return candidates
    .filter((item: any) => item.id !== excludeId)
    .map((item: any) => ({ ...item, similarity: Math.max(0, Math.round((1 - hashDistance(hash, item.perceptual_hash) / 64) * 100)), thumb_url: publicMediaUrl(item.thumb) }))
    .sort((a: any, b: any) => b.similarity - a.similarity)
    .slice(0, 60);
}

export async function GET(req: NextRequest) {
  const artworkId = Number(req.nextUrl.searchParams.get("artworkId"));
  if (!Number.isInteger(artworkId) || artworkId < 1) return NextResponse.json({ error: "Choose an artwork." }, { status: 400 });
  const artwork = await row("SELECT id, perceptual_hash FROM artworks WHERE id=? AND published=1", artworkId);
  if (!artwork?.perceptual_hash) return NextResponse.json({ error: "This artwork cannot be compared yet." }, { status: 404 });
  return NextResponse.json({ items: await matches(artwork.perceptual_hash, artwork.id) });
}

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const file = form.get("image");
  if (!(file instanceof File) || !file.type.startsWith("image/")) return NextResponse.json({ error: "Select an image file." }, { status: 400 });
  if (file.size > 12 * 1024 * 1024) return NextResponse.json({ error: "Image must be 12 MB or smaller." }, { status: 413 });
  try {
    const fingerprint = await fingerprintImage(Buffer.from(await file.arrayBuffer()));
    return NextResponse.json({ items: await matches(fingerprint.perceptualHash) });
  } catch {
    return NextResponse.json({ error: "That image could not be read." }, { status: 400 });
  }
}
