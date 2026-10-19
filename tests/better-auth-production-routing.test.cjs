const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const authModulePath = path.join(root, "cloudflare/production-auth.mjs");
const workerPath = path.join(root, "cloudflare/worker.mjs");
const authClientPath = path.join(root, "src/lib/better-auth-client.ts");
const legacyAuthRoutes = [
  "accounts",
  "google/client-id",
  "google/native-config",
  "google/native-nonce",
  "google/nonce",
  "google",
  "login",
  "logout",
  "me",
  "mobile-ticket/exchange",
  "mobile-ticket",
  "register",
];

function readIfPresent(filePath) {
  return fs.existsSync(filePath) ? fs.readFileSync(filePath, "utf8") : "";
}

test("production Better Auth is bound to the canonical origin, /api/better-auth, and secure same-origin cookies", () => {
  assert.equal(
    fs.existsSync(authModulePath),
    true,
    "production Better Auth needs a dedicated config module, separate from the staging-only auth config",
  );
  const productionAuth = readIfPresent(authModulePath);
  assert.match(productionAuth, /baseURL\s*:\s*["']https:\/\/anipins\.com["']/);
  assert.match(productionAuth, /basePath\s*:\s*["']\/api\/better-auth["']/);
  assert.match(productionAuth, /useSecureCookies\s*:\s*true/);
  assert.match(productionAuth, /defaultCookieAttributes\s*:[\s\S]*?path\s*:\s*["']\/["']/);
  assert.doesNotMatch(productionAuth, /domain\s*:\s*["']\.anipins\.com["']/i);

  const client = readIfPresent(authClientPath);
  assert.match(client, /NEXT_PUBLIC_BETTER_AUTH_BASE_PATH\s*\|\|\s*["']\/api\/better-auth["']/);
});

test("production Better Auth matcher is isolated from the existing /api/auth handlers", async () => {
  const worker = readIfPresent(workerPath);
  const productionAuth = readIfPresent(authModulePath);
  assert.ok(worker, "Cloudflare Worker entrypoint must remain present");
  assert.ok(productionAuth, "production auth routing module must be present");

  assert.match(productionAuth, /export\s+function\s+isProductionBetterAuthRequest\s*\(/);
  assert.match(worker, /isProductionBetterAuthRequest\(request\)/);
  assert.match(worker, /createProductionBetterAuth\(env,\s*request\)\.handler\(request\)/);

  const { isProductionBetterAuthRequest } = await import("../cloudflare/production-auth.mjs");
  assert.equal(isProductionBetterAuthRequest(new Request("https://anipins.com/api/better-auth/sign-in/email")), true);
  assert.equal(isProductionBetterAuthRequest(new Request("https://anipins.com/api/better-auth")), true);

  const legacySource = legacyAuthRoutes.map(route => {
    const routePath = path.join(root, "src/app/api/auth", route, "route.ts");
    assert.equal(fs.existsSync(routePath), true, `existing legacy auth route must remain available: ${route}`);
    return route;
  });
  for (const route of legacySource) {
    assert.equal(
      isProductionBetterAuthRequest(new Request(`https://anipins.com/api/auth/${route}`)),
      false,
      `legacy endpoint /api/auth/${route} must not be intercepted by Better Auth`,
    );
  }

  const betterAuthDispatch = worker.indexOf("createProductionBetterAuth(env, request).handler(request)");
  const legacyForwarding = worker.indexOf("target.fetch(containerAuth.request)");
  assert.ok(betterAuthDispatch >= 0, "Worker must dispatch only the Better Auth namespace to Better Auth");
  assert.ok(legacyForwarding > betterAuthDispatch, "legacy /api/auth requests must continue through the existing app forwarding path");
});

test("production Better Auth prefers its dedicated Google client ID without changing the legacy client ID", async () => {
  const { getProductionGoogleClientId } = await import("../cloudflare/production-auth.mjs");

  assert.equal(
    getProductionGoogleClientId({
      BETTER_AUTH_GOOGLE_CLIENT_ID: "better-auth-client.apps.googleusercontent.com",
      GOOGLE_CLIENT_ID: "legacy-client.apps.googleusercontent.com",
    }),
    "better-auth-client.apps.googleusercontent.com",
  );
  assert.equal(
    getProductionGoogleClientId({ GOOGLE_CLIENT_ID: "legacy-client.apps.googleusercontent.com" }),
    "legacy-client.apps.googleusercontent.com",
  );
});

test("production Google sign-in UI uses the same Google client ID as Better Auth", () => {
  const config = JSON.parse(fs.readFileSync(path.join(root, "wrangler.jsonc"), "utf8"));
  const providerClientId = config.vars.BETTER_AUTH_GOOGLE_CLIENT_ID;
  const browserClientId = config.containers[0].images.base.build_vars.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  assert.ok(providerClientId, "production Better Auth Google client ID must be configured");
  assert.equal(browserClientId, providerClientId);
});

