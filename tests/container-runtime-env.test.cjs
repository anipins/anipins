const test = require("node:test");
const assert = require("node:assert/strict");
const { containerRuntimeEnvironment } = require("../cloudflare/container-runtime-env.mjs");

const keys = [
  "D1_RPC_URL",
  "D1_RPC_SECRET",
  "MEDIA_PROVIDER",
];

test("D1 runtime only forwards the active D1 and R2 configuration", () => {
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

test("runtime never forwards retired Supabase or PostgreSQL credentials", () => {
  const env = {
    DATABASE_URL: "postgres://legacy",
    D1_RPC_URL: "https://anipins.com/__internal/d1",
    D1_RPC_SECRET: "private-worker-secret",
    SUPABASE_URL: "https://legacy.supabase.co",
    SUPABASE_SERVICE_ROLE_KEY: "legacy-key",
  };
  assert.deepEqual(containerRuntimeEnvironment(env, keys), {
    D1_RPC_URL: env.D1_RPC_URL,
    D1_RPC_SECRET: env.D1_RPC_SECRET,
  });
});

test("Better Auth Google client ID overrides the retained legacy Google client for app runtime", () => {
  const actual = containerRuntimeEnvironment({
    GOOGLE_CLIENT_ID: "old-google-client.apps.googleusercontent.com",
    NEXT_PUBLIC_GOOGLE_CLIENT_ID: "old-google-client.apps.googleusercontent.com",
    BETTER_AUTH_GOOGLE_CLIENT_ID: "better-auth-client.apps.googleusercontent.com",
  }, ["GOOGLE_CLIENT_ID", "NEXT_PUBLIC_GOOGLE_CLIENT_ID"]);

  assert.deepEqual(actual, {
    GOOGLE_CLIENT_ID: "better-auth-client.apps.googleusercontent.com",
    NEXT_PUBLIC_GOOGLE_CLIENT_ID: "better-auth-client.apps.googleusercontent.com",
  });
});
