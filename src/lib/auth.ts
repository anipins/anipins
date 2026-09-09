import { cookies } from "next/headers";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { row, run } from "./db";

export const ADMIN_EMAIL = "anipins01@gmail.com";
export const COOKIE = "anipins_session";

export type SessionUser = { id: number; email: string; name: string; nickname: string; avatar: string; cover: string; bio: string; is_public: number; notify_following: number; notify_updates: number; role: string };

export async function getUser(): Promise<SessionUser | null> {
  try {
    const token = cookies().get(COOKIE)?.value;
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

export async function createSession(userId: number): Promise<string> {
  const token = crypto.randomBytes(32).toString("hex");
  await run("INSERT INTO sessions (token, user_id, expires_at) VALUES (?,?,?)",
    token, userId, Date.now() + 1000 * 60 * 60 * 24 * 30);
  return token;
}

export async function destroySession(token: string) {
  await run("DELETE FROM sessions WHERE token = ?", token);
}

export function hashPassword(p: string) { return bcrypt.hashSync(p, 10); }
export function checkPassword(p: string, h: string) { return bcrypt.compareSync(p, h); }
