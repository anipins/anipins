const test = require("node:test");
const assert = require("node:assert/strict");
const { prepareContainerAuthRequest } = require("../cloudflare/auth-request-bridge.mjs");

const secret = "staging-only-auth-assertion-secret-32chars";

test("only a Better Auth session gets a signed assertion for the Container", async () => {
  const request = new Request("https://anipins-staging.anipins01.workers.dev/api/me", {
    headers: { cookie: "anipins_staging_better_auth=valid-session", "x-anipins-auth-context": "forged", "x-anipins-auth-role": "ADMIN" },
  });
  const result = await prepareContainerAuthRequest(request, {
    secret,
    now: 1_800_000_000_000,
    resolveIdentity: async cookie => cookie === "valid-session" ? { userId: 42 } : null,
  });
  assert.equal(result.authenticated, true);
  assert.equal(result.request.headers.get("x-anipins-auth-role"), null);
  assert.equal(result.request.headers.get("x-anipins-auth-context") === "forged", false);
  assert.match(result.request.headers.get("x-anipins-auth-context"), /^[A-Za-z0-9_-]+$/);
});

test("forged assertions are removed when no valid staging session exists", async () => {
  const request = new Request("https://anipins-staging.anipins01.workers.dev/api/me", {
    headers: { "x-anipins-auth-context": "forged", "x-anipins-auth-signature": "forged", "x-anipins-auth-role": "ADMIN" },
  });
  const result = await prepareContainerAuthRequest(request, { secret, resolveIdentity: async () => null });
  assert.equal(result.authenticated, false);
  assert.equal(result.request.headers.has("x-anipins-auth-context"), false);
  assert.equal(result.request.headers.has("x-anipins-auth-signature"), false);
  assert.equal(result.request.headers.has("x-anipins-auth-role"), false);
});

test("unverified or invalid users remain anonymous", async () => {
  const request = new Request("https://anipins-staging.anipins01.workers.dev/api/me", {
    headers: { cookie: "other=value; anipins_staging_better_auth=session" },
  });
  const result = await prepareContainerAuthRequest(request, { secret, resolveIdentity: async () => ({ userId: 0 }) });
  assert.equal(result.authenticated, false);
  assert.equal(result.request.headers.has("x-anipins-auth-context"), false);
});
