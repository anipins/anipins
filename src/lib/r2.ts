import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const accountId = process.env.R2_ACCOUNT_ID;
const endpoint = process.env.R2_ENDPOINT || (accountId ? `https://${accountId}.r2.cloudflarestorage.com` : undefined);
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

export const R2_PUBLIC_BUCKET = process.env.R2_PUBLIC_BUCKET;
export const R2_PREMIUM_BUCKET = process.env.R2_PREMIUM_BUCKET;
export const USE_R2_STORAGE = Boolean(endpoint && accessKeyId && secretAccessKey && R2_PUBLIC_BUCKET && R2_PREMIUM_BUCKET);

let client: S3Client | undefined;

export function r2Client() {
  if (!USE_R2_STORAGE) throw new Error("R2 storage is not configured");
  if (!client) {
    client = new S3Client({
      region: "auto",
      endpoint,
      credentials: { accessKeyId: accessKeyId!, secretAccessKey: secretAccessKey! },
    });
  }
  return client;
}

/** R2 remains private. This helper is used only by server routes after access checks. */
export async function r2Get(key: string, premium: boolean) {
  const Bucket = premium ? R2_PREMIUM_BUCKET! : R2_PUBLIC_BUCKET!;
  return r2Client().send(new GetObjectCommand({ Bucket, Key: key }));
}

export async function r2Put(key: string, body: Uint8Array, contentType: string, premium: boolean) {
  const Bucket = premium ? R2_PREMIUM_BUCKET! : R2_PUBLIC_BUCKET!;
  await r2Client().send(new PutObjectCommand({
    Bucket,
    Key: key,
    Body: body,
    ContentType: contentType,
    CacheControl: premium ? "private, no-store" : "public, max-age=31536000, immutable",
  }));
}

/** A short-lived, single-object upload URL. The browser never receives R2 credentials. */
export async function r2SignedPutUrl(key: string, contentType: string, premium: boolean) {
  const Bucket = premium ? R2_PREMIUM_BUCKET! : R2_PUBLIC_BUCKET!;
  return getSignedUrl(r2Client(), new PutObjectCommand({ Bucket, Key: key, ContentType: contentType }), { expiresIn: 300 });
}

export async function r2Delete(key: string, premium: boolean) {
  const Bucket = premium ? R2_PREMIUM_BUCKET! : R2_PUBLIC_BUCKET!;
  await r2Client().send(new DeleteObjectCommand({ Bucket, Key: key }));
}
