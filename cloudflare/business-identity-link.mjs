const normalizeEmail = value => String(value || "").trim().toLowerCase();

function publicBusinessUser(user) {
  return {
    id: Number(user.id),
    email: normalizeEmail(user.email),
    role: String(user.role || "USER"),
  };
}

function adminSecondFactorRequired(user) {
  return String(user?.role || "").toUpperCase() === "ADMIN" && Number(user?.two_factor_enabled) === 1;
}

/**
 * Resolve a Better Auth account to the numeric AniPins business identity.
 * Existing account ownership is only inferred from a verified email; new,
 * non-conflicting signups receive a least-privileged USER profile.
 */
export async function ensureBusinessIdentityLink(store, authIdentity, { adminMfaVerified = false } = {}) {
  const authUserId = String(authIdentity?.id || "");
  const email = normalizeEmail(authIdentity?.email);
  if (!authUserId || authUserId.length > 256 || !email || email.length > 320 || !email.includes("@")) {
    throw new TypeError("A valid Better Auth identity is required.");
  }

  const linked = await store.findLink(authUserId);
  if (linked) {
    if (adminSecondFactorRequired(linked) && !adminMfaVerified) {
      return { ok: false, reason: "admin_second_factor_required" };
    }
    return { ok: true, user: publicBusinessUser(linked) };
  }

  let businessUser = await store.findBusinessUser(email);
  if (businessUser && authIdentity.emailVerified !== true) {
    return { ok: false, reason: "email_verification_required" };
  }

  if (!businessUser) {
    const created = await store.createBusinessUser({
      email,
      name: String(authIdentity.name || "").trim().slice(0, 300),
    });
    businessUser = created?.user || null;
    if (!businessUser) return { ok: false, reason: "profile_unavailable" };
    if (!created.created && authIdentity.emailVerified !== true) {
      return { ok: false, reason: "email_verification_required" };
    }
  }

  if (adminSecondFactorRequired(businessUser) && !adminMfaVerified) {
    return { ok: false, reason: "admin_second_factor_required" };
  }

  await store.createLink(authUserId, Number(businessUser.id));
  const finalLink = await store.findLink(authUserId);
  if (!finalLink || Number(finalLink.id) !== Number(businessUser.id)) {
    return { ok: false, reason: "identity_link_conflict" };
  }
  if (adminSecondFactorRequired(finalLink) && !adminMfaVerified) {
    return { ok: false, reason: "admin_second_factor_required" };
  }
  return { ok: true, user: publicBusinessUser(finalLink) };
}

/** D1 implementation. Roles are always read from users.role, never auth metadata. */
export function createD1BusinessIdentityStore(db) {
  if (!db || typeof db.prepare !== "function") throw new TypeError("D1 database binding is required.");

  return {
    findLink(authUserId) {
      return db.prepare(`SELECT u.id, lower(u.email) AS email, u.role, u.two_factor_enabled
        FROM better_auth_user_link l JOIN users u ON u.id=l.anipins_user_id
        WHERE l.auth_user_id=? LIMIT 1`).bind(authUserId).first();
    },
    findBusinessUser(email) {
      return db.prepare("SELECT id, lower(email) AS email, role, two_factor_enabled FROM users WHERE lower(email)=? LIMIT 1")
        .bind(email).first();
    },
    findBusinessUserForMfa(email) {
      return db.prepare(`SELECT id, lower(email) AS email, role, two_factor_enabled,
        two_factor_secret, recovery_codes FROM users WHERE lower(email)=? LIMIT 1`)
        .bind(email).first();
    },
    async replaceRecoveryCodes(userId, currentValue, nextValue) {
      const result = await db.prepare("UPDATE users SET recovery_codes=? WHERE id=? AND recovery_codes=?")
        .bind(nextValue, userId, currentValue).run();
      return Number(result?.meta?.changes || 0) === 1;
    },
    getMfaAttempts(sessionId) {
      return db.prepare("SELECT attempt_count, window_started_at, locked_until FROM admin_mfa_attempts WHERE session_id=? LIMIT 1")
        .bind(sessionId).first();
    },
    async recordMfaFailure(sessionId, userId, now) {
      await db.prepare(`INSERT INTO admin_mfa_attempts (session_id, user_id, attempt_count, window_started_at, locked_until)
        VALUES (?, ?, 1, ?, 0)
        ON CONFLICT(session_id) DO UPDATE SET
          user_id=excluded.user_id,
          attempt_count=CASE WHEN admin_mfa_attempts.window_started_at<=? OR admin_mfa_attempts.locked_until<=? THEN 1 ELSE admin_mfa_attempts.attempt_count+1 END,
          window_started_at=CASE WHEN admin_mfa_attempts.window_started_at<=? OR admin_mfa_attempts.locked_until<=? THEN excluded.window_started_at ELSE admin_mfa_attempts.window_started_at END,
          locked_until=CASE
            WHEN admin_mfa_attempts.window_started_at<=? OR admin_mfa_attempts.locked_until<=? THEN 0
            WHEN admin_mfa_attempts.attempt_count+1>=5 THEN ?
            ELSE admin_mfa_attempts.locked_until END`)
        .bind(sessionId, userId, now,
          now - 600_000, now, now - 600_000, now,
          now - 600_000, now, now + 900_000)
        .run();
      return this.getMfaAttempts(sessionId);
    },
    async clearMfaAttempts(sessionId) {
      await db.prepare("DELETE FROM admin_mfa_attempts WHERE session_id=?").bind(sessionId).run();
    },
    async createBusinessUser({ email, name }) {
      const result = await db.prepare(`INSERT INTO users (email, password_hash, name, role)
        VALUES (?, 'BETTER_AUTH_MANAGED', ?, 'USER')
        ON CONFLICT(email) DO NOTHING
        RETURNING id, lower(email) AS email, role, two_factor_enabled`)
        .bind(email, name)
        .first();
      if (result) return { created: true, user: result };
      const raced = await db.prepare("SELECT id, lower(email) AS email, role, two_factor_enabled FROM users WHERE lower(email)=? LIMIT 1")
        .bind(email).first();
      return { created: false, user: raced || null };
    },
    async createLink(authUserId, businessUserId) {
      await db.prepare(`INSERT OR IGNORE INTO better_auth_user_link (auth_user_id, anipins_user_id)
        VALUES (?, ?)`)
        .bind(authUserId, businessUserId)
        .run();
    },
  };
}
