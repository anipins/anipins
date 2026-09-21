import crypto from "crypto";
import { OAuth2Client, type TokenPayload } from "google-auth-library";
import { row, run } from "./db";
import { hashPassword } from "./auth";

export const GOOGLE_PROVIDER = "google";
export const GOOGLE_NONCE_COOKIE = "anipins_google_nonce";

export const GOOGLE_NONCE_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 10 * 60,
  priority: "high" as const,
};

export function googleClientId() {
  return (process.env.GOOGLE_CLIENT_ID || "").trim();
}

export function generateGoogleNonce() {
  const raw = crypto.randomBytes(32).toString("base64url");
  return { raw, hashed: hashGoogleNonce(raw) };
}

export function hashGoogleNonce(raw: string) {
  return crypto.createHash("sha256").update(raw).digest("hex");
}

export async function ensureGoogleAuthSchema() {
  await run(`CREATE TABLE IF NOT EXISTS auth_identities (
    provider TEXT NOT NULL,
    provider_subject TEXT NOT NULL,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    email TEXT NOT NULL DEFAULT '',
    created_at BIGINT NOT NULL,
    PRIMARY KEY (provider, provider_subject),
    UNIQUE (provider, user_id))`);
  await run("CREATE INDEX IF NOT EXISTS idx_auth_identities_user ON auth_identities(user_id)");
  if (process.env.DATABASE_URL) {
    await run("ALTER TABLE public.auth_identities ENABLE ROW LEVEL SECURITY");
    await run("REVOKE ALL ON TABLE public.auth_identities FROM anon, authenticated");
  }
}

export async function verifyGoogleCredential(idToken: string, rawNonce: string): Promise<TokenPayload> {
  const clientId = googleClientId();
  if (!clientId) throw new Error("GOOGLE_NOT_CONFIGURED");
  if (!idToken || idToken.length > 10_000 || !rawNonce) throw new Error("INVALID_GOOGLE_CREDENTIAL");

  const ticket = await new OAuth2Client(clientId).verifyIdToken({
    idToken,
    audience: clientId,
  });
  const payload = ticket.getPayload();
  if (!payload?.sub || !payload.email || payload.email_verified !== true) {
    throw new Error("UNVERIFIED_GOOGLE_ACCOUNT");
  }
  if (!payload.nonce || payload.nonce !== hashGoogleNonce(rawNonce)) {
    throw new Error("INVALID_GOOGLE_NONCE");
  }
  return payload;
}

type GoogleUser = {
  id: number;
  email: string;
  role: string;
  two_factor_enabled: number;
};

export async function findOrCreateGoogleUser(payload: TokenPayload): Promise<GoogleUser> {
  const subject = payload.sub;
  const email = String(payload.email).toLowerCase().trim();
  const displayName = String(payload.name || "").trim().slice(0, 40);
  const avatar = String(payload.picture || "").trim().slice(0, 2_000);

  const linked = await row(
    `SELECT u.id,u.email,u.role,u.two_factor_enabled
     FROM auth_identities i JOIN users u ON u.id=i.user_id
     WHERE i.provider=? AND i.provider_subject=?`,
    GOOGLE_PROVIDER,
    subject,
  );
  if (linked) {
    await run(
      "UPDATE auth_identities SET email=? WHERE provider=? AND provider_subject=?",
      email,
      GOOGLE_PROVIDER,
      subject,
    );
    return linked as GoogleUser;
  }

  let user = await row(
    "SELECT id,email,role,two_factor_enabled FROM users WHERE LOWER(email)=LOWER(?)",
    email,
  );
  if (!user) {
    const unusablePassword = hashPassword(crypto.randomBytes(48).toString("base64url"));
    await run(
      "INSERT INTO users (email,password_hash,name,nickname,avatar,role) VALUES (?,?,?,?,?,?)",
      email,
      unusablePassword,
      displayName,
      displayName,
      avatar,
      "USER",
    );
    user = await row(
      "SELECT id,email,role,two_factor_enabled FROM users WHERE email=?",
      email,
    );
  }

  try {
    await run(
      "INSERT INTO auth_identities (provider,provider_subject,user_id,email,created_at) VALUES (?,?,?,?,?)",
      GOOGLE_PROVIDER,
      subject,
      user.id,
      email,
      Date.now(),
    );
  } catch {
    const raced = await row(
      `SELECT u.id,u.email,u.role,u.two_factor_enabled
       FROM auth_identities i JOIN users u ON u.id=i.user_id
       WHERE i.provider=? AND i.provider_subject=?`,
      GOOGLE_PROVIDER,
      subject,
    );
    if (raced) return raced as GoogleUser;
    throw new Error("GOOGLE_ACCOUNT_ALREADY_LINKED");
  }
  return user as GoogleUser;
}
