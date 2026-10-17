const test = require("node:test");
const assert = require("node:assert/strict");
const { webcrypto } = require("node:crypto");
const { handleD1RpcRequest } = require("../cloudflare/d1-rpc.mjs");
const { callD1Rpc } = require("../cloudflare/d1-rpc-client.mjs");

const secret = "test-only-d1-rpc-secret-with-enough-entropy";

async function signedRequest(payload, { timestamp = Date.now(), secretOverride = secret } = {}) {
  const body = JSON.stringify(payload);
  const digest = Buffer.from(await webcrypto.subtle.digest("SHA-256", Buffer.from(body))).toString("hex");
  const key = await webcrypto.subtle.importKey("raw", Buffer.from(secretOverride), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signature = Buffer.from(await webcrypto.subtle.sign("HMAC", key, Buffer.from(`${timestamp}.${digest}`))).toString("base64url");
  return new Request("https://anipins.com/__internal/d1", {
    method: "POST",
    headers: { "content-type": "application/json", "x-anipins-d1-time": String(timestamp), "x-anipins-d1-signature": signature },
    body,
  });
}

function fakeEnv() {
  const calls = [];
  return {
    calls,
    env: {
      D1_RPC_SECRET: secret,
      DB: {
        prepare(sql) {
          return {
            bind(...params) {
              return {
                async all() { calls.push({ operation: "all", sql, params }); return { results: [{ id: 7 }] }; },
                async first() { calls.push({ operation: "first", sql, params }); return { id: 7 }; },
                async run() { calls.push({ operation: "run", sql, params }); return { success: true, meta: { changes: 1 } }; },
              };
            },
          };
        },
      },
    },
  };
}

test("D1 RPC runs a bound read only after verifying the signed request", async () => {
  const { env, calls } = fakeEnv();
  const request = await signedRequest({ operation: "all", sql: "SELECT * FROM users WHERE email=?", params: ["member@example.com"] });
  const response = await handleD1RpcRequest(request, env, { now: Date.now() });

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { results: [{ id: 7 }] });
  assert.deepEqual(calls, [{ operation: "all", sql: "SELECT * FROM users WHERE email=?", params: ["member@example.com"] }]);
});

test("D1 RPC rejects missing or invalid signatures without touching D1", async () => {
  const { env, calls } = fakeEnv();
  const request = new Request("https://anipins.com/__internal/d1", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ operation: "run", sql: "DELETE FROM users", params: [] }) });
  const response = await handleD1RpcRequest(request, env, { now: Date.now() });

  assert.equal(response.status, 401);
  assert.equal(calls.length, 0);
});

test("D1 RPC rejects stale signatures and malformed or oversized statements", async () => {
  const { env, calls } = fakeEnv();
  const old = await signedRequest({ operation: "run", sql: "DELETE FROM sessions", params: [] }, { timestamp: Date.now() - 60_000 });
  const staleResponse = await handleD1RpcRequest(old, env, { now: Date.now() });
  assert.equal(staleResponse.status, 401);

  const malformed = await signedRequest({ operation: "exec", sql: "DROP TABLE users", params: [] });
  const malformedResponse = await handleD1RpcRequest(malformed, env, { now: Date.now() });
  assert.equal(malformedResponse.status, 400);

  const oversized = await signedRequest({ operation: "run", sql: "x".repeat(20_000), params: [] });
  const oversizedResponse = await handleD1RpcRequest(oversized, env, { now: Date.now() });
  assert.equal(oversizedResponse.status, 413);
  assert.equal(calls.length, 0);
});

test("D1 RPC supports single-row reads and writes", async () => {
  const { env, calls } = fakeEnv();
  const first = await handleD1RpcRequest(await signedRequest({ operation: "first", sql: "SELECT id FROM users WHERE id=?", params: [7] }), env, { now: Date.now() });
  const run = await handleD1RpcRequest(await signedRequest({ operation: "run", sql: "UPDATE users SET name=? WHERE id=?", params: ["Private Name", 7] }), env, { now: Date.now() });

  assert.deepEqual(await first.json(), { id: 7 });
  assert.deepEqual(await run.json(), { success: true, meta: { changes: 1 } });
  assert.equal(calls.length, 2);
});

test("the Container client and Worker bridge authenticate and execute the same request format", async () => {
  const { env, calls } = fakeEnv();
  const result = await callD1Rpc({
    url: "https://anipins.com/__internal/d1",
    secret,
    operation: "all",
    sql: "SELECT id FROM users WHERE role=?",
    params: ["ADMIN"],
    now: Date.now(),
    fetchImpl: async (url, init) => handleD1RpcRequest(new Request(url, init), env, { now: Date.now() }),
  });

  assert.deepEqual(result, { results: [{ id: 7 }] });
  assert.equal(calls.length, 1);
});

test("the Container client refuses insecure remote URLs and undersized secrets", async () => {
  await assert.rejects(() => callD1Rpc({ url: "http://example.com/__internal/d1", secret, operation: "all", sql: "SELECT 1" }), /HTTPS/);
  await assert.rejects(() => callD1Rpc({ url: "https://anipins.com/__internal/d1", secret: "short", operation: "all", sql: "SELECT 1" }), /not configured securely/);
});
