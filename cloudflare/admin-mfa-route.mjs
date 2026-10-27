import { createD1BusinessIdentityStore, ensureBusinessIdentityLink } from "./business-identity-link.mjs";
import {
  createAdminMfaProof,
  createAdminMfaRecoveryProof,
  createLegacyRecoveryCodes,
  decryptLegacySecret,
  encryptLegacySecret,
  generateLegacyTotpSecret,
  hashLegacyRecoveryCode,
  verifyAdminMfaRecoveryProof,
  verifyAdminMfaProof,
  verifyLegacyTotp,
} from "./admin-mfa.mjs";

const PROOF_COOKIE = "anipins_admin_mfa";
const RECOVERY_COOKIE = "anipins_admin_mfa_setup";
const GOOGLE_NONCE_COOKIE = "anipins_google_nonce";
const MAX_FAILED_ATTEMPTS = 5;
const FAILURE_WINDOW_MS = 10 * 60_000;
const LOCKOUT_MS = 15 * 60_000;
const ADMIN_EMAIL = "anipins01@gmail.com";

function json(body, status = 200, headers = {}) {
  const responseHeaders = new Headers({ "Cache-Control": "no-store" });
  for (const [name, value] of Object.entries(headers)) {
    if (name.toLowerCase() === "set-cookie" && Array.isArray(value)) {
      for (const cookie of value) responseHeaders.append(name, cookie);
    } else responseHeaders.set(name, value);
  }
  return Response.json(body, { status, headers: responseHeaders });
}

function cookieValue(request, name) {
  for (const part of (request.headers.get("cookie") || "").split(";")) {
    const separator = part.indexOf("=");
    if (separator >= 0 && part.slice(0, separator).trim() === name) return part.slice(separator + 1).trim();
  }
  return "";
}

function encodeBase64Url(bytes) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function decodeBase64Url(value) {
  const normalized = String(value || "").replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(normalized + "=".repeat((4 - normalized.length % 4) % 4));
  return Uint8Array.from(binary, character => character.charCodeAt(0));
}

async function sha256Hex(value) {
  return [...new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)))]
    .map(byte => byte.toString(16).padStart(2, "0")).join("");
}

async function verifyGoogleCredential(idToken, rawNonce, audience, dependencies) {
  if (typeof dependencies.verifyGoogleCredential === "function") {
    return dependencies.verifyGoogleCredential(idToken, rawNonce, audience);
  }
  if (!idToken || idToken.length > 10_000 || !rawNonce || !audience) throw new TypeError("Google credential is invalid.");
  const [encodedHeader, encodedPayload, encodedSignature, extra] = idToken.split(".");
  if (!encodedHeader || !encodedPayload || !encodedSignature || extra !== undefined) throw new TypeError("Google credential is invalid.");
  const header = JSON.parse(new TextDecoder().decode(decodeBase64Url(encodedHeader)));
  const claims = JSON.parse(new TextDecoder().decode(decodeBase64Url(encodedPayload)));
  if (header?.alg !== "RS256" || typeof header?.kid !== "string" || claims?.iss !== "https://accounts.google.com" && claims?.iss !== "accounts.google.com") {
    throw new TypeError("Google credential is invalid.");
  }
  const now = Math.floor(Date.now() / 1000);
  const audiences = Array.isArray(claims.aud) ? claims.aud : [claims.aud];
  if (!audiences.includes(audience) || !Number.isSafeInteger(claims.exp) || claims.exp <= now
    || !Number.isSafeInteger(claims.iat) || claims.iat > now + 60
    || claims.email_verified !== true || typeof claims.sub !== "string" || !claims.sub
    || claims.nonce !== await sha256Hex(rawNonce)) {
    throw new TypeError("Google credential is invalid.");
  }

  const keyResponse = await fetch("https://www.googleapis.com/oauth2/v3/certs", {
    headers: { Accept: "application/json" },
    cf: { cacheTtl: 3600, cacheEverything: true },
  });
  if (!keyResponse.ok) throw new Error("Google verification keys are unavailable.");
  const keySet = await keyResponse.json();
  const jwk = Array.isArray(keySet?.keys) ? keySet.keys.find(key => key?.kid === header.kid && key?.kty === "RSA") : null;
  if (!jwk?.n || !jwk?.e) throw new TypeError("Google credential is invalid.");
  const publicKey = await crypto.subtle.importKey("jwk", {
    kty: "RSA", n: jwk.n, e: jwk.e, alg: "RS256", use: "sig", ext: true, key_ops: ["verify"],
  }, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["verify"]);
  const signedContent = new TextEncoder().encode(`${encodedHeader}.${encodedPayload}`);
  if (!await crypto.subtle.verify("RSASSA-PKCS1-v1_5", publicKey, decodeBase64Url(encodedSignature), signedContent)) {
    throw new TypeError("Google credential is invalid.");
  }
  return claims;
}

function sessionClaims(session) {
  const expiresAt = session?.session?.expiresAt instanceof Date
    ? session.session.expiresAt.getTime()
    : typeof session?.session?.expiresAt === "number"
      ? session.session.expiresAt
      : Date.parse(String(session?.session?.expiresAt || ""));
  if (!session?.user?.id || !session?.session?.id || !Number.isFinite(expiresAt)) return null;
  return { sessionId: String(session.session.id), expiresAt };
}

async function readSession(request, env, dependencies) {
  const authFactory = dependencies.authFactory;
  const auth = authFactory ? authFactory(env, request) : dependencies.auth;
  if (!auth?.api?.getSession) throw new Error("Better Auth session API is unavailable.");
  return auth.api.getSession({ headers: request.headers });
}

function isAdministrator(user) {
  return String(user?.role || "").toUpperCase() === "ADMIN"
    && String(user?.email || "").trim().toLowerCase() === ADMIN_EMAIL
    && Number(user?.two_factor_enabled) === 1;
}

async function decryptAdminTotpSecret(encrypted, env) {
  const keys = [...new Set([env.ADMIN_2FA_ENCRYPTION_KEY, env.ADMIN_PASSWORD].filter(value => typeof value === "string" && value.length >= 12))];
  let lastError;
  for (const key of keys) {
    try {
      return await decryptLegacySecret(encrypted, key);
    } catch (error) {
      lastError = error;
    }
  }
  if (lastError) throw lastError;
  throw new TypeError("Admin security encryption key is not configured.");
}

export async function handleAdminMfaVerification(request, env, dependencies = {}) {
  if (new URL(request.url).pathname !== "/api/auth/admin-mfa") return json({ error: "not_found" }, 404);
  if (request.method !== "POST") return json({ error: "method_not_allowed" }, 405, { Allow: "POST" });
  if (new URL(request.url).origin !== request.headers.get("origin")) return json({ error: "origin_not_allowed" }, 403);
  if (!(request.headers.get("content-type") || "").toLowerCase().startsWith("application/json")) return json({ error: "invalid_content_type" }, 415);
  let stage = "session_lookup";
  try {
    const session = await readSession(request, env, dependencies);
    const claims = sessionClaims(session);
    if (!claims || !session?.user?.email) return json({ error: "unauthorized" }, 401);
    stage = "d1_store_lookup";
    const store = (dependencies.storeFactory || (db => createD1BusinessIdentityStore(db)))(env.DB);
    const user = await store.findBusinessUserForMfa(session.user.email);
    if (!isAdministrator(user)) return json({ error: "not_required" }, 403);
    claims.userId = Number(user.id);
    if (claims.expiresAt <= Date.now()) return json({ error: "session_expired" }, 401);

    const now = Date.now();
    stage = "mfa_attempt_lookup";
    const attempts = await store.getMfaAttempts(claims.sessionId);
    if (Number(attempts?.locked_until || 0) > now) return json({ error: "temporarily_locked" }, 429, { "Retry-After": String(Math.ceil((attempts.locked_until - now) / 1000)) });

    stage = "parse_code";
    let body;
    try {
      const text = await request.text();
      if (new TextEncoder().encode(text).byteLength > 1024) return json({ error: "invalid_request" }, 413);
      body = JSON.parse(text);
    } catch { return json({ error: "invalid_request" }, 400); }
    const code = String(body?.code || "").trim();
    let valid = false;
    if (user.two_factor_secret) {
      stage = "decrypt_totp";
      try {
        const totpSecret = await decryptAdminTotpSecret(user.two_factor_secret, env);
        stage = "verify_totp";
        valid = await verifyLegacyTotp(totpSecret, code);
      } catch {
        // Keep the independent, one-time recovery-code path available if a
        // legacy TOTP ciphertext was encrypted with a key that is no longer
        // configured after migration.
        valid = false;
      }
    }

    stage = "verify_recovery_code";
    let recoveryCodes = String(user.recovery_codes || "[]");
    if (!valid) {
      const wantedHash = await hashLegacyRecoveryCode(code);
      if (wantedHash) {
        let hashes;
        try { hashes = JSON.parse(recoveryCodes); } catch { hashes = []; }
        const index = Array.isArray(hashes) ? hashes.indexOf(wantedHash) : -1;
        if (index >= 0) {
          hashes.splice(index, 1);
          const next = JSON.stringify(hashes);
          valid = await store.replaceRecoveryCodes(user.id, recoveryCodes, next);
          if (valid) recoveryCodes = next;
        }
      }
    }
    if (!valid) {
      stage = "record_failed_attempt";
      await store.recordMfaFailure(claims.sessionId, user.id, now);
      return json({ error: "invalid_code" }, 401);
    }

    stage = "clear_failed_attempts";
    await store.clearMfaAttempts(claims.sessionId);
    stage = "create_mfa_proof";
    const proof = await createAdminMfaProof(claims, env.D1_RPC_SECRET, now);
    const maxAge = Math.max(0, Math.floor((claims.expiresAt - now) / 1000));
    return json({ ok: true }, 200, {
      "Set-Cookie": `${PROOF_COOKIE}=${proof}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`,
    });
  } catch (error) {
    const diagnostic = { stage, errorName: typeof error?.name === "string" ? error.name : "Error" };
    if (typeof dependencies.onError === "function") dependencies.onError(diagnostic);
    else console.error("[admin-mfa-diagnostic]", diagnostic);
    return json({ error: "verification_unavailable" }, 503);
  }
}

/** Allow an MFA-locked administrator to enroll a replacement factor after fresh Google verification. */
export async function handleAdminMfaRecovery(request, env, dependencies = {}) {
  if (new URL(request.url).pathname !== "/api/auth/admin-mfa/recovery") return json({ error: "not_found" }, 404);
  if (request.method !== "POST") return json({ error: "method_not_allowed" }, 405, { Allow: "POST" });
  if (new URL(request.url).origin !== request.headers.get("origin")) return json({ error: "origin_not_allowed" }, 403);
  if (!(request.headers.get("content-type") || "").toLowerCase().startsWith("application/json")) return json({ error: "invalid_content_type" }, 415);

  const clearGoogleNonce = `${GOOGLE_NONCE_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
  const clearSetupCookie = `${RECOVERY_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`;
  let stage = "session_lookup";
  try {
    const session = await readSession(request, env, dependencies);
    const claims = sessionClaims(session);
    if (!claims || !session?.user?.email || claims.expiresAt <= Date.now()) return json({ error: "unauthorized" }, 401);

    stage = "parse_request";
    let body;
    try {
      const text = await request.text();
      if (new TextEncoder().encode(text).byteLength > 16_000) return json({ error: "invalid_request" }, 413);
      body = JSON.parse(text);
    } catch { return json({ error: "invalid_request" }, 400); }
    const action = String(body?.action || "");
    if (action !== "begin" && action !== "confirm") return json({ error: "invalid_action" }, 400);

    stage = "admin_lookup";
    const store = (dependencies.storeFactory || (db => createD1BusinessIdentityStore(db)))(env.DB);
    const user = await store.findBusinessUserForMfa(session.user.email);
    if (!isAdministrator(user) || String(user.email || "").toLowerCase() !== String(session.user.email).toLowerCase()) return json({ error: "not_allowed" }, 403);
    claims.userId = Number(user.id);

    if (action === "begin") {
      stage = "google_reauthentication";
      const rawNonce = cookieValue(request, GOOGLE_NONCE_COOKIE);
      const audience = env.BETTER_AUTH_GOOGLE_CLIENT_ID || env.GOOGLE_CLIENT_ID || env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";
      let google;
      try {
        google = await verifyGoogleCredential(String(body?.credential || ""), rawNonce, audience, dependencies);
      } catch {
        return json({ error: "google_verification_failed" }, 401, { "Set-Cookie": clearGoogleNonce });
      }
      stage = "google_account_link_lookup";
      const linked = await store.findGoogleAccount(user.id, google.sub);
      if (!linked || String(google.email || "").toLowerCase() !== String(user.email || "").toLowerCase()) {
        return json({ error: "google_account_mismatch" }, 403, { "Set-Cookie": clearGoogleNonce });
      }

      stage = "encrypt_pending_authenticator";
      const secret = generateLegacyTotpSecret();
      const encryptionKey = env.ADMIN_2FA_ENCRYPTION_KEY || env.ADMIN_PASSWORD;
      const pending = await encryptLegacySecret(secret, encryptionKey);
      if (!await store.setPendingMfaSecret(user.id, pending)) return json({ error: "setup_unavailable" }, 503, { "Set-Cookie": clearGoogleNonce });
      const proof = await createAdminMfaRecoveryProof(claims, env.D1_RPC_SECRET, pending);
      const label = encodeURIComponent(`AniPins:${user.email}`);
      const otpauthUri = `otpauth://totp/${label}?secret=${secret}&issuer=AniPins&algorithm=SHA1&digits=6&period=30`;
      return json({ secret, otpauthUri, expiresIn: 600 }, 200, {
        "Set-Cookie": [`${RECOVERY_COOKIE}=${proof}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=600`, clearGoogleNonce],
      });
    }

    stage = "pending_authenticator_lookup";
    const pending = await store.getPendingMfaSecret(user.id);
    const setupProof = cookieValue(request, RECOVERY_COOKIE);
    if (!pending || !await verifyAdminMfaRecoveryProof(setupProof, claims, env.D1_RPC_SECRET, pending)) {
      return json({ error: "setup_expired" }, 401, { "Set-Cookie": clearSetupCookie });
    }

    stage = "mfa_attempt_lookup";
    const attempts = await store.getMfaAttempts(claims.sessionId);
    const attemptNow = Date.now();
    if (Number(attempts?.locked_until || 0) > attemptNow) {
      return json({ error: "temporarily_locked" }, 429, { "Retry-After": String(Math.ceil((attempts.locked_until - attemptNow) / 1000)) });
    }

    stage = "decrypt_pending_authenticator";
    const secret = await decryptAdminTotpSecret(pending, env);
    stage = "verify_new_authenticator";
    if (!await verifyLegacyTotp(secret, String(body?.code || "").trim())) {
      const now = Date.now();
      await store.recordMfaFailure(claims.sessionId, user.id, now);
      return json({ error: "invalid_code" }, 401);
    }

    stage = "save_replacement_authenticator";
    const recoveryCodes = createLegacyRecoveryCodes();
    const recoveryHashes = await Promise.all(recoveryCodes.map(hashLegacyRecoveryCode));
    const replacement = await encryptLegacySecret(secret, env.ADMIN_2FA_ENCRYPTION_KEY || env.ADMIN_PASSWORD);
    if (!await store.completeMfaRecovery(user.id, pending, replacement, JSON.stringify(recoveryHashes))) {
      return json({ error: "setup_expired" }, 409, { "Set-Cookie": clearSetupCookie });
    }
    await store.clearMfaAttempts(claims.sessionId);
    const now = Date.now();
    const proof = await createAdminMfaProof(claims, env.D1_RPC_SECRET, now);
    const maxAge = Math.max(0, Math.floor((claims.expiresAt - now) / 1000));
    return json({ ok: true, recoveryCodes }, 200, {
      "Set-Cookie": [`${PROOF_COOKIE}=${proof}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`, clearSetupCookie],
    });
  } catch (error) {
    const diagnostic = { stage, errorName: typeof error?.name === "string" ? error.name : "Error" };
    if (typeof dependencies.onError === "function") dependencies.onError(diagnostic);
    else console.error("[admin-mfa-recovery-diagnostic]", diagnostic);
    return json({ error: "recovery_unavailable" }, 503);
  }
}

/** Resolve the signed-in identity for app requests, honoring the admin MFA proof. */
export async function resolveBetterAuthIdentity(request, env, dependencies = {}) {
  const session = await readSession(request, env, dependencies);
  const claims = sessionClaims(session);
  if (!claims || !session?.user?.email || claims.expiresAt <= Date.now()) return null;

  const store = (dependencies.storeFactory || (db => createD1BusinessIdentityStore(db)))(env.DB);
  const linked = await store.findLink(session.user.id);
  const businessUser = linked || await store.findBusinessUserForMfa(session.user.email);
  const adminMfaRequired = isAdministrator(businessUser) && Number(businessUser?.two_factor_enabled) === 1;
  let adminMfaVerified = false;

  if (adminMfaRequired) {
    claims.userId = Number(businessUser.id);
    adminMfaVerified = await verifyAdminMfaProof(cookieValue(request, PROOF_COOKIE), claims, env.D1_RPC_SECRET);
    if (!adminMfaVerified) return null;
  }

  const result = await ensureBusinessIdentityLink(store, session.user, { adminMfaVerified });
  return result.ok ? { userId: Number(result.user.id) } : null;
}

/** Serve Better Auth profile lookup only for a real Better Auth session. */
export async function handleBetterAuthProfile(request, env, dependencies = {}) {
  if (new URL(request.url).pathname !== "/api/auth/me") return null;
  if (request.method !== "GET") return json({ error: "method_not_allowed" }, 405, { Allow: "GET" });
  try {
    const session = await readSession(request, env, dependencies);
    if (!session?.user) return null; // Keep legacy session handling in the app container.
    const claims = sessionClaims(session);
    if (!claims || !session.user.email) return json({ user: null }, 401);
    const store = (dependencies.storeFactory || (db => createD1BusinessIdentityStore(db)))(env.DB);
    const existing = await store.findBusinessUserForMfa(session.user.email);
    const adminMfaRequired = isAdministrator(existing);
    if (adminMfaRequired) claims.userId = Number(existing.id);
    const proof = cookieValue(request, PROOF_COOKIE);
    const adminMfaVerified = adminMfaRequired && await verifyAdminMfaProof(proof, claims, env.D1_RPC_SECRET);
    if (adminMfaRequired && !adminMfaVerified) return json({ user: null, requiresTwoFactor: true });
    const linked = await ensureBusinessIdentityLink(store, session.user, { adminMfaVerified });
    if (!linked.ok) return json({ user: null, error: linked.reason }, 403);
    return json({ user: linked.user });
  } catch {
    return json({ error: "profile_unavailable" }, 503);
  }
}

export { FAILURE_WINDOW_MS, LOCKOUT_MS, MAX_FAILED_ATTEMPTS };
