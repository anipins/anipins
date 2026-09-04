import path from "path";
import fs from "fs";
import sharp from "sharp";
import crypto from "crypto";
import { UPLOADS_DIR } from "./db";

const SB_URL = process.env.SUPABASE_URL?.replace(/\/$/, "");
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
export const USE_SUPABASE_STORAGE = !!(SB_URL && SB_KEY);
export const BUCKET = "artworks";

export function sbPublicUrl(rel: string) {
  return `${SB_URL}/storage/v1/object/public/${BUCKET}/${rel}`;
}

async function sbUpload(key: string, buf: Buffer, contentType: string) {
  const r = await fetch(`${SB_URL}/storage/v1/object/${BUCKET}/${key}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${SB_KEY}`, "Content-Type": contentType, "x-upsert": "true" },
    body: new Uint8Array(buf),
  });
  if (!r.ok) throw new Error(`Storage upload failed (${r.status}): ${await r.text()}`);
}

async function sbDelete(keys: string[]) {
  await fetch(`${SB_URL}/storage/v1/object/${BUCKET}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${SB_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ prefixes: keys }),
  }).catch(() => {});
}

const MIME: Record<string, string> = { ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp", ".gif": "image/gif" };

export async function saveImage(buffer: Buffer, origName: string) {
  const id = crypto.randomBytes(8).toString("hex");
  const ext = (path.extname(origName) || ".jpg").toLowerCase().replace(/[^a-z0-9.]/g, "") || ".jpg";
  const origKey = `o/${id}${ext}`;
  const thumbKey = `t/${id}.jpg`;

  const img = sharp(buffer);
  const meta = await img.metadata();
  const thumbBuf = await img.resize({ width: 560, withoutEnlargement: true }).jpeg({ quality: 72 }).toBuffer();

  if (USE_SUPABASE_STORAGE) {
    await sbUpload(origKey, buffer, MIME[ext] || "application/octet-stream");
    await sbUpload(thumbKey, thumbBuf, "image/jpeg");
  } else {
    fs.mkdirSync(path.join(UPLOADS_DIR, "o"), { recursive: true });
    fs.mkdirSync(path.join(UPLOADS_DIR, "t"), { recursive: true });
    fs.writeFileSync(path.join(UPLOADS_DIR, origKey), buffer);
    fs.writeFileSync(path.join(UPLOADS_DIR, thumbKey), thumbBuf);
  }
  return { orig: origKey, thumb: thumbKey, width: meta.width || 0, height: meta.height || 0 };
}

export async function deleteFiles(orig: string, thumb: string) {
  if (USE_SUPABASE_STORAGE) { await sbDelete([orig, thumb]); return; }
  for (const rel of [orig, thumb]) {
    try {
      const p = path.join(UPLOADS_DIR, rel);
      if (p.startsWith(UPLOADS_DIR) && fs.existsSync(p)) fs.unlinkSync(p);
    } catch {}
  }
}
