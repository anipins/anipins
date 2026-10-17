import { cookies, headers } from "next/headers";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { row, run } from "./db";
import { readAuthAssertion } from "../../cloudflare/auth-assertion.mjs";

export const ADMIN_EMAIL = "anipins01@gmail.com";
export const COOKIE = "anipins_session";
export const ACCOUNTS_COOKIE = "anipins_accounts";

export const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 30,
  priority: "high" as const,
};

type StoredAccount = { userId: number; token: string };

function encodeAccounts(accounts: StoredAccount[]) {
  const payload = Buffer.from(JSON.stringify(accounts)).toString("base64url");
  const signature = crypto.createHmac("sha256", process.env.NEXTAUTH_SECRET || "").update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

export function storedAccounts(value?: string): StoredAccount[] {
  try {
    const [payload, signature] = String(value || "").split(".");
    if (!payload || !signature || !process.env.NEXTAUTH_SECRET) return [];
    const expected = crypto.createHmac("sha256", process.env.NEXTAUTH_SECRET).update(payload).digest("base64url");
    if (signature.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return [];
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    return Array.isArray(parsed) ? parsed.filter((item: any) => Number.isInteger(item?.userId) && /^[a-f0-9]{64}$/.test(item?.token || "")).slice(0, 4) : [];
  } catch { return []; }
}

export async function rememberAccountSession(request: { cookies: { get(name: string): { value?: string } | undefined } }, response: { cookies: { set(name: string, value: string, options: typeof SESSION_COOKIE_OPTIONS): void } }, token: string, userId: number) {
  const accounts = storedAccounts(request.cookies.get(ACCOUNTS_COOKIE)?.value);
  const previousToken = request.cookies.get(COOKIE)?.value;
  if (previousToken && previousToken !== token) {
    const previous = await row("SELECT user_id FROM sessions WHERE token=? AND expires_at>?", previousToken, Date.now());
    if (previous) accounts.push({ userId: Number(previous.user_id), token: previousToken });
  }
  const next = [{ userId, token }, ...accounts.filter(account => account.token !== token && account.userId !== userId)].slice(0, 4);
  response.cookies.set(ACCOUNTS_COOKIE, encodeAccounts(next), SESSION_COOKIE_OPTIONS);
}

export function accountCookieFor(accounts: StoredAccount[]) { return encodeAccounts(accounts); }

export type SessionUser = { id: number; email: string; name: string; nickname: string; avatar: string; cover: string; bio: string; is_public: number; notify_following: number; notify_updates: number; role: string };

export async function getUser(): Promise<SessionUser | null> {
  try {
    const assertion = await readAuthAssertion(await headers(), process.env.D1_RPC_SECRET || "");
    if (assertion) {
      const assertedUser = await row(
        "SELECT id, email, name, nickname, avatar, cover, bio, is_public, notify_following, notify_updates, role FROM users WHERE id = ? LIMIT 1",
        assertion.userId,
      );
      // Authorization attributes, including role, always come from the business profile database.
      return (assertedUser as SessionUser) || null;
    }
    const token = (await cookies()).get(COOKIE)?.value;
    if (!token) return null;
    const u = await row(
      "SELECT u.id, u.email, u.name, u.nickname, u.avatar, u.cover, u.bio, u.is_public, u.notify_following, u.notify_updates, u.role FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token = ? AND s.expires_at > ?",
      token, Date.now()
    );
    return (u as SessionUser) || null;
  } catch {
    return null;
  }
}

export function isAdmin(u: SessionUser | null) {
  return !!u && u.role === "ADMIN";
}

export async function createSession(userId: number, metadata: { ip?: string; ua?: string } = {}): Promise<string> {
  const token = crypto.randomBytes(32).toString("hex");
  await run("INSERT INTO sessions (token, user_id, expires_at, ip_address, user_agent) VALUES (?,?,?,?,?)",
    token, userId, Date.now() + 1000 * 60 * 60 * 24 * 30, metadata.ip || "", metadata.ua || "");
  return token;
}

export async function destroySession(token: string) {
  await run("DELETE FROM sessions WHERE token = ?", token);
}

export function hashPassword(p: string) { return bcrypt.hashSync(p, 10); }
export function checkPassword(p: string, h: string) { return bcrypt.compareSync(p, h); }
