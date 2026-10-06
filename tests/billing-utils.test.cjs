const test = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const { isPremiumSubscriptionStatus, verifyWebhookSignature } = require("../src/lib/billing-utils");

test("active subscriptions and paid cancellation periods unlock AniPins Premium", () => {
  assert.equal(isPremiumSubscriptionStatus("active"), true);
  assert.equal(isPremiumSubscriptionStatus("cancelled"), true);
  assert.equal(isPremiumSubscriptionStatus("authenticated"), false);
});

test("accepts a Razorpay webhook only when its HMAC is valid", () => {
  const body = '{"event":"subscription.activated"}';
  const secret = "webhook-test-secret";
  const signature = crypto.createHmac("sha256", secret).update(body).digest("hex");
  assert.equal(verifyWebhookSignature(body, signature, secret), true);
  assert.equal(verifyWebhookSignature(body, "invalid", secret), false);
});
