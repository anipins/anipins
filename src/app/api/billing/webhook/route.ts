import { NextRequest, NextResponse } from "next/server";
import { row } from "@/lib/db";
import { storeRazorpayPaymentEvent, storeSubscription } from "@/lib/billing";
import { verifyWebhookSignature } from "@/lib/billing-utils";
import { extractRazorpayPaymentEvent } from "@/lib/razorpay-transaction.mjs";

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
  const payment = event?.payload?.payment?.entity;
  const subscriptionId = String(subscription?.id || payment?.subscription_id || "");
  if (!subscriptionId) return NextResponse.json({ ok: true, ignored: true });
  const existing = await row("SELECT user_id FROM billing_subscriptions WHERE subscription_id=?", subscriptionId);
  if (!existing?.user_id) return NextResponse.json({ ok: true, ignored: true });
  const eventCreatedAt = Number(event?.created_at);
  if (subscription?.id) {
    await storeSubscription({
      subscription_id: String(subscription.id),
      user_id: Number(existing.user_id),
      status: String(subscription.status || "created"),
      payment_id: String(subscription.payment_id || ""),
      current_end: Number(subscription.current_end || 0),
      cancel_at_cycle_end: Number(!!subscription.cancel_at_cycle_end),
      eventCreatedAt: Number.isFinite(eventCreatedAt) && eventCreatedAt > 0 ? eventCreatedAt : null,
    });
  }
  const transaction = extractRazorpayPaymentEvent(event, Number(existing.user_id));
  if (transaction) await storeRazorpayPaymentEvent(transaction);
  return NextResponse.json({ ok: true });
}
