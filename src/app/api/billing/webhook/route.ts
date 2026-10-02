import { NextRequest, NextResponse } from "next/server";
import { row } from "@/lib/db";
import { storeSubscription } from "@/lib/billing";
import { verifyWebhookSignature } from "@/lib/billing-utils";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET?.trim();
  if (!secret) return NextResponse.json({ error: "Webhook is not configured." }, { status: 503 });
  const rawBody = await req.text();
  const signature = req.headers.get("x-razorpay-signature") || "";
  if (!verifyWebhookSignature(rawBody, signature, secret)) return NextResponse.json({ error: "Invalid signature." }, { status: 401 });
  const event = JSON.parse(rawBody);
  const subscription = event?.payload?.subscription?.entity;
  if (!subscription?.id) return NextResponse.json({ ok: true, ignored: true });
  const existing = await row("SELECT user_id FROM billing_subscriptions WHERE subscription_id=?", String(subscription.id));
  if (!existing?.user_id) return NextResponse.json({ ok: true, ignored: true });
  await storeSubscription({ subscription_id: String(subscription.id), user_id: Number(existing.user_id), status: String(subscription.status || "created"), payment_id: String(subscription.payment_id || ""), current_end: Number(subscription.current_end || 0), cancel_at_cycle_end: Number(!!subscription.cancel_at_cycle_end) });
  return NextResponse.json({ ok: true });
}
