const normalizeEmail = value => String(value || "").trim().toLowerCase();

function publicBusinessUser(user) {
  return {
    id: Number(user.id),
    email: normalizeEmail(user.email),
    role: String(user.role || "USER"),
  };
}

function legacyAdminSecondFactorRequired(user) {
  // The legacy admin flow verifies encrypted TOTP/recovery codes before it
  // creates a session. Until that challenge is ported, Better Auth must not
  // turn a password or Google login into an admin session without that check.
  return String(user?.role || "").toUpperCase() === "ADMIN" && Number(user?.two_factor_enabled) === 1;
}

/**
 * Resolve a Better Auth account to the numeric AniPins business identity.
 * Existing account ownership is only inferred from a verified email; new,
 * non-conflicting signups receive a least-privileged USER profile.
 */
export async function ensureBusinessIdentityLink(store, authIdentity) {
  const authUserId = String(authIdentity?.id || "");
  const email = normalizeEmail(authIdentity?.email);
  if (!authUserId || authUserId.length > 256 || !email || email.length > 320 || !email.includes("@")) {
    throw new TypeError("A valid Better Auth identity is required.");
  }

  const linked = await store.findLink(authUserId);
  if (linked) {
    if (legacyAdminSecondFactorRequired(linked)) {
      return { ok: false, reason: "admin_second_factor_requires_legacy_login" };
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

  if (legacyAdminSecondFactorRequired(businessUser)) {
    return { ok: false, reason: "admin_second_factor_requires_legacy_login" };
  }

  await store.createLink(authUserId, Number(businessUser.id));
  const finalLink = await store.findLink(authUserId);
  if (!finalLink || Number(finalLink.id) !== Number(businessUser.id)) {
    return { ok: false, reason: "identity_link_conflict" };
  }
  if (legacyAdminSecondFactorRequired(finalLink)) {
    return { ok: false, reason: "admin_second_factor_requires_legacy_login" };
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
