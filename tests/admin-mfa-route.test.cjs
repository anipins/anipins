const test = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const { createAdminMfaProof, decryptLegacySecret, hashLegacyRecoveryCode } = require("../cloudflare/admin-mfa.mjs");

const importRoute = () => import("../cloudflare/admin-mfa-route.mjs");
const secretKey = "configured-admin-encryption-key";
const bridgeKey = "bridge-secret-with-more-than-thirty-two-characters";

function encryptLegacyTotpSecret(secret, keySource = secretKey) {
  const key = crypto.createHash("sha256").update(keySource).digest();
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
    user: { id: "ba-admin", email: "anipins01@gmail.com", emailVerified: true },
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
  const setupArgs = setup({ user: { id: 7, email: "anipins01@gmail.com", role: "ADMIN", two_factor_enabled: 1 } });
  const crossOrigin = await handleAdminMfaVerification(new Request("https://anipins.com/api/auth/admin-mfa", {
    method: "POST", headers: { origin: "https://attacker.example", "content-type": "application/json" }, body: JSON.stringify({ code: "123456" }),
  }), setupArgs.env, setupArgs.dependencies);
  assert.equal(crossOrigin.status, 403);

  const unauthenticated = setup({ user: { id: 7, email: "anipins01@gmail.com", role: "ADMIN", two_factor_enabled: 1 }, session: false });
  const response = await handleAdminMfaVerification(new Request("https://anipins.com/api/auth/admin-mfa", {
    method: "POST", headers: { origin: "https://anipins.com", "content-type": "application/json" }, body: JSON.stringify({ code: "123456" }),
  }), unauthenticated.env, unauthenticated.dependencies);
  assert.equal(response.status, 401);
});

test("admin MFA endpoints do not treat another ADMIN role as the site owner", async () => {
  const { handleAdminMfaVerification } = await importRoute();
  const context = setup({ user: { id: 7, email: "other@example.com", role: "ADMIN", two_factor_enabled: 1 } });
  const response = await handleAdminMfaVerification(new Request("https://anipins.com/api/auth/admin-mfa", {
    method: "POST", headers: { origin: "https://anipins.com", "content-type": "application/json" }, body: JSON.stringify({ code: "123456" }),
  }), context.env, context.dependencies);

  assert.equal(response.status, 403);
  assert.equal(context.state.failed, 0);
});

test("valid admin TOTP sets a session-bound HttpOnly proof cookie", async () => {
  const { handleAdminMfaVerification } = await importRoute();
  const secret = "JBSWY3DPEHPK3PXP";
  const context = setup({ user: { id: 7, email: "anipins01@gmail.com", role: "ADMIN", two_factor_enabled: 1, two_factor_secret: encryptLegacyTotpSecret(secret), recovery_codes: "[]" } });
  const response = await handleAdminMfaVerification(new Request("https://anipins.com/api/auth/admin-mfa", {
    method: "POST", headers: { origin: "https://anipins.com", "content-type": "application/json" }, body: JSON.stringify({ code: currentTotp(secret) }),
  }), context.env, context.dependencies);

  assert.equal(response.status, 200);
  assert.match(response.headers.get("set-cookie"), /^anipins_admin_mfa=.*; Path=\/; HttpOnly; Secure; SameSite=Lax; Max-Age=/);
  assert.equal(context.state.cleared, true);
});

test("admin TOTP remains verifiable when its legacy encryption key is the admin password", async () => {
  const { handleAdminMfaVerification } = await importRoute();
  const secret = "JBSWY3DPEHPK3PXP";
  const context = setup({ user: { id: 7, email: "anipins01@gmail.com", role: "ADMIN", two_factor_enabled: 1, two_factor_secret: encryptLegacyTotpSecret(secret, secretKey), recovery_codes: "[]" } });
  context.env.ADMIN_2FA_ENCRYPTION_KEY = "a-new-dedicated-key-that-did-not-encrypt-the-existing-secret";
  context.env.ADMIN_PASSWORD = secretKey;
  const response = await handleAdminMfaVerification(new Request("https://anipins.com/api/auth/admin-mfa", {
    method: "POST", headers: { origin: "https://anipins.com", "content-type": "application/json" }, body: JSON.stringify({ code: currentTotp(secret) }),
  }), context.env, context.dependencies);

  assert.equal(response.status, 200);
  assert.match(response.headers.get("set-cookie"), /^anipins_admin_mfa=/);
});

test("admin recovery code remains usable when the legacy TOTP encryption key is unavailable", async () => {
  const { handleAdminMfaVerification } = await importRoute();
  const recoveryHash = await hashLegacyRecoveryCode("ABCDEF-123456");
  const context = setup({ user: {
    id: 7, email: "anipins01@gmail.com", role: "ADMIN", two_factor_enabled: 1,
    two_factor_secret: encryptLegacyTotpSecret("JBSWY3DPEHPK3PXP", "old-encryption-key-no-longer-configured"),
    recovery_codes: JSON.stringify([recoveryHash]),
  } });
  const response = await handleAdminMfaVerification(new Request("https://anipins.com/api/auth/admin-mfa", {
    method: "POST", headers: { origin: "https://anipins.com", "content-type": "application/json" }, body: JSON.stringify({ code: "ABCDEF-123456" }),
  }), context.env, context.dependencies);

  assert.equal(response.status, 200);
  assert.match(response.headers.get("set-cookie"), /^anipins_admin_mfa=/);
  assert.deepEqual(context.state.recoveryCodes, []);
});

test("admin MFA failures expose only a safe stage and error type to diagnostics", async () => {
  const { handleAdminMfaVerification } = await importRoute();
  const admin = {
    id: 7, email: "anipins01@gmail.com", role: "ADMIN", two_factor_enabled: 1,
    two_factor_secret: encryptLegacyTotpSecret("JBSWY3DPEHPK3PXP"), recovery_codes: "[]",
  };
  const context = setup({ user: admin });
  context.dependencies.storeFactory = () => ({
    findBusinessUserForMfa: async () => admin,
    getMfaAttempts: async () => { throw new Error("private database details"); },
  });
  const diagnostics = [];
  context.dependencies.onError = event => diagnostics.push(event);
  const response = await handleAdminMfaVerification(new Request("https://anipins.com/api/auth/admin-mfa", {
    method: "POST", headers: { origin: "https://anipins.com", "content-type": "application/json" }, body: JSON.stringify({ code: "123456" }),
  }), context.env, context.dependencies);

  assert.equal(response.status, 503);
  assert.deepEqual(diagnostics, [{ stage: "mfa_attempt_lookup", errorName: "Error" }]);
  assert.equal(JSON.stringify(diagnostics).includes("JBSWY3DPEHPK3PXP"), false);
  assert.equal(JSON.stringify(diagnostics).includes("private database details"), false);
});

test("failed admin TOTP increments throttling state and never issues an MFA cookie", async () => {
  const { handleAdminMfaVerification } = await importRoute();
  const context = setup({ user: { id: 7, email: "anipins01@gmail.com", role: "ADMIN", two_factor_enabled: 1, two_factor_secret: encryptLegacyTotpSecret("JBSWY3DPEHPK3PXP"), recovery_codes: "[]" } });
  const response = await handleAdminMfaVerification(new Request("https://anipins.com/api/auth/admin-mfa", {
    method: "POST", headers: { origin: "https://anipins.com", "content-type": "application/json" }, body: JSON.stringify({ code: "111111" }),
  }), context.env, context.dependencies);

  assert.equal(response.status, 401);
  assert.equal(response.headers.get("set-cookie"), null);
  assert.equal(context.state.failed, 1);
});

test("profile lookup withholds the admin role until its session-bound MFA proof exists", async () => {
  const { handleBetterAuthProfile } = await importRoute();
  const context = setup({ user: { id: 7, email: "anipins01@gmail.com", role: "ADMIN", two_factor_enabled: 1 } });
  const makeRequest = cookie => new Request("https://anipins.com/api/auth/me", {
    headers: { cookie: `anipins_better_auth=valid${cookie ? `; anipins_admin_mfa=${cookie}` : ""}` },
  });

  const required = await handleBetterAuthProfile(makeRequest(""), context.env, context.dependencies);
  assert.deepEqual(await required.json(), { user: null, requiresTwoFactor: true });
  assert.equal(context.state.linked, undefined);

  const proof = await createAdminMfaProof({ sessionId: "ba-session", userId: 7, expiresAt: context.sessionExpiresAt }, context.env.D1_RPC_SECRET);
  const allowed = await handleBetterAuthProfile(makeRequest(proof), context.env, context.dependencies);
  assert.deepEqual(await allowed.json(), { user: { id: 7, email: "anipins01@gmail.com", role: "ADMIN" } });
  assert.equal(context.state.linked, true);
});

test("verified admin MFA proof is honored on protected app requests after sign-in", async () => {
  const { resolveBetterAuthIdentity } = await importRoute();
  const context = setup({ user: { id: 7, email: "anipins01@gmail.com", role: "ADMIN", two_factor_enabled: 1 } });
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
  const locked = setup({ user: { id: 7, email: "anipins01@gmail.com", role: "ADMIN", two_factor_enabled: 1 }, attempts: { attempt_count: 5, locked_until: Date.now() + 60_000 } });
  const lockedResponse = await handleAdminMfaVerification(new Request("https://anipins.com/api/auth/admin-mfa", {
    method: "POST", headers: { origin: "https://anipins.com", "content-type": "application/json" }, body: JSON.stringify({ code: "111111" }),
  }), locked.env, locked.dependencies);
  assert.equal(lockedResponse.status, 429);
  assert.equal(locked.state.failed, 0);

  const recoveryHash = await hashLegacyRecoveryCode("ABCDEF-123456");
  const recovery = setup({ user: { id: 7, email: "anipins01@gmail.com", role: "ADMIN", two_factor_enabled: 1, two_factor_secret: "", recovery_codes: JSON.stringify([recoveryHash]) } });
  const recoveryResponse = await handleAdminMfaVerification(new Request("https://anipins.com/api/auth/admin-mfa", {
    method: "POST", headers: { origin: "https://anipins.com", "content-type": "application/json" }, body: JSON.stringify({ code: "ABCDEF-123456" }),
  }), recovery.env, recovery.dependencies);
  assert.equal(recoveryResponse.status, 200);
  assert.deepEqual(recovery.state.recoveryCodes, []);
});

test("Google-verified MFA recovery keeps the old factor until the new authenticator is confirmed", async () => {
  const { handleAdminMfaRecovery } = await importRoute();
  const oldEncrypted = encryptLegacyTotpSecret("JBSWY3DPEHPK3PXP");
  const state = { pending: "", secret: oldEncrypted, enabled: 1, codes: "[]", completed: false };
  const context = setup({ user: {
    id: 7, email: "anipins01@gmail.com", role: "ADMIN", two_factor_enabled: 1,
    two_factor_secret: oldEncrypted, recovery_codes: "[]",
  } });
  context.dependencies.storeFactory = () => ({
    findBusinessUserForMfa: async () => ({
      id: 7, email: "anipins01@gmail.com", role: "ADMIN", two_factor_enabled: state.enabled,
      two_factor_secret: state.secret, recovery_codes: state.codes,
    }),
    findGoogleAccount: async (userId, subject) => userId === 7 && subject === "google-owner-sub",
    getMfaAttempts: async () => ({ attempt_count: state.failed || 0, locked_until: 0 }),
    setPendingMfaSecret: async (_userId, encrypted) => { state.pending = encrypted; return true; },
    getPendingMfaSecret: async () => state.pending,
    completeMfaRecovery: async (_userId, expected, encrypted, recoveryCodes) => {
      if (!expected || expected !== state.pending) return false;
      state.secret = encrypted;
      state.pending = "";
      state.codes = recoveryCodes;
      state.enabled = 1;
      state.completed = true;
      return true;
    },
    recordMfaFailure: async () => { state.failed = (state.failed || 0) + 1; },
    clearMfaAttempts: async () => { state.failed = 0; },
  });
  context.dependencies.verifyGoogleCredential = async () => ({ sub: "google-owner-sub", email: "anipins01@gmail.com", email_verified: true });
  context.env.BETTER_AUTH_GOOGLE_CLIENT_ID = "google-client-id";
  const makeRequest = (body, cookie = "") => new Request("https://anipins.com/api/auth/admin-mfa/recovery", {
    method: "POST",
    headers: {
      origin: "https://anipins.com",
      "content-type": "application/json",
      ...(cookie ? { cookie } : {}),
    },
    body: JSON.stringify(body),
  });

  const begun = await handleAdminMfaRecovery(makeRequest({ action: "begin", credential: "fresh-google-credential" }, "anipins_google_nonce=nonce"), context.env, context.dependencies);
  const enrollment = await begun.json();
  assert.equal(begun.status, 200);
  assert.ok(enrollment.secret);
  assert.match(enrollment.otpauthUri, /^otpauth:\/\/totp\//);
  assert.match(begun.headers.get("set-cookie"), /anipins_admin_mfa_setup=/);
  assert.equal(state.secret, oldEncrypted);
  assert.equal(state.enabled, 1);
  assert.equal(state.completed, false);

  const setupCookie = begun.headers.get("set-cookie").split(";")[0];
  const invalid = await handleAdminMfaRecovery(makeRequest({ action: "confirm", code: "000000" }, setupCookie), context.env, context.dependencies);
  assert.equal(invalid.status, 401);
  assert.equal(state.secret, oldEncrypted);
  assert.equal(state.completed, false);

  const valid = await handleAdminMfaRecovery(makeRequest({ action: "confirm", code: currentTotp(enrollment.secret) }, setupCookie), context.env, context.dependencies);
  const result = await valid.json();
  assert.equal(valid.status, 200);
  assert.equal(result.ok, true);
  assert.equal(result.recoveryCodes.length, 8);
  assert.equal(state.completed, true);
  assert.equal(state.pending, "");
  assert.notEqual(state.secret, oldEncrypted);
  assert.equal(await decryptLegacySecret(state.secret, secretKey), enrollment.secret);
  assert.match(valid.headers.get("set-cookie"), /anipins_admin_mfa=/);
});

test("MFA recovery cannot start with a Google identity that is not linked to this administrator", async () => {
  const { handleAdminMfaRecovery } = await importRoute();
  const context = setup({ user: {
    id: 7, email: "anipins01@gmail.com", role: "ADMIN", two_factor_enabled: 1,
    two_factor_secret: encryptLegacyTotpSecret("JBSWY3DPEHPK3PXP"), recovery_codes: "[]",
  } });
  let pendingWrites = 0;
  context.dependencies.storeFactory = () => ({
    findBusinessUserForMfa: async () => ({ id: 7, email: "anipins01@gmail.com", role: "ADMIN", two_factor_enabled: 1 }),
    findGoogleAccount: async () => false,
    setPendingMfaSecret: async () => { pendingWrites += 1; return true; },
  });
  context.dependencies.verifyGoogleCredential = async () => ({ sub: "another-google-account", email: "anipins01@gmail.com", email_verified: true });
  context.env.BETTER_AUTH_GOOGLE_CLIENT_ID = "google-client-id";
  const response = await handleAdminMfaRecovery(new Request("https://anipins.com/api/auth/admin-mfa/recovery", {
    method: "POST",
    headers: { origin: "https://anipins.com", "content-type": "application/json", cookie: "anipins_google_nonce=nonce" },
    body: JSON.stringify({ action: "begin", credential: "fresh-google-credential" }),
  }), context.env, context.dependencies);

  assert.equal(response.status, 403);
  assert.equal(pendingWrites, 0);
});

test("MFA recovery verifies Google JWT signatures, audience, and one-time nonce", async () => {
  const { handleAdminMfaRecovery } = await importRoute();
  const keyPair = crypto.generateKeyPairSync("rsa", { modulusLength: 2048 });
  const jwk = { ...keyPair.publicKey.export({ format: "jwk" }), kid: "google-test-key", alg: "RS256", use: "sig" };
  const now = Math.floor(Date.now() / 1000);
  const nonce = crypto.createHash("sha256").update("google-nonce").digest("hex");
  const makeToken = (claims, privateKey = keyPair.privateKey) => {
    const header = Buffer.from(JSON.stringify({ alg: "RS256", kid: jwk.kid })).toString("base64url");
    const payload = Buffer.from(JSON.stringify(claims)).toString("base64url");
    const content = `${header}.${payload}`;
    const signature = crypto.sign("RSA-SHA256", Buffer.from(content), privateKey).toString("base64url");
    return `${content}.${signature}`;
  };
  const claims = {
    iss: "https://accounts.google.com", aud: "google-client-id", exp: now + 300, iat: now,
    email: "anipins01@gmail.com", email_verified: true, sub: "google-owner-sub", nonce,
  };
  const context = setup({ user: { id: 7, email: "anipins01@gmail.com", role: "ADMIN", two_factor_enabled: 1 } });
  let pendingWrites = 0;
  context.dependencies.storeFactory = () => ({
    findBusinessUserForMfa: async () => ({ id: 7, email: "anipins01@gmail.com", role: "ADMIN", two_factor_enabled: 1 }),
    findGoogleAccount: async (_id, subject) => subject === claims.sub,
    setPendingMfaSecret: async () => { pendingWrites += 1; return true; },
  });
  context.env.BETTER_AUTH_GOOGLE_CLIENT_ID = "google-client-id";
  const originalFetch = global.fetch;
  global.fetch = async url => {
    assert.equal(String(url), "https://www.googleapis.com/oauth2/v3/certs");
    return Response.json({ keys: [jwk] });
  };
  const request = credential => new Request("https://anipins.com/api/auth/admin-mfa/recovery", {
    method: "POST",
    headers: { origin: "https://anipins.com", "content-type": "application/json", cookie: "anipins_google_nonce=google-nonce" },
    body: JSON.stringify({ action: "begin", credential }),
  });
  try {
    const valid = await handleAdminMfaRecovery(request(makeToken(claims)), context.env, context.dependencies);
    assert.equal(valid.status, 200);
    const wrongAudience = await handleAdminMfaRecovery(request(makeToken({ ...claims, aud: "attacker-client" })), context.env, context.dependencies);
    assert.equal(wrongAudience.status, 401);
    const wrongNonce = await handleAdminMfaRecovery(request(makeToken({ ...claims, nonce: "replayed-nonce" })), context.env, context.dependencies);
    assert.equal(wrongNonce.status, 401);
    assert.equal(pendingWrites, 1);
  } finally {
    global.fetch = originalFetch;
  }
});
