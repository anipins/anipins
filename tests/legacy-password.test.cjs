const test = require("node:test");
const assert = require("node:assert/strict");
const bcrypt = require("bcryptjs");
const betterAuthCrypto = require("better-auth/crypto");

test("Better Auth password verifier accepts existing AniPins bcrypt hashes", async () => {
  const { verifyLegacyCompatiblePassword } = await import("../cloudflare/legacy-password.mjs");
  const hash = bcrypt.hashSync("existing-password", 4);

  assert.equal(await verifyLegacyCompatiblePassword({ password: "existing-password", hash }), true);
  assert.equal(await verifyLegacyCompatiblePassword({ password: "wrong-password", hash }), false);
});

test("Better Auth password verifier retains support for its existing native hashes", async () => {
  const { verifyLegacyCompatiblePassword } = await import("../cloudflare/legacy-password.mjs");
  const password = "staging-password";
  const hash = await betterAuthCrypto.hashPassword(password);

  assert.equal(await verifyLegacyCompatiblePassword({ password, hash }), true);
  assert.equal(await verifyLegacyCompatiblePassword({ password: "wrong-password", hash }), false);
});

test("legacy-compatible Better Auth hashing creates bcrypt hashes for AniPins parity", async () => {
  const { hashCompatiblePassword, verifyLegacyCompatiblePassword } = await import("../cloudflare/legacy-password.mjs");
  const hash = await hashCompatiblePassword("new-password");

  assert.match(hash, /^\$2[aby]\$/);
  assert.equal(await verifyLegacyCompatiblePassword({ password: "new-password", hash }), true);
});
