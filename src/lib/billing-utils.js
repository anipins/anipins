const crypto = require("crypto");

function isPremiumSubscriptionStatus(status) {
  // Razorpay keeps a subscription's paid access period after it is cancelled
  // at cycle end. billing.ts separately checks current_end, so a cancelled
  // row unlocks only while that already-paid period is still valid.
  return status === "active" || status === "cancelled";
}

function verifyWebhookSignature(body, signature, secret) {
  if (!body || !signature || !secret) return false;
  const expected = crypto.createHmac("sha256", secret).update(body).digest("hex");
  const received = Buffer.from(signature, "utf8");
  const generated = Buffer.from(expected, "utf8");
  return received.length === generated.length && crypto.timingSafeEqual(received, generated);
}

module.exports = { isPremiumSubscriptionStatus, verifyWebhookSignature };
