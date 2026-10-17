const test = require("node:test");
const assert = require("node:assert/strict");

const { createAuthAssertion, readAuthAssertion } = require("../cloudflare/auth-assertion.mjs");

const secret = "staging-only-auth-assertion-secret-32chars";

test("Worker can sign a short-lived numeric AniPins identity for the Container", async () => {
  const headers = await createAuthAssertion({ userId: 42, role: "ADMIN" }, secret, 1_800_000_000_000);
  const result = await readAuthAssertion(headers, secret, 1_800_000_000_001);

  assert.deepEqual(result, { userId: 42, issuedAt: 1_800_000_000_000 });
});

test("identity assertion never carries an authorization role", async () => {
  const headers = await createAuthAssertion({ userId: 8, role: "ADMIN" }, secret, 1_800_000_000_000);
  const encoded = headers.get("x-anipins-auth-context");

  assert.equal(Buffer.from(encoded, "base64url").toString("utf8"), "1800000000000.8");
  assert.equal(headers.has("x-anipins-auth-role"), false);
});

test("tampered or replay-expired assertions fail closed", async () => {
  const headers = await createAuthAssertion({ userId: 9 }, secret, 1_800_000_000_000);
  headers.set("x-anipins-auth-context", "1800000000000.10");
  assert.equal(await readAuthAssertion(headers, secret, 1_800_000_000_001), null);

  const stale = await createAuthAssertion({ userId: 9 }, secret, 1_800_000_000_000);
  assert.equal(await readAuthAssertion(stale, secret, 1_800_000_030_001), null);
});

test("assertions reject invalid identities and undersized secrets", async () => {
  await assert.rejects(() => createAuthAssertion({ userId: 0 }, secret), /valid AniPins user ID/);
  await assert.rejects(() => createAuthAssertion({ userId: 1 }, "short"), /secret is not configured securely/);
  assert.equal(await readAuthAssertion(new Headers(), secret), null);
});
