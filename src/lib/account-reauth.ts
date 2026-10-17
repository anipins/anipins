import crypto from "crypto";

const PROOF_TTL_MS = 5 * 60_000;

export function createGoogleReauthProof(userId: number, secret: string, now = Date.now()) {
  if (!Number.isSafeInteger(userId) || userId < 1 || secret.length < 32) {
    throw new Error("Account reauthentication is not configured.");
  }
  const payload = Buffer.from(JSON.stringify({ userId, expiresAt: now + PROOF_TTL_MS, nonce: crypto.randomBytes(24).toString("base64url") })).toString("base64url");
  const signature = crypto.createHmac("sha256", secret).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

export function verifyGoogleReauthProof(proof: string, userId: number, secret: string, now = Date.now()) {
  if (!proof || secret.length < 32) return false;
  const [payload, signature, extra] = proof.split(".");
  if (!payload || !signature || extra || !/^[A-Za-z0-9_-]+$/.test(signature)) return false;
  const expected = crypto.createHmac("sha256", secret).update(payload).digest("base64url");
  const actualBytes = Buffer.from(signature);
  const expectedBytes = Buffer.from(expected);
  if (actualBytes.length !== expectedBytes.length || !crypto.timingSafeEqual(actualBytes, expectedBytes)) return false;
  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    return parsed.userId === userId && Number.isSafeInteger(parsed.expiresAt) && parsed.expiresAt > now;
  } catch {
    return false;
  }
}
