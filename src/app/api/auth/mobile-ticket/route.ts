import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { row, run } from "@/lib/db";

const TICKET_TTL = 2 * 60_000;

async function ensureTicketSchema() {
  await run(`CREATE TABLE IF NOT EXISTS mobile_auth_tickets (
    code_hash TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL,
    expires_at BIGINT NOT NULL,
    used_at BIGINT,
    created_at BIGINT NOT NULL
  )`);
  await run("CREATE INDEX IF NOT EXISTS idx_mobile_auth_tickets_expiry ON mobile_auth_tickets(expires_at)");
}

export async function POST(req: NextRequest) {
  await ensureTicketSchema();
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const ticket = crypto.randomBytes(32).toString("base64url");
  const codeHash = crypto.createHash("sha256").update(ticket).digest("hex");
  const now = Date.now();
  await run("DELETE FROM mobile_auth_tickets WHERE expires_at<=? OR used_at IS NOT NULL", now);
  await run(
    "INSERT INTO mobile_auth_tickets (code_hash,user_id,expires_at,created_at) VALUES (?,?,?,?)",
    codeHash,
    user.id,
    now + TICKET_TTL,
    now,
  );
  return NextResponse.json({ ticket }, { headers: { "Cache-Control": "no-store" } });
}
