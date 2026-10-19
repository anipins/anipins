const test = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("node:crypto");

const importMfa = () => import("../cloudflare/admin-mfa.mjs");

function encryptLegacyTotpSecret(secret, keySource) {
  const key = crypto.createHash("sha256").update(keySource).digest();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([cipher.update(secret, "utf8"), cipher.final()]);
  return [iv, cipher.getAuthTag(), ciphertext].map(value => value.toString("base64url")).join(".");
}

function totpAt(secret, timestamp) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = 0, value = 0;
  const bytes = [];
  for (const character of secret) {
    value = (value << 5) | alphabet.indexOf(character);
    bits += 5;
    if (bits >= 8) { bytes.push((value >>> (bits - 8)) & 255); bits -= 8; }
  }
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(Math.floor(timestamp / 30_000)));
  const digest = crypto.createHmac("sha1", Buffer.from(bytes)).update(counter).digest();
  const offset = digest[digest.length - 1] & 15;
  return String((digest.readUInt32BE(offset) & 0x7fffffff) % 1_000_000).padStart(6, "0");
}

test("legacy admin TOTP verification accepts the current six-digit code and rejects invalid codes", async () => {
  const { verifyLegacyTotp } = await importMfa();
  const secret = "JBSWY3DPEHPK3PXP";
  const now = 1_800_000_000_000;

  assert.equal(await verifyLegacyTotp(secret, totpAt(secret, now), now), true);
  assert.equal(await verifyLegacyTotp(secret, "00000x", now), false);
  assert.equal(await verifyLegacyTotp(secret, "111111", now), false);
});

test("legacy encrypted admin TOTP secrets can be decrypted only with the configured encryption key", async () => {
  const { decryptLegacySecret } = await importMfa();
  const encrypted = encryptLegacyTotpSecret("JBSWY3DPEHPK3PXP", "configured-admin-key-123");

  assert.equal(await decryptLegacySecret(encrypted, "configured-admin-key-123"), "JBSWY3DPEHPK3PXP");
  await assert.rejects(decryptLegacySecret(encrypted, "a-different-admin-key"));
});

test("admin MFA session proof is bound to one Better Auth session and expires", async () => {
  const { createAdminMfaProof, verifyAdminMfaProof } = await importMfa();
  const claims = { sessionId: "ba-session-7", userId: 41, expiresAt: 1_800_000_030_000 };
  const secret = "bridge-secret-long-enough-with-32-characters";
  const proof = await createAdminMfaProof(claims, secret, 1_800_000_000_000);

  assert.equal(await verifyAdminMfaProof(proof, claims, secret, 1_800_000_000_001), true);
  assert.equal(await verifyAdminMfaProof(proof, { ...claims, sessionId: "other-session" }, secret, 1_800_000_000_001), false);
  assert.equal(await verifyAdminMfaProof(proof, claims, secret, claims.expiresAt), false);
  assert.equal(await verifyAdminMfaProof(proof, claims, "wrong-bridge-secret-with-at-least-32-chars", 1_800_000_000_001), false);
});
