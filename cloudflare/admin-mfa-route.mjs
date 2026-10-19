import { createD1BusinessIdentityStore, ensureBusinessIdentityLink } from "./business-identity-link.mjs";
import {
  createAdminMfaProof,
  decryptLegacySecret,
  hashLegacyRecoveryCode,
  verifyAdminMfaProof,
  verifyLegacyTotp,
} from "./admin-mfa.mjs";

const PROOF_COOKIE = "anipins_admin_mfa";
const MAX_FAILED_ATTEMPTS = 5;
const FAILURE_WINDOW_MS = 10 * 60_000;
const LOCKOUT_MS = 15 * 60_000;

function json(body, status = 200, headers = {}) {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store", ...headers } });
}

function cookieValue(request, name) {
  for (const part of (request.headers.get("cookie") || "").split(";")) {
    const separator = part.indexOf("=");
    if (separator >= 0 && part.slice(0, separator).trim() === name) return part.slice(separator + 1).trim();
  }
  return "";
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
  return String(user?.role || "").toUpperCase() === "ADMIN" && Number(user?.two_factor_enabled) === 1;
}

export async function handleAdminMfaVerification(request, env, dependencies = {}) {
  if (new URL(request.url).pathname !== "/api/auth/admin-mfa") return json({ error: "not_found" }, 404);
  if (request.method !== "POST") return json({ error: "method_not_allowed" }, 405, { Allow: "POST" });
  if (new URL(request.url).origin !== request.headers.get("origin")) return json({ error: "origin_not_allowed" }, 403);
  if (!(request.headers.get("content-type") || "").toLowerCase().startsWith("application/json")) return json({ error: "invalid_content_type" }, 415);
  try {
    const session = await readSession(request, env, dependencies);
    const claims = sessionClaims(session);
    if (!claims || !session?.user?.email) return json({ error: "unauthorized" }, 401);
    const store = (dependencies.storeFactory || (db => createD1BusinessIdentityStore(db)))(env.DB);
    const user = await store.findBusinessUserForMfa(session.user.email);
    if (!isAdministrator(user)) return json({ error: "not_required" }, 403);
    claims.userId = Number(user.id);
    if (claims.expiresAt <= Date.now()) return json({ error: "session_expired" }, 401);

    const now = Date.now();
    const attempts = await store.getMfaAttempts(claims.sessionId);
    if (Number(attempts?.locked_until || 0) > now) return json({ error: "temporarily_locked" }, 429, { "Retry-After": String(Math.ceil((attempts.locked_until - now) / 1000)) });

    let body;
    try {
      const text = await request.text();
      if (new TextEncoder().encode(text).byteLength > 1024) return json({ error: "invalid_request" }, 413);
      body = JSON.parse(text);
    } catch { return json({ error: "invalid_request" }, 400); }
    const code = String(body?.code || "").trim();
    let valid = false;
    if (user.two_factor_secret) {
      const encryptionKey = env.ADMIN_2FA_ENCRYPTION_KEY || env.ADMIN_PASSWORD;
      const totpSecret = await decryptLegacySecret(user.two_factor_secret, encryptionKey);
      valid = await verifyLegacyTotp(totpSecret, code);
    }

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
      await store.recordMfaFailure(claims.sessionId, user.id, now);
      return json({ error: "invalid_code" }, 401);
    }

    await store.clearMfaAttempts(claims.sessionId);
    const proof = await createAdminMfaProof(claims, env.D1_RPC_SECRET, now);
    const maxAge = Math.max(0, Math.floor((claims.expiresAt - now) / 1000));
    return json({ ok: true }, 200, {
      "Set-Cookie": `${PROOF_COOKIE}=${proof}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`,
    });
  } catch {
    return json({ error: "verification_unavailable" }, 503);
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
