const test = require("node:test");
const assert = require("node:assert/strict");
const { containerRuntimeEnvironment } = require("../cloudflare/container-runtime-env.mjs");

const keys = [
  "DATABASE_URL",
  "D1_RPC_URL",
  "D1_RPC_SECRET",
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "NEXT_PUBLIC_SUPABASE_URL",
  "MEDIA_PROVIDER",
];

test("D1 runtime omits Postgres and Supabase credentials so the app cannot select its legacy data path", () => {
  const actual = containerRuntimeEnvironment({
    DATABASE_URL: "postgres://must-not-forward",
    D1_RPC_URL: "https://anipins.com/__internal/d1",
    D1_RPC_SECRET: "private-worker-secret",
    SUPABASE_URL: "https://must-not-forward.supabase.co",
    SUPABASE_SERVICE_ROLE_KEY: "must-not-forward",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "must-not-forward",
    NEXT_PUBLIC_SUPABASE_URL: "https://must-not-forward.supabase.co",
    MEDIA_PROVIDER: "r2",
  }, keys);

  assert.deepEqual(actual, {
    D1_RPC_URL: "https://anipins.com/__internal/d1",
    D1_RPC_SECRET: "private-worker-secret",
    MEDIA_PROVIDER: "r2",
  });
});

test("legacy runtime keeps its configured PostgreSQL and Supabase variables unchanged", () => {
  const env = {
    DATABASE_URL: "postgres://legacy",
    SUPABASE_URL: "https://legacy.supabase.co",
    SUPABASE_SERVICE_ROLE_KEY: "legacy-key",
  };
  assert.deepEqual(containerRuntimeEnvironment(env, keys), env);
});
