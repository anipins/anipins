const crypto = require("crypto");

function isPremiumSubscriptionStatus(status) {
  return status === "active";
}

function verifyWebhookSignature(body, signature, secret) {
  if (!body || !signature || !secret) return false;
  const expected = crypto.createHmac("sha256", secret).update(body).digest("hex");
  const received = Buffer.from(signature, "utf8");
  const generated = Buffer.from(expected, "utf8");
  return received.length === generated.length && crypto.timingSafeEqual(received, generated);
}

module.exports = { isPremiumSubscriptionStatus, verifyWebhookSignature };
