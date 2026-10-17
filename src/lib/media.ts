import path from "path";
import fs from "fs";
import sharp from "sharp";
import crypto from "crypto";
import { row, rows, run, UPLOADS_DIR } from "./db";
import { r2Delete, r2Get, r2Put, USE_R2_STORAGE } from "./r2";
import { drainMediaCleanupQueue, type MediaCleanupItem } from "./media-cleanup";

const SB_URL = process.env.SUPABASE_URL?.replace(/\/$/, "");
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
export const USE_SUPABASE_STORAGE = !!(SB_URL && SB_KEY);
/** R2 becomes active only when explicitly selected after a verified migration. */
export const USE_R2_MEDIA = USE_R2_STORAGE && process.env.MEDIA_PROVIDER === "r2";
export const BUCKET = "artworks";

export function isSafeMediaKey(rel: string) {
  return /^(?:o|t|avatars|covers)\/[a-zA-Z0-9._-]+$/.test(rel);
}

export function sbPublicUrl(rel: string) {
  if (!isSafeMediaKey(rel)) throw new Error("Invalid media key");
  return `${SB_URL}/storage/v1/object/public/${BUCKET}/${rel}`;
}

async function sbUpload(key: string, buf: Buffer, contentType: string) {
  const attempts = 5;
  for (let attempt = 0; attempt < attempts; attempt++) {
    let timeout: ReturnType<typeof setTimeout> | undefined;
    try {
      const controller = new AbortController();
      timeout = setTimeout(() => controller.abort(), 40_000);
      const r = await fetch(`${SB_URL}/storage/v1/object/${BUCKET}/${key}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${SB_KEY}`, "Content-Type": contentType, "Cache-Control": "public, max-age=31536000, immutable", "x-upsert": "true" },
        body: new Uint8Array(buf),
        signal: controller.signal,
      });
      if (r.ok) return;
      const detail = await r.text();
      if (![429, 500, 502, 503, 504].includes(r.status)) throw new Error(`Storage upload failed (${r.status}): ${detail}`);
      if (attempt === attempts - 1) throw new Error(`Storage upload failed (${r.status}). Please retry this image.`);
      const retryAfter = Number(r.headers.get("retry-after"));
      const delay = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : 750 * 2 ** attempt;
      await new Promise(resolve => setTimeout(resolve, Math.min(delay, 10_000)));
    } catch (error) {
      if (attempt === attempts - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 750 * 2 ** attempt));
    } finally {
      if (timeout) clearTimeout(timeout);
    }
  }
}

async function sbDelete(keys: string[]) {
  const response = await fetch(`${SB_URL}/storage/v1/object/${BUCKET}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${SB_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ prefixes: keys }),
  });
  if (!response.ok) throw new Error(`Storage delete failed (${response.status})`);
}

const MIME: Record<string, string> = { ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp", ".gif": "image/gif" };

/** Create an unguessable destination for a browser upload. The browser only ever
 * receives a short-lived signed URL for this one key; the service role key stays
 * on the server. */
export function newArtworkUploadKey(origName: string) {
  const ext = (path.extname(origName) || ".jpg").toLowerCase().replace(/[^a-z0-9.]/g, "") || ".jpg";
  if (!(ext in MIME)) throw new Error("Unsupported image type");
  return `o/${crypto.randomBytes(16).toString("hex")}${ext}`;
}

async function putMedia(key: string, buf: Buffer, contentType: string, premium = false) {
  if (USE_R2_MEDIA && key.startsWith("t/")) {
    const secret = process.env.NEXTAUTH_SECRET;
    const origin = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXTAUTH_URL;
    if (secret && origin && !/^https?:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?(?:\/|$)/i.test(origin)) {
      const expiresAt = Math.floor(Date.now() / 1000) + 300;
      const scope = premium ? "1" : "0";
      const signature = crypto.createHmac("sha256", secret).update(`thumbnail:${key}:${scope}:${expiresAt}`).digest("base64url");
      const url = new URL("/api/storage-thumbnail", origin);
      url.searchParams.set("key", key);
      url.searchParams.set("p", scope);
      url.searchParams.set("e", String(expiresAt));
      url.searchParams.set("s", signature);
      const response = await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": contentType },
        body: new Uint8Array(buf),
      });
      if (response.ok) return;
      // Keep uploads resilient if the Worker capability route is temporarily
      // unavailable; the server-side R2 credentials are the trusted fallback.
      console.warn("Worker thumbnail write failed; falling back to R2", response.status);
    }
  }
  if (USE_R2_MEDIA) return r2Put(key, buf, contentType, premium);
  if (USE_SUPABASE_STORAGE) return sbUpload(key, buf, contentType);
  throw new Error("Object storage is not configured");
}

async function getMedia(key: string, premium = false) {
  if (USE_R2_MEDIA) {
    const secret = process.env.NEXTAUTH_SECRET;
    const origin = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXTAUTH_URL;
    // Production uploads first go through the Worker-bound R2 bucket. Use a
    // signed, short-lived same-origin read to retrieve that staged object for
    // Sharp processing. This avoids a fragile second S3 credential hop from
    // the container and works for both the public and Premium buckets.
    if (secret && origin && !/^https?:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?(?:\/|$)/i.test(origin)) {
      const expiresAt = Math.floor(Date.now() / 1000) + 300;
      const scope = premium ? "1" : "0";
      const signature = crypto.createHmac("sha256", secret).update(`read:${key}:${scope}:${expiresAt}`).digest("base64url");
      const url = new URL("/api/storage-read", origin);
      url.searchParams.set("key", key);
      url.searchParams.set("p", scope);
      url.searchParams.set("e", String(expiresAt));
      url.searchParams.set("s", signature);
      try {
        const response = await fetch(url, { cache: "no-store" });
        if (response.ok) return Buffer.from(await response.arrayBuffer());
        console.warn("Worker staged artwork read failed; falling back to R2", response.status);
      } catch (error) {
        console.warn("Worker staged artwork read failed; falling back to R2", error);
      }
    }
    const object = await r2Get(key, premium);
    if (!object.Body) throw new Error("Storage object has no body");
    return Buffer.from(await object.Body.transformToByteArray());
  }
  if (USE_SUPABASE_STORAGE) {
    const response = await fetch(`${SB_URL}/storage/v1/object/${BUCKET}/${key}`, { headers: { Authorization: `Bearer ${SB_KEY}` } });
    if (!response.ok) throw new Error(`Storage read failed (${response.status})`);
    return Buffer.from(await response.arrayBuffer());
  }
  throw new Error("Object storage is not configured");
}

export async function createSignedArtworkUpload(key: string, premium = false) {
  if (!isSafeMediaKey(key) || !key.startsWith("o/")) return null;
  if (USE_R2_MEDIA) {
    // A browser PUT directly to the S3-compatible R2 hostname is vulnerable
    // to WebView CORS and connection failures. Issue a very short-lived
    // same-origin capability instead; the Cloudflare Worker streams it into
    // the correct R2 bucket without sending the image through the container.
    const secret = process.env.NEXTAUTH_SECRET;
    if (!secret) throw new Error("Secure upload signing is not configured");
    const expiresAt = Math.floor(Date.now() / 1000) + 300;
    const scope = premium ? "1" : "0";
    const signature = crypto.createHmac("sha256", secret).update(`upload:${key}:${scope}:${expiresAt}`).digest("base64url");
    return { key, uploadUrl: `/api/storage-upload?key=${encodeURIComponent(key)}&p=${scope}&e=${expiresAt}&s=${signature}`, token: "" };
  }
  if (!USE_SUPABASE_STORAGE) return null;
  const response = await fetch(`${SB_URL}/storage/v1/object/upload/sign/${BUCKET}/${key}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${SB_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
  if (!response.ok) throw new Error(`Unable to prepare storage upload (${response.status})`);
  const data = await response.json() as { url?: string; token?: string };
  if (!data.url) throw new Error("Storage did not return an upload URL");
  return { key, uploadUrl: data.url.startsWith("http") ? data.url : `${SB_URL}/storage/v1${data.url}`, token: data.token || "" };
}

/** Read a direct-to-storage original back on the server for validation,
 * duplicate detection and thumbnail generation. */
export async function readArtworkUpload(key: string, premium = false) {
  if (!isSafeMediaKey(key) || !key.startsWith("o/")) throw new Error("Invalid staged artwork");
  return getMedia(key, premium);
}

/** Finish an original which has already been uploaded directly to storage.
 * This deliberately does not upload the original again. */
export async function processUploadedArtwork(buffer: Buffer, origKey: string, premium = false) {
  if (!isSafeMediaKey(origKey) || !origKey.startsWith("o/")) throw new Error("Invalid staged artwork");
  const id = path.basename(origKey, path.extname(origKey));
  const thumbKey = `t/${id}.webp`;
  const img = sharp(buffer);
  const meta = await img.metadata();
  const thumbBuf = await img.rotate().resize({ width: 640, withoutEnlargement: true, fastShrinkOnLoad: true }).webp({ quality: 72, effort: 4 }).toBuffer();
  await putMedia(thumbKey, thumbBuf, "image/webp", premium);
  return { orig: origKey, thumb: thumbKey, width: meta.width || 0, height: meta.height || 0 };
}

export async function saveImage(buffer: Buffer, origName: string, premium = false) {
  const id = crypto.randomBytes(8).toString("hex");
  const ext = (path.extname(origName) || ".jpg").toLowerCase().replace(/[^a-z0-9.]/g, "") || ".jpg";
  const origKey = `o/${id}${ext}`;
  const thumbKey = `t/${id}.webp`;

  const img = sharp(buffer);
  const meta = await img.metadata();
  const thumbBuf = await img.rotate().resize({ width: 640, withoutEnlargement: true, fastShrinkOnLoad: true }).webp({ quality: 72, effort: 4 }).toBuffer();

  if (USE_R2_MEDIA || USE_SUPABASE_STORAGE) {
    await Promise.all([
      putMedia(origKey, buffer, MIME[ext] || "application/octet-stream", premium),
      putMedia(thumbKey, thumbBuf, "image/webp", premium),
    ]);
  } else {
    fs.mkdirSync(path.join(UPLOADS_DIR, "o"), { recursive: true });
    fs.mkdirSync(path.join(UPLOADS_DIR, "t"), { recursive: true });
    fs.writeFileSync(path.join(UPLOADS_DIR, origKey), buffer);
    fs.writeFileSync(path.join(UPLOADS_DIR, thumbKey), thumbBuf);
  }
  return { orig: origKey, thumb: thumbKey, width: meta.width || 0, height: meta.height || 0 };
}

/** A cacheable media URL for clients. Media always passes through the app so a
 * Premium file can enforce the same membership rule as its feed and download. */
export function publicMediaUrl(rel: string) {
  if (!isSafeMediaKey(rel)) return "";
  return `/api/img/${rel}`;
}

/**
 * Published, non-Premium feed thumbnails may be read straight from the
 * Worker-bound public R2 bucket. A short HMAC keeps drafts, Premium media and
 * guessed object names off that fast path; originals always retain the normal
 * application access check.
 */
export function publicThumbnailUrl(rel: string) {
  if (!isSafeMediaKey(rel) || !rel.startsWith("t/")) return publicMediaUrl(rel);
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) return publicMediaUrl(rel);
  const expiresAt = Math.floor(Date.now() / 1000) + 60;
  const signature = crypto.createHmac("sha256", secret).update(`thumbnail:${rel}:${expiresAt}`).digest("base64url");
  return `/api/img/${rel}?e=${expiresAt}&s=${signature}`;
}

/**
 * Published, non-Premium originals can take the Worker-to-public-R2 fast path
 * too. The short HMAC is minted only after the application has selected a
 * public artwork record, so an object name alone never grants media access.
 */
export function publicOriginalUrl(rel: string) {
  if (!isSafeMediaKey(rel) || !rel.startsWith("o/")) return publicMediaUrl(rel);
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) return publicMediaUrl(rel);
  const expiresAt = Math.floor(Date.now() / 1000) + 60;
  const signature = crypto.createHmac("sha256", secret).update(`original:${rel}:${expiresAt}`).digest("base64url");
  return `/api/img/${rel}?e=${expiresAt}&s=${signature}`;
}

export async function saveAvatar(buffer: Buffer, userId: number) {
  const key = `avatars/${userId}-${crypto.randomBytes(8).toString("hex")}.webp`;
  const avatar = await sharp(buffer)
    .rotate()
    .resize(512, 512, { fit: "cover", position: "attention" })
    .webp({ quality: 84 })
    .toBuffer();

  if (USE_R2_MEDIA || USE_SUPABASE_STORAGE) {
    await putMedia(key, avatar, "image/webp");
  } else {
    fs.mkdirSync(path.join(UPLOADS_DIR, "avatars"), { recursive: true });
    fs.writeFileSync(path.join(UPLOADS_DIR, key), avatar);
  }
  return key;
}

export async function saveCover(buffer: Buffer, userId: number) {
  const key = `covers/${userId}-${crypto.randomBytes(8).toString("hex")}.webp`;
  const cover = await sharp(buffer).rotate().resize(1600, 600, { fit: "cover", position: "attention" }).webp({ quality: 82 }).toBuffer();
  if (USE_R2_MEDIA || USE_SUPABASE_STORAGE) await putMedia(key, cover, "image/webp");
  else {
    fs.mkdirSync(path.join(UPLOADS_DIR, "covers"), { recursive: true });
    fs.writeFileSync(path.join(UPLOADS_DIR, key), cover);
  }
  return key;
}

export async function fingerprintImage(buffer: Buffer) {
  const contentHash = crypto.createHash("sha256").update(buffer).digest("hex");
  const { data } = await sharp(buffer).rotate().grayscale().resize(9, 8, { fit: "fill" }).raw().toBuffer({ resolveWithObject: true });
  let bits = "";
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) bits += data[y * 9 + x] > data[y * 9 + x + 1] ? "1" : "0";
  }
  let perceptualHash = "";
  for (let i = 0; i < bits.length; i += 4) perceptualHash += parseInt(bits.slice(i, i + 4), 2).toString(16);
  return { contentHash, perceptualHash };
}

export function hashDistance(a: string, b: string) {
  if (!a || !b || a.length !== b.length) return 999;
  let distance = 0;
  for (let i = 0; i < a.length; i++) {
    let n = parseInt(a[i], 16) ^ parseInt(b[i], 16);
    while (n) { distance += n & 1; n >>>= 1; }
  }
  return distance;
}

async function deleteStoredMedia(rel: string, premium = false) {
  if (!isSafeMediaKey(rel)) throw new Error("Invalid media key");
  if (USE_R2_MEDIA) return r2Delete(rel, premium);
  if (USE_SUPABASE_STORAGE) return sbDelete([rel]);
  const root = path.resolve(UPLOADS_DIR);
  const target = path.resolve(root, rel);
  if (!target.startsWith(`${root}${path.sep}`)) throw new Error("Invalid media path");
  try {
    fs.unlinkSync(target);
  } catch (error: any) {
    if (error?.code !== "ENOENT") throw error;
  }
}

export async function enqueueMediaCleanup(items: MediaCleanupItem[]) {
  const unique = new Map<string, MediaCleanupItem>();
  for (const item of items) {
    if (!item || !isSafeMediaKey(item.key)) throw new Error("Invalid media cleanup key");
    unique.set(`${item.premium ? 1 : 0}:${item.key}`, { key: item.key, premium: Boolean(item.premium) });
  }
  for (const item of unique.values()) {
    await run(
      "INSERT INTO media_cleanup_queue (object_key, premium) VALUES (?, ?) ON CONFLICT (object_key, premium) DO NOTHING",
      item.key,
      item.premium ? 1 : 0,
    );
  }
}

export async function processMediaCleanupQueue() {
  const pending = await rows("SELECT object_key AS key, premium FROM media_cleanup_queue ORDER BY created_at ASC LIMIT 100");
  return drainMediaCleanupQueue(
    pending.map((item: any) => ({ key: String(item.key), premium: Number(item.premium || 0) === 1 })),
    {
      isReferenced: async item => {
        const artwork = USE_R2_MEDIA
          ? await row("SELECT 1 AS found FROM artworks WHERE (orig=? OR thumb=?) AND COALESCE(premium, 0)=? LIMIT 1", item.key, item.key, item.premium ? 1 : 0)
          : await row("SELECT 1 AS found FROM artworks WHERE orig=? OR thumb=? LIMIT 1", item.key, item.key);
        if (artwork) return true;
        return Boolean(await row("SELECT 1 AS found FROM users WHERE avatar=? OR cover=? LIMIT 1", item.key, item.key));
      },
      deleteObject: item => deleteStoredMedia(item.key, item.premium),
      removeFromQueue: async item => {
        await run("DELETE FROM media_cleanup_queue WHERE object_key=? AND premium=?", item.key, item.premium ? 1 : 0);
      },
    },
  );
}

export async function deleteFile(rel: string, premium = false) {
  if (!rel || !isSafeMediaKey(rel)) return;
  await deleteStoredMedia(rel, premium);
}

export async function deleteFiles(orig: string, thumb: string, premium = false) {
  if (!isSafeMediaKey(orig) || !isSafeMediaKey(thumb)) return;
  await Promise.all([deleteStoredMedia(orig, premium), deleteStoredMedia(thumb, premium)]);
}

/** Copy to the new R2 bucket first; the caller updates metadata, then queues the old bucket for cleanup. */
export async function moveArtworkVisibility(orig: string, thumb: string, fromPremium: boolean, toPremium: boolean) {
  if (!USE_R2_MEDIA || fromPremium === toPremium) return;
  for (const key of [orig, thumb]) {
    const bytes = await getMedia(key, fromPremium);
    await putMedia(key, bytes, MIME[path.extname(key).toLowerCase()] || "application/octet-stream", toPremium);
  }
}
