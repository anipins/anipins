const BASE32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
const encoder = new TextEncoder();

function decodeBase64Url(value) {
  const normalized = String(value || "").replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(normalized + "=".repeat((4 - normalized.length % 4) % 4));
  return Uint8Array.from(binary, character => character.charCodeAt(0));
}

function encodeBase64Url(value) {
  let binary = "";
  for (const byte of value) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function decodeBase32(value) {
  let bits = 0;
  let buffer = 0;
  const bytes = [];
  for (const character of String(value || "").replace(/=|\s/g, "").toUpperCase()) {
    const index = BASE32.indexOf(character);
    if (index < 0) throw new TypeError("Invalid base32 secret.");
    buffer = (buffer << 5) | index;
    bits += 5;
    if (bits >= 8) {
      bytes.push((buffer >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  if (bytes.length < 10) throw new TypeError("Invalid base32 secret.");
  return new Uint8Array(bytes);
}

function constantTimeEqual(left, right) {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  return difference === 0;
}

export async function decryptLegacySecret(encrypted, keySource) {
  if (typeof keySource !== "string" || keySource.length < 12) throw new TypeError("Admin security encryption key is not configured.");
  const parts = String(encrypted || "").split(".");
  if (parts.length !== 3) throw new TypeError("Encrypted admin secret is invalid.");
  const [iv, tag, ciphertext] = parts.map(decodeBase64Url);
  if (iv.length !== 12 || tag.length !== 16 || ciphertext.length === 0) throw new TypeError("Encrypted admin secret is invalid.");
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(keySource));
  const key = await crypto.subtle.importKey("raw", digest, { name: "AES-GCM" }, false, ["decrypt"]);
  const combined = new Uint8Array(ciphertext.length + tag.length);
  combined.set(ciphertext);
  combined.set(tag, ciphertext.length);
  const plaintext = await crypto.subtle.decrypt({ name: "AES-GCM", iv, tagLength: 128 }, key, combined);
  return new TextDecoder().decode(plaintext);
}

export async function encryptLegacySecret(value, keySource) {
  if (typeof keySource !== "string" || keySource.length < 12) throw new TypeError("Admin security encryption key is not configured.");
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(keySource));
  const key = await crypto.subtle.importKey("raw", digest, { name: "AES-GCM" }, false, ["encrypt"]);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv, tagLength: 128 }, key, encoder.encode(String(value))));
  const ciphertext = encrypted.slice(0, -16);
  const tag = encrypted.slice(-16);
  return [iv, tag, ciphertext].map(encodeBase64Url).join(".");
}

export function generateLegacyTotpSecret() {
  const bytes = crypto.getRandomValues(new Uint8Array(20));
  let bits = 0;
  let buffer = 0;
  let output = "";
  for (const byte of bytes) {
    buffer = (buffer << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      output += BASE32[(buffer >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits) output += BASE32[(buffer << (5 - bits)) & 31];
  return output;
}

export function createLegacyRecoveryCodes() {
  return Array.from({ length: 8 }, () => {
    const bytes = crypto.getRandomValues(new Uint8Array(6));
    const hex = [...bytes].map(byte => byte.toString(16).padStart(2, "0")).join("").toUpperCase();
    return `${hex.slice(0, 6)}-${hex.slice(6)}`;
  });
}

async function digestHex(value) {
  return [...new Uint8Array(await crypto.subtle.digest("SHA-256", encoder.encode(value)))]
    .map(byte => byte.toString(16).padStart(2, "0")).join("");
}

export async function createAdminMfaRecoveryProof(claims, secret, pendingSecret, now = Date.now()) {
  const sessionId = String(claims?.sessionId || "");
  const userId = Number(claims?.userId);
  const expiresAt = Math.min(Number(claims?.expiresAt), now + 10 * 60_000);
  if (!sessionId || sessionId.length > 256 || !Number.isSafeInteger(userId) || userId < 1 || !Number.isSafeInteger(expiresAt) || expiresAt <= now || typeof secret !== "string" || secret.length < 32 || typeof pendingSecret !== "string" || !pendingSecret) {
    throw new TypeError("Valid authenticated session, bridge secret, and pending authenticator are required.");
  }
  const payload = encodeBase64Url(encoder.encode(JSON.stringify({ sessionId, userId, expiresAt, pendingDigest: await digestHex(pendingSecret) })));
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signature = encodeBase64Url(new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode(payload))));
  return `${payload}.${signature}`;
}

export async function verifyAdminMfaRecoveryProof(proof, expected, secret, pendingSecret, now = Date.now()) {
  try {
    if (typeof secret !== "string" || secret.length < 32 || typeof pendingSecret !== "string" || !pendingSecret) return false;
    const [payload, signature, extra] = String(proof || "").split(".");
    if (!payload || !signature || extra !== undefined) return false;
    const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["verify"]);
    if (!await crypto.subtle.verify("HMAC", key, decodeBase64Url(signature), encoder.encode(payload))) return false;
    const claims = JSON.parse(new TextDecoder().decode(decodeBase64Url(payload)));
    return claims.sessionId === String(expected?.sessionId || "")
      && Number(claims.userId) === Number(expected?.userId)
      && Number.isSafeInteger(claims.expiresAt)
      && claims.expiresAt > now
      && claims.expiresAt <= now + 10 * 60_000
      && claims.pendingDigest === await digestHex(pendingSecret);
  } catch {
    return false;
  }
}

async function totpValue(secret, timeStep) {
  const key = await crypto.subtle.importKey("raw", decodeBase32(secret), { name: "HMAC", hash: "SHA-1" }, false, ["sign"]);
  const counter = new Uint8Array(8);
  let value = BigInt(timeStep);
  for (let index = 7; index >= 0; index -= 1) {
    counter[index] = Number(value & 255n);
    value >>= 8n;
  }
  const digest = new Uint8Array(await crypto.subtle.sign("HMAC", key, counter));
  const offset = digest[digest.length - 1] & 15;
  const binary = ((digest[offset] & 127) << 24) | (digest[offset + 1] << 16) | (digest[offset + 2] << 8) | digest[offset + 3];
  return String(binary % 1_000_000).padStart(6, "0");
}

export async function verifyLegacyTotp(secret, code, now = Date.now()) {
  const cleaned = String(code || "").replace(/\s/g, "");
  if (!/^\d{6}$/.test(cleaned) || !Number.isFinite(now)) return false;
  const step = Math.floor(now / 30_000);
  for (const offset of [-1, 0, 1]) {
    if (constantTimeEqual(await totpValue(secret, step + offset), cleaned)) return true;
  }
  return false;
}

export async function hashLegacyRecoveryCode(code) {
  const normalized = String(code || "").replace(/[\s-]/g, "").toUpperCase();
  if (!/^[A-F0-9]{12}$/.test(normalized)) return "";
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(normalized));
  return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, "0")).join("");
}

export async function createAdminMfaProof(claims, secret, now = Date.now()) {
  const sessionId = String(claims?.sessionId || "");
  const userId = Number(claims?.userId);
  const expiresAt = Number(claims?.expiresAt);
  if (!sessionId || sessionId.length > 256 || !Number.isSafeInteger(userId) || userId < 1 || !Number.isSafeInteger(expiresAt) || expiresAt <= now || typeof secret !== "string" || secret.length < 32) {
    throw new TypeError("Valid authenticated session and bridge secret are required.");
  }
  const payload = encodeBase64Url(encoder.encode(JSON.stringify({ sessionId, userId, expiresAt })));
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signature = encodeBase64Url(new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode(payload))));
  return `${payload}.${signature}`;
}

export async function verifyAdminMfaProof(proof, expected, secret, now = Date.now()) {
  try {
    if (typeof secret !== "string" || secret.length < 32) return false;
    const [payload, signature, extra] = String(proof || "").split(".");
    if (!payload || !signature || extra !== undefined) return false;
    const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["verify"]);
    if (!await crypto.subtle.verify("HMAC", key, decodeBase64Url(signature), encoder.encode(payload))) return false;
    const claims = JSON.parse(new TextDecoder().decode(decodeBase64Url(payload)));
    return claims.sessionId === String(expected?.sessionId || "")
      && Number(claims.userId) === Number(expected?.userId)
      && Number.isSafeInteger(claims.expiresAt)
      && claims.expiresAt === Number(expected?.expiresAt)
      && claims.expiresAt > now;
  } catch {
    return false;
  }
}
