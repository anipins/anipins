const test = require("node:test");
const assert = require("node:assert/strict");

const importLimiter = () => import("../cloudflare/rate-limit.mjs");

test("edge limiter uses a host, route, and Cloudflare client IP key for protected POST routes", async () => {
  const { enforceEdgeRateLimit } = await importLimiter();
  let received;
  const response = await enforceEdgeRateLimit(new Request("https://anipins.com/api/auth/login", {
    method: "POST", headers: { "cf-connecting-ip": "203.0.113.7" },
  }), {
    AUTH_RATE_LIMITER: { limit: async input => { received = input; return { success: true }; } },
  });

  assert.equal(response, null);
  assert.deepEqual(received, { key: "anipins.com:/api/auth/login:203.0.113.7" });
});

test("edge limiter rejects denied requests without caching the error response", async () => {
  const { enforceEdgeRateLimit } = await importLimiter();
  const response = await enforceEdgeRateLimit(new Request("https://anipins.com/api/auth/register", {
    method: "POST", headers: { "cf-connecting-ip": "203.0.113.7" }, body: "{}",
  }), {
    SIGNUP_RATE_LIMITER: { limit: async () => ({ success: false }) },
  });

  assert.equal(response.status, 429);
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.equal(response.headers.get("retry-after"), "60");
});

test("edge limiter skips reads, unrelated paths, and missing bindings", async () => {
  const { enforceEdgeRateLimit } = await importLimiter();
  assert.equal(await enforceEdgeRateLimit(new Request("https://anipins.com/api/auth/login"), {}), null);
  assert.equal(await enforceEdgeRateLimit(new Request("https://anipins.com/api/auth/login", { method: "POST" }), {}), null);
  assert.equal(await enforceEdgeRateLimit(new Request("https://anipins.com/api/artworks", { method: "POST" }), {}), null);
});
