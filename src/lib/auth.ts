import { getDb } from './db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'anipins-secret-key-2024';
const COOKIE_NAME = 'anipins_session';
const EXPIRY = 7 * 24 * 60 * 60 * 1000;

export interface User {
  id: string;
  email: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  role: string;
  is_active: number;
  created_at: string;
}

export async function hashPassword(pw: string) {
  return bcrypt.hash(pw, 12);
}

export async function verifyPassword(pw: string, hash: string) {
  return bcrypt.compare(pw, hash);
}

export function generateToken(userId: string) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): { userId: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string };
  } catch { return null; }
}

export async function createUser(email: string, password: string, username?: string): Promise<User> {
  const db = getDb();
  const id = uuidv4();
  const hash = await hashPassword(password);
  const uname = username || email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '_');
  db.prepare(`INSERT INTO users (id, email, username, display_name, password_hash, role) VALUES (?,?,?,?,?,?)`)
    .run(id, email, uname, uname, hash, 'user');
  return db.prepare('SELECT * FROM users WHERE id=?').get(id) as User;
}

export async function authenticateUser(email: string, password: string): Promise<User | null> {
  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE email=? AND is_active=1').get(email) as any;
  if (!user) return null;
  const valid = await verifyPassword(password, user.password_hash);
  if (!valid) return null;
  return user as User;
}

export function createSession(userId: string): string {
  const db = getDb();
  const id = uuidv4();
  const token = generateToken(userId);
  const exp = new Date(Date.now() + EXPIRY).toISOString();
  // Clean old sessions first
  db.prepare("DELETE FROM sessions WHERE user_id=? OR expires_at<datetime('now')").run(userId);
  db.prepare('INSERT INTO sessions (id,user_id,token,expires_at) VALUES (?,?,?,?)').run(id, userId, token, exp);
  return token;
}

export function getSessionUser(token: string): User | null {
  const db = getDb();
  const payload = verifyToken(token);
  if (!payload) return null;
  const session = db.prepare("SELECT * FROM sessions WHERE token=? AND expires_at>datetime('now')").get(token);
  if (!session) return null;
  return db.prepare('SELECT * FROM users WHERE id=? AND is_active=1').get(payload.userId) as User | null;
}

export function getSessionFromRequest(request: NextRequest): User | null {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return getSessionUser(token);
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    const store = await cookies();
    const token = store.get(COOKIE_NAME)?.value;
    if (!token) return null;
    return getSessionUser(token);
  } catch { return null; }
}

export function isAdmin(u: User | null) { return u?.role === 'admin' || u?.role === 'super_admin'; }
export function isSuperAdmin(u: User | null) { return u?.role === 'super_admin'; }
export function isMod(u: User | null) { return ['moderator','admin','super_admin'].includes(u?.role || ''); }
