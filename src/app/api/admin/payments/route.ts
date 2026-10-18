import { NextResponse } from "next/server";
import { rows } from "@/lib/db";
import { getUser, isAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getUser();
  if (!isAdmin(user)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const subscriptions = await rows(
    `SELECT b.subscription_id, b.payment_id, b.status, b.current_end,
      b.cancel_at_cycle_end, b.created_at, b.updated_at, u.id AS user_id, u.name, u.email
     FROM billing_subscriptions b LEFT JOIN users u ON u.id=b.user_id
     ORDER BY b.updated_at DESC LIMIT 500`,
  );
  const transactions = await rows(
    `SELECT t.event_id, t.payment_id, t.subscription_id, t.event_type, t.status,
      t.amount, t.currency, t.method, t.occurred_at, u.id AS user_id, u.name, u.email
     FROM billing_transactions t LEFT JOIN users u ON u.id=t.user_id
     ORDER BY t.occurred_at DESC LIMIT 1000`,
  );
  return NextResponse.json({ subscriptions, transactions }, { headers: { "Cache-Control": "private, no-store" } });
}
