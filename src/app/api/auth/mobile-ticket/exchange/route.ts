import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { COOKIE, createSession, SESSION_COOKIE_OPTIONS } from "@/lib/auth";
import { row, run } from "@/lib/db";

async function ensureTicketSchema() {
  await run(`CREATE TABLE IF NOT EXISTS mobile_auth_tickets (
    code_hash TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL,
    expires_at BIGINT NOT NULL,
    used_at BIGINT,
    created_at BIGINT NOT NULL
  )`);
}

export async function POST(req: NextRequest) {
  await ensureTicketSchema();
  const body = await req.json().catch(() => ({}));
  const ticket = String(body.ticket || "");
  if (!ticket || ticket.length > 200) return NextResponse.json({ error: "Invalid mobile sign-in ticket." }, { status: 400 });

  const codeHash = crypto.createHash("sha256").update(ticket).digest("hex");
  const now = Date.now();
  const entry = await row(
    "SELECT user_id FROM mobile_auth_tickets WHERE code_hash=? AND expires_at>? AND used_at IS NULL",
    codeHash,
    now,
  );
  if (!entry) return NextResponse.json({ error: "This mobile sign-in request expired. Please try again." }, { status: 401 });

  await run("UPDATE mobile_auth_tickets SET used_at=? WHERE code_hash=? AND used_at IS NULL", now, codeHash);
  const sessionToken = await createSession(entry.user_id, {
    ip: req.headers.get("x-forwarded-for") || "",
    ua: req.headers.get("user-agent") || "",
  });
  await run("DELETE FROM mobile_auth_tickets WHERE expires_at<=? OR used_at IS NOT NULL", now);

  const response = NextResponse.json({ ok: true, sessionToken }, { headers: { "Cache-Control": "no-store" } });
  response.cookies.set(COOKIE, sessionToken, SESSION_COOKIE_OPTIONS);
  return response;
}
