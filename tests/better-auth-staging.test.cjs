const test = require("node:test");
const assert = require("node:assert/strict");

test("staging Better Auth has a separate namespace and refuses other hosts", async () => {
  const auth = await import("../cloudflare/better-auth-staging.mjs");
  assert.equal(auth.isStagingBetterAuthRequest(new Request("https://anipins.com/__staging/auth/sign-in/email")), true);
  assert.equal(auth.isStagingBetterAuthRequest(new Request("https://anipins.com/api/auth/login")), false);
  assert.equal(auth.isStagingBetterAuthHost(new Request("https://anipins-staging.anipins01.workers.dev/")), true);
  assert.equal(auth.isStagingBetterAuthHost(new Request("https://anipins-better-auth-staging.anipins01.workers.dev/")), true);
  assert.equal(auth.isStagingBetterAuthHost(new Request("https://anipins.com/")), false);
});

test("staging Better Auth fails closed without its own D1 binding and secret", async () => {
  const auth = await import("../cloudflare/better-auth-staging.mjs");
  assert.throws(() => auth.createStagingBetterAuth({}, new Request("https://anipins-staging.anipins01.workers.dev/")), /D1 staging binding/);
  assert.throws(() => auth.createStagingBetterAuth({ DB: {}, BETTER_AUTH_SECRET: "short" }, new Request("https://anipins-staging.anipins01.workers.dev/")), /secret is not configured securely/);
});
