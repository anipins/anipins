const CONTEXT_HEADER = "x-anipins-auth-context";
const SIGNATURE_HEADER = "x-anipins-auth-signature";
const DOMAIN = "anipins-app-identity-v1:";
const MAX_AGE_MS = 30_000;

function validSecret(secret) {
  return typeof secret === "string" && new TextEncoder().encode(secret).byteLength >= 32;
}

function encodeBase64Url(bytes) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function decodeBase64Url(value) {
  if (!/^[A-Za-z0-9_-]+$/.test(value)) return null;
  try {
    const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
    const binary = atob(normalized + "=".repeat((4 - normalized.length % 4) % 4));
    return Uint8Array.from(binary, (character) => character.charCodeAt(0));
  } catch {
    return null;
  }
}

async function importKey(secret, usage) {
  return crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, [usage]);
}

export async function createAuthAssertion(identity, secret, now = Date.now()) {
  if (!validSecret(secret)) throw new Error("Auth assertion secret is not configured securely");
  if (!Number.isSafeInteger(identity?.userId) || identity.userId <= 0) throw new Error("A valid AniPins user ID is required");
  if (!Number.isSafeInteger(now) || now <= 0) throw new Error("A valid assertion timestamp is required");
  const context = encodeBase64Url(new TextEncoder().encode(`${now}.${identity.userId}`));
  const key = await importKey(secret, "sign");
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${DOMAIN}${context}`));
  return new Headers({ [CONTEXT_HEADER]: context, [SIGNATURE_HEADER]: encodeBase64Url(new Uint8Array(signature)) });
}

export async function readAuthAssertion(headers, secret, now = Date.now()) {
  if (!validSecret(secret) || !Number.isSafeInteger(now)) return null;
  const context = headers?.get?.(CONTEXT_HEADER);
  const signature = headers?.get?.(SIGNATURE_HEADER);
  if (!context || !signature) return null;
  const contextBytes = decodeBase64Url(context);
  const signatureBytes = decodeBase64Url(signature);
  if (!contextBytes || !signatureBytes) return null;
  let payload;
  try { payload = new TextDecoder("utf-8", { fatal: true }).decode(contextBytes); } catch { return null; }
  const match = /^(\d{13})\.([1-9]\d*)$/.exec(payload);
  if (!match) return null;
  const issuedAt = Number(match[1]);
  const userId = Number(match[2]);
  if (!Number.isSafeInteger(issuedAt) || !Number.isSafeInteger(userId) || userId <= 0) return null;
  if (issuedAt > now + 5_000 || now - issuedAt > MAX_AGE_MS) return null;
  try {
    const key = await importKey(secret, "verify");
    const valid = await crypto.subtle.verify("HMAC", key, signatureBytes, new TextEncoder().encode(`${DOMAIN}${context}`));
    return valid ? { userId, issuedAt } : null;
  } catch { return null; }
}
