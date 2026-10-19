const test = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const { createAdminMfaProof, hashLegacyRecoveryCode } = require("../cloudflare/admin-mfa.mjs");

const importRoute = () => import("../cloudflare/admin-mfa-route.mjs");
const secretKey = "configured-admin-encryption-key";
const bridgeKey = "bridge-secret-with-more-than-thirty-two-characters";

function encryptLegacyTotpSecret(secret) {
  const key = crypto.createHash("sha256").update(secretKey).digest();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(secret, "utf8"), cipher.final()]);
  return [iv, cipher.getAuthTag(), encrypted].map(value => value.toString("base64url")).join(".");
}

function currentTotp(secret) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = 0, buffer = 0;
  const bytes = [];
  for (const character of secret) {
    buffer = (buffer << 5) | alphabet.indexOf(character);
    bits += 5;
    if (bits >= 8) { bytes.push((buffer >>> (bits - 8)) & 255); bits -= 8; }
  }
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(Math.floor(Date.now() / 30_000)));
  const digest = crypto.createHmac("sha1", Buffer.from(bytes)).update(counter).digest();
  const offset = digest[digest.length - 1] & 15;
  return String((digest.readUInt32BE(offset) & 0x7fffffff) % 1_000_000).padStart(6, "0");
}

function setup({ user, session = true, attempts = { attempt_count: 0, locked_until: 0 }, recoveryCodes = [] } = {}) {
  const state = { recoveryCodes, failed: 0, cleared: false };
  const sessionExpiresAt = Date.now() + 60_000;
  const sessionData = session ? {
    user: { id: "ba-admin", email: "owner@example.com", emailVerified: true },
    session: { id: "ba-session", expiresAt: new Date(sessionExpiresAt).toISOString() },
  } : null;
  const dependencies = {
    authFactory: () => ({ api: { getSession: async () => sessionData } }),
    storeFactory: () => ({
      findBusinessUserForMfa: async () => user,
      findBusinessUser: async () => user,
      findLink: async () => state.linked ? user : null,
      createLink: async () => { state.linked = true; },
      getMfaAttempts: async () => attempts,
      recordMfaFailure: async () => { state.failed += 1; },
      clearMfaAttempts: async () => { state.cleared = true; },
      replaceRecoveryCodes: async (_id, _current, next) => { state.recoveryCodes = JSON.parse(next); return true; },
    }),
  };
  return { state, dependencies, sessionExpiresAt, env: { DB: {}, ADMIN_2FA_ENCRYPTION_KEY: secretKey, D1_RPC_SECRET: bridgeKey } };
}

test("admin MFA endpoint refuses cross-origin requests and unauthenticated sessions", async () => {
  const { handleAdminMfaVerification } = await importRoute();
  const setupArgs = setup({ user: { id: 7, role: "ADMIN", two_factor_enabled: 1 } });
  const crossOrigin = await handleAdminMfaVerification(new Request("https://anipins.com/api/auth/admin-mfa", {
    method: "POST", headers: { origin: "https://attacker.example", "content-type": "application/json" }, body: JSON.stringify({ code: "123456" }),
  }), setupArgs.env, setupArgs.dependencies);
  assert.equal(crossOrigin.status, 403);

  const unauthenticated = setup({ user: { id: 7, role: "ADMIN", two_factor_enabled: 1 }, session: false });
  const response = await handleAdminMfaVerification(new Request("https://anipins.com/api/auth/admin-mfa", {
    method: "POST", headers: { origin: "https://anipins.com", "content-type": "application/json" }, body: JSON.stringify({ code: "123456" }),
  }), unauthenticated.env, unauthenticated.dependencies);
  assert.equal(response.status, 401);
});

test("valid admin TOTP sets a session-bound HttpOnly proof cookie", async () => {
  const { handleAdminMfaVerification } = await importRoute();
  const secret = "JBSWY3DPEHPK3PXP";
  const context = setup({ user: { id: 7, role: "ADMIN", two_factor_enabled: 1, two_factor_secret: encryptLegacyTotpSecret(secret), recovery_codes: "[]" } });
  const response = await handleAdminMfaVerification(new Request("https://anipins.com/api/auth/admin-mfa", {
    method: "POST", headers: { origin: "https://anipins.com", "content-type": "application/json" }, body: JSON.stringify({ code: currentTotp(secret) }),
  }), context.env, context.dependencies);

  assert.equal(response.status, 200);
  assert.match(response.headers.get("set-cookie"), /^anipins_admin_mfa=.*; Path=\/; HttpOnly; Secure; SameSite=Lax; Max-Age=/);
  assert.equal(context.state.cleared, true);
});

test("failed admin TOTP increments throttling state and never issues an MFA cookie", async () => {
  const { handleAdminMfaVerification } = await importRoute();
  const context = setup({ user: { id: 7, role: "ADMIN", two_factor_enabled: 1, two_factor_secret: encryptLegacyTotpSecret("JBSWY3DPEHPK3PXP"), recovery_codes: "[]" } });
  const response = await handleAdminMfaVerification(new Request("https://anipins.com/api/auth/admin-mfa", {
    method: "POST", headers: { origin: "https://anipins.com", "content-type": "application/json" }, body: JSON.stringify({ code: "111111" }),
  }), context.env, context.dependencies);

  assert.equal(response.status, 401);
  assert.equal(response.headers.get("set-cookie"), null);
  assert.equal(context.state.failed, 1);
});

test("profile lookup withholds the admin role until its session-bound MFA proof exists", async () => {
  const { handleBetterAuthProfile } = await importRoute();
  const context = setup({ user: { id: 7, email: "owner@example.com", role: "ADMIN", two_factor_enabled: 1 } });
  const makeRequest = cookie => new Request("https://anipins.com/api/auth/me", {
    headers: { cookie: `anipins_better_auth=valid${cookie ? `; anipins_admin_mfa=${cookie}` : ""}` },
  });

  const required = await handleBetterAuthProfile(makeRequest(""), context.env, context.dependencies);
  assert.deepEqual(await required.json(), { user: null, requiresTwoFactor: true });
  assert.equal(context.state.linked, undefined);

  const proof = await createAdminMfaProof({ sessionId: "ba-session", userId: 7, expiresAt: context.sessionExpiresAt }, context.env.D1_RPC_SECRET);
  const allowed = await handleBetterAuthProfile(makeRequest(proof), context.env, context.dependencies);
  assert.deepEqual(await allowed.json(), { user: { id: 7, email: "owner@example.com", role: "ADMIN" } });
  assert.equal(context.state.linked, true);
});

test("verified admin MFA proof is honored on protected app requests after sign-in", async () => {
  const { resolveBetterAuthIdentity } = await importRoute();
  const context = setup({ user: { id: 7, email: "owner@example.com", role: "ADMIN", two_factor_enabled: 1 } });
  const proof = await createAdminMfaProof({
    sessionId: "ba-session",
    userId: 7,
    expiresAt: context.sessionExpiresAt,
  }, context.env.D1_RPC_SECRET);
  const unverifiedRequest = new Request("https://anipins.com/admin", {
    headers: { cookie: "anipins_better_auth=valid" },
  });
  const unverifiedIdentity = await resolveBetterAuthIdentity(unverifiedRequest, context.env, context.dependencies);
  assert.equal(unverifiedIdentity, null);
  assert.equal(context.state.linked, undefined);

  const request = new Request("https://anipins.com/admin", {
    headers: { cookie: `anipins_better_auth=valid; anipins_admin_mfa=${proof}` },
  });

  const identity = await resolveBetterAuthIdentity(request, context.env, context.dependencies);

  assert.deepEqual(identity, { userId: 7 });
});

test("admin lockout blocks further guesses and a recovery code is consumed once", async () => {
  const { handleAdminMfaVerification } = await importRoute();
  const locked = setup({ user: { id: 7, role: "ADMIN", two_factor_enabled: 1 }, attempts: { attempt_count: 5, locked_until: Date.now() + 60_000 } });
  const lockedResponse = await handleAdminMfaVerification(new Request("https://anipins.com/api/auth/admin-mfa", {
    method: "POST", headers: { origin: "https://anipins.com", "content-type": "application/json" }, body: JSON.stringify({ code: "111111" }),
  }), locked.env, locked.dependencies);
  assert.equal(lockedResponse.status, 429);
  assert.equal(locked.state.failed, 0);

  const recoveryHash = await hashLegacyRecoveryCode("ABCDEF-123456");
  const recovery = setup({ user: { id: 7, role: "ADMIN", two_factor_enabled: 1, two_factor_secret: "", recovery_codes: JSON.stringify([recoveryHash]) } });
  const recoveryResponse = await handleAdminMfaVerification(new Request("https://anipins.com/api/auth/admin-mfa", {
    method: "POST", headers: { origin: "https://anipins.com", "content-type": "application/json" }, body: JSON.stringify({ code: "ABCDEF-123456" }),
  }), recovery.env, recovery.dependencies);
  assert.equal(recoveryResponse.status, 200);
  assert.deepEqual(recovery.state.recoveryCodes, []);
});
