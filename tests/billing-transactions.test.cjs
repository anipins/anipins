const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

test("extracts a transaction row from a signed Razorpay payment event", async () => {
  const { extractRazorpayPaymentEvent } = await import("../src/lib/razorpay-transaction.mjs");
  const result = extractRazorpayPaymentEvent({
    id: "evt_123",
    event: "payment.captured",
    created_at: 1_760_000_000,
    payload: {
      payment: { entity: { id: "pay_123", status: "captured", amount: 19900, currency: "INR", method: "upi", created_at: 1_759_999_000, subscription_id: "sub_123" } },
    },
  }, 42);

  assert.deepEqual(result, {
    event_id: "evt_123",
    payment_id: "pay_123",
    subscription_id: "sub_123",
    user_id: 42,
    event_type: "payment.captured",
    status: "captured",
    amount: 19900,
    currency: "INR",
    method: "upi",
    occurred_at: 1_759_999_000,
  });
});

test("uses a stable fallback key and ignores webhook events without a payment", async () => {
  const { extractRazorpayPaymentEvent } = await import("../src/lib/razorpay-transaction.mjs");
  assert.equal(extractRazorpayPaymentEvent({ event: "subscription.activated", payload: {} }, 42), null);
  const result = extractRazorpayPaymentEvent({
    event: "payment.failed",
    created_at: 1_700_000_010,
    payload: { payment: { entity: { id: "pay_failed", status: "failed", amount: 19900, currency: "INR" } } },
  }, 42);
  assert.equal(result.event_id, "payment.failed:pay_failed:1700000010");
  assert.equal(result.occurred_at, 1_700_000_010);
});

test("stores webhook transactions idempotently and exposes them only through the admin payment route", () => {
  const root = path.resolve(__dirname, "..");
  const webhook = fs.readFileSync(path.join(root, "src/app/api/billing/webhook/route.ts"), "utf8");
  const billing = fs.readFileSync(path.join(root, "src/lib/billing.ts"), "utf8");
  const adminRoute = fs.readFileSync(path.join(root, "src/app/api/admin/payments/route.ts"), "utf8");
  const migration = fs.readFileSync(path.join(root, "migrations/d1/0006_billing_transactions.sql"), "utf8");
  assert.match(webhook, /verifyWebhookSignature/);
  assert.match(webhook, /storeRazorpayPaymentEvent/);
  assert.match(billing, /ON CONFLICT \(event_id\) DO NOTHING/);
  assert.match(adminRoute, /isAdmin\(user\)/);
  assert.match(adminRoute, /FROM billing_transactions/);
  assert.match(migration, /CREATE TABLE IF NOT EXISTS billing_transactions/);
});
