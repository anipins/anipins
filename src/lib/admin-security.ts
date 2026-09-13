import crypto from "crypto";
import { row, rows, run } from "./db";

let schemaReady: Promise<void> | null = null;
export function ensureSecuritySchema() {
  if (!schemaReady) schemaReady = (async () => {
    if (!process.env.DATABASE_URL) { await rows("SELECT 1"); return; }
    const statements = [
      "ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_secret TEXT DEFAULT ''",
      "ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_pending_secret TEXT DEFAULT ''",
      "ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_enabled INTEGER DEFAULT 0",
      "ALTER TABLE users ADD COLUMN IF NOT EXISTS recovery_codes TEXT DEFAULT ''",
      "ALTER TABLE sessions ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now()",
      "ALTER TABLE sessions ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ DEFAULT now()",
      "ALTER TABLE sessions ADD COLUMN IF NOT EXISTS ip_address TEXT DEFAULT ''",
      "ALTER TABLE sessions ADD COLUMN IF NOT EXISTS user_agent TEXT DEFAULT ''",
      "CREATE TABLE IF NOT EXISTS login_challenges (token TEXT PRIMARY KEY, user_id INTEGER NOT NULL, expires_at BIGINT NOT NULL, ip_address TEXT DEFAULT '', user_agent TEXT DEFAULT '')",
      "CREATE TABLE IF NOT EXISTS security_alerts (id SERIAL PRIMARY KEY, user_id INTEGER NOT NULL, kind TEXT NOT NULL, message TEXT NOT NULL, ip_address TEXT DEFAULT '', user_agent TEXT DEFAULT '', read_at TIMESTAMPTZ, created_at TIMESTAMPTZ DEFAULT now())",
      "CREATE TABLE IF NOT EXISTS admin_audit_log (id SERIAL PRIMARY KEY, admin_id INTEGER NOT NULL, action TEXT NOT NULL, target_type TEXT DEFAULT '', target_id TEXT DEFAULT '', detail TEXT DEFAULT '', ip_address TEXT DEFAULT '', created_at TIMESTAMPTZ DEFAULT now())",
      "CREATE INDEX IF NOT EXISTS idx_security_alerts_user ON security_alerts(user_id, id)",
      "CREATE INDEX IF NOT EXISTS idx_admin_audit ON admin_audit_log(admin_id, id)",
      "ALTER TABLE public.login_challenges ENABLE ROW LEVEL SECURITY",
      "ALTER TABLE public.security_alerts ENABLE ROW LEVEL SECURITY",
      "ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY",
      "REVOKE ALL ON TABLE public.login_challenges, public.security_alerts, public.admin_audit_log FROM anon, authenticated",
    ];
    for (const statement of statements) await run(statement);
  })().catch(error => { schemaReady = null; throw error; });
  return schemaReady;
}

const B32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
export function generateTotpSecret() {
  const bytes = crypto.randomBytes(20); let output = "", bits = 0, value = 0;
  for (const byte of bytes) { value = (value << 8) | byte; bits += 8; while (bits >= 5) { output += B32[(value >>> (bits - 5)) & 31]; bits -= 5; } }
  if (bits) output += B32[(value << (5 - bits)) & 31];
  return output;
}
function decodeBase32(input: string) {
  let bits = 0, value = 0; const bytes: number[] = [];
  for (const char of input.replace(/=|\s/g, "").toUpperCase()) { const index = B32.indexOf(char); if (index < 0) continue; value = (value << 5) | index; bits += 5; if (bits >= 8) { bytes.push((value >>> (bits - 8)) & 255); bits -= 8; } }
  return Buffer.from(bytes);
}
function totp(secret: string, step: number) {
  const counter = Buffer.alloc(8); counter.writeBigUInt64BE(BigInt(step));
  const digest = crypto.createHmac("sha1", decodeBase32(secret)).update(counter).digest();
  const offset = digest[digest.length - 1] & 15;
  return (((digest.readUInt32BE(offset) & 0x7fffffff) % 1_000_000).toString().padStart(6, "0"));
}
export function verifyTotp(secret: string, code: string) {
  const clean = code.replace(/\s/g, ""); if (!/^\d{6}$/.test(clean)) return false;
  const step = Math.floor(Date.now() / 30_000);
  return [-1, 0, 1].some(offset => crypto.timingSafeEqual(Buffer.from(totp(secret, step + offset)), Buffer.from(clean)));
}

function encryptionKey() {
  const source = process.env.ADMIN_2FA_ENCRYPTION_KEY || process.env.ADMIN_PASSWORD;
  if (!source || source.length < 12) throw new Error("Admin security encryption key is not configured.");
  return crypto.createHash("sha256").update(source).digest();
}
export function encryptSecret(secret: string) {
  const iv = crypto.randomBytes(12); const cipher = crypto.createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(secret, "utf8"), cipher.final()]);
  return [iv, cipher.getAuthTag(), encrypted].map(value => value.toString("base64url")).join(".");
}
export function decryptSecret(value: string) {
  const [iv, tag, encrypted] = value.split(".").map(part => Buffer.from(part, "base64url"));
  const decipher = crypto.createDecipheriv("aes-256-gcm", encryptionKey(), iv); decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
}
export function hashRecovery(code: string) { return crypto.createHash("sha256").update(code.replace(/\s|-/g, "").toUpperCase()).digest("hex"); }
export function createRecoveryCodes() { return Array.from({ length: 8 }, () => `${crypto.randomBytes(3).toString("hex")}-${crypto.randomBytes(3).toString("hex")}`.toUpperCase()); }

export function requestInfo(req: Request) {
  return { ip: (req.headers.get("x-forwarded-for")?.split(",")[0] || req.headers.get("x-real-ip") || "unknown").trim().slice(0, 80), ua: (req.headers.get("user-agent") || "Unknown device").slice(0, 500) };
}
export async function audit(adminId: number, action: string, targetType = "", targetId = "", detail = "", ip = "") {
  await ensureSecuritySchema(); await run("INSERT INTO admin_audit_log (admin_id,action,target_type,target_id,detail,ip_address) VALUES (?,?,?,?,?,?)", adminId, action, targetType, targetId, detail.slice(0, 2000), ip);
}
export async function createLoginAlert(userId: number, ip: string, ua: string) {
  await run("INSERT INTO security_alerts (user_id,kind,message,ip_address,user_agent) VALUES (?,?,?,?,?)", userId, "NEW_LOGIN", "New administrator sign-in", ip, ua);
  const key = process.env.RESEND_API_KEY; if (!key) return;
  const user = await row("SELECT email FROM users WHERE id=?", userId); if (!user?.email) return;
  await fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" }, body: JSON.stringify({ from: process.env.SECURITY_EMAIL_FROM || "AniPins Security <security@anipins.com>", to: [user.email], subject: "New administrator login to AniPins", text: `A new administrator login was completed.\n\nIP: ${ip}\nDevice: ${ua}\n\nIf this was not you, open Admin Security and revoke the session immediately.` }) }).catch(() => {});
}
