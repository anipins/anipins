/*
 * Safe Supabase Storage -> Cloudflare R2 migration for AniPins artwork.
 *
 * Default: dry run. Pass --copy to upload byte-for-byte copies.
 * This script never deletes from Supabase and keeps a JSONL manifest so a
 * stopped migration can be resumed safely.
 */
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { GetObjectCommand, HeadObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

const copy = process.argv.includes("--copy");
const required = ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "R2_ENDPOINT", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY", "R2_PUBLIC_BUCKET", "R2_PREMIUM_BUCKET"];
const missing = required.filter(name => !process.env[name]);
if (missing.length) throw new Error(`Missing required environment variables: ${missing.join(", ")}`);

const sourceUrl = process.env.SUPABASE_URL.replace(/\/$/, "");
const sourceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const manifestPath = path.resolve("artifacts", "migration-r2-manifest.jsonl");
const r2 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: { accessKeyId: process.env.R2_ACCESS_KEY_ID, secretAccessKey: process.env.R2_SECRET_ACCESS_KEY },
});

const sha256 = data => crypto.createHash("sha256").update(data).digest("hex");
const bodyToBuffer = async body => Buffer.from(await new Response(body).arrayBuffer());
const contentType = key => key.endsWith(".png") ? "image/png" : key.endsWith(".webp") ? "image/webp" : key.endsWith(".gif") ? "image/gif" : key.endsWith(".avif") ? "image/avif" : "image/jpeg";

async function withRetries(action, label, attempts = 4) {
  let failure;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await action();
    } catch (error) {
      if (error?.name === "NoSuchKey" || error?.$metadata?.httpStatusCode === 404) throw error;
      failure = error;
      if (attempt < attempts) await new Promise(resolve => setTimeout(resolve, 500 * attempt));
    }
  }
  throw new Error(`${label} failed after ${attempts} attempts: ${failure?.message || failure}`);
}

async function list(prefix = "") {
  const items = [];
  for (let offset = 0; ; offset += 1000) {
    const page = await withRetries(async () => {
      const response = await fetch(`${sourceUrl}/storage/v1/object/list/artworks`, {
        method: "POST",
        headers: { Authorization: `Bearer ${sourceKey}`, apikey: sourceKey, "Content-Type": "application/json" },
        body: JSON.stringify({ prefix, limit: 1000, offset, sortBy: { column: "name", order: "asc" } }),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json();
    }, `List ${prefix || "root"}`);
    items.push(...page);
    if (page.length < 1000) return items;
  }
}

async function sourceObject(key) {
  return withRetries(async () => {
    const response = await fetch(`${sourceUrl}/storage/v1/object/artworks/${key}`, { headers: { Authorization: `Bearer ${sourceKey}`, apikey: sourceKey } });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return Buffer.from(await response.arrayBuffer());
  }, `Read ${key}`);
}

async function artworks() {
  const rows = [];
  for (let offset = 0; ; offset += 1000) {
    const page = await withRetries(async () => {
      const response = await fetch(`${sourceUrl}/rest/v1/artworks?select=orig,thumb,premium&order=id.asc&offset=${offset}&limit=1000`, {
        headers: { Authorization: `Bearer ${sourceKey}`, apikey: sourceKey },
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json();
    }, "Read artwork records");
    rows.push(...page);
    if (page.length < 1000) return rows;
  }
}

const rows = await artworks();
const premiumKeys = new Set(rows.filter(row => Boolean(row.premium)).flatMap(row => [row.orig, row.thumb]).filter(Boolean));

const keys = [];
for (const prefix of ["o", "t", "avatars", "covers"]) {
  for (const item of await list(`${prefix}/`)) {
    if (item.name && item.id) keys.push(`${prefix}/${item.name}`);
  }
}

console.log(`${copy ? "Copying" : "Dry run:"} ${keys.length} Supabase objects. No source files will be deleted.`);
await fs.mkdir(path.dirname(manifestPath), { recursive: true });
const manifest = await fs.open(manifestPath, "a");
let copied = 0;
try {
  for (const key of keys) {
    const premium = premiumKeys.has(key);
    const Bucket = premium ? process.env.R2_PREMIUM_BUCKET : process.env.R2_PUBLIC_BUCKET;
    if (!copy) {
      await manifest.appendFile(JSON.stringify({ key, bucket: Bucket, premium, status: "planned" }) + "\n");
      continue;
    }
    const bytes = await sourceObject(key);
    const sourceHash = sha256(bytes);
    let unchanged = false;
    try {
      const existing = await withRetries(() => r2.send(new GetObjectCommand({ Bucket, Key: key })), `Read R2 ${key}`);
      const existingBytes = await bodyToBuffer(existing.Body);
      unchanged = existingBytes.length === bytes.length && sha256(existingBytes) === sourceHash;
    } catch (error) {
      if (error?.name !== "NoSuchKey" && error?.$metadata?.httpStatusCode !== 404) throw error;
    }
    if (!unchanged) {
      await withRetries(() => r2.send(new PutObjectCommand({ Bucket, Key: key, Body: bytes, ContentType: contentType(key), CacheControl: premium ? "private, no-store" : "public, max-age=31536000, immutable" })), `Upload ${key}`);
    }
    const head = await withRetries(() => r2.send(new HeadObjectCommand({ Bucket, Key: key })), `Verify R2 ${key}`);
    if (Number(head.ContentLength) !== bytes.length) throw new Error(`Size mismatch for ${key}`);
    await manifest.appendFile(JSON.stringify({ key, bucket: Bucket, premium, bytes: bytes.length, sha256: sourceHash, status: unchanged ? "verified-existing" : "copied-and-verified" }) + "\n");
    copied++;
    if (copied % 25 === 0 || copied === keys.length) console.log(`Progress: ${copied}/${keys.length} objects verified.`);
  }
} finally {
  await manifest.close();
}
console.log(`${copy ? "Verified" : "Planned"} ${copied || keys.length} objects. Manifest: ${manifestPath}`);
