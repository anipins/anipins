import { NextRequest, NextResponse } from "next/server";
import { ACCOUNTS_COOKIE, accountCookieFor, COOKIE, SESSION_COOKIE_OPTIONS, storedAccounts } from "@/lib/auth";
import { row, rows } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const accounts = storedAccounts(req.cookies.get(ACCOUNTS_COOKIE)?.value);
  if (!accounts.length) return NextResponse.json({ accounts: [] }, { headers: { "Cache-Control": "private, no-store" } });
  const tokens = accounts.map(account => account.token);
  const found = await rows(
    `SELECT s.token, u.id, u.name, u.nickname, u.email, u.avatar, u.role
     FROM sessions s JOIN users u ON u.id=s.user_id
     WHERE s.token IN (${tokens.map(() => "?").join(",")}) AND s.expires_at>?`,
    ...tokens, Date.now(),
  );
  const byToken = new Map(found.map((account: any) => [account.token, account]));
  const active = req.cookies.get(COOKIE)?.value || "";
  const visible = accounts.map(account => byToken.get(account.token)).filter(Boolean).map((account: any) => ({
    id: account.id, name: account.nickname || account.name || account.email, email: account.email,
    avatar: account.avatar, role: account.role, active: account.token === active,
  }));
  return NextResponse.json({ accounts: visible }, { headers: { "Cache-Control": "private, no-store" } });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const userId = Number(body.userId);
  const accounts = storedAccounts(req.cookies.get(ACCOUNTS_COOKIE)?.value);
  const selected = accounts.find(account => account.userId === userId);
  if (!selected) return NextResponse.json({ error: "Account is not available on this device." }, { status: 404 });
  const session = await row("SELECT user_id FROM sessions WHERE token=? AND user_id=? AND expires_at>?", selected.token, userId, Date.now());
  if (!session) return NextResponse.json({ error: "This saved session has expired. Sign in again to restore it." }, { status: 401 });
  const ordered = [selected, ...accounts.filter(account => account.token !== selected.token)].slice(0, 4);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE, selected.token, SESSION_COOKIE_OPTIONS);
  res.cookies.set(ACCOUNTS_COOKIE, accountCookieFor(ordered), SESSION_COOKIE_OPTIONS);
  return res;
}
