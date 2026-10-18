export function extractRazorpayPaymentEvent(event, userId) {
  const payment = event?.payload?.payment?.entity;
  if (!payment?.id) return null;

  const eventType = String(event?.event || "payment.updated");
  const paymentId = String(payment.id);
  const eventCreatedAt = Number(event?.created_at);
  const paymentCreatedAt = Number(payment.created_at);
  const occurredAt = Number.isFinite(paymentCreatedAt) && paymentCreatedAt > 0
    ? paymentCreatedAt
    : Number.isFinite(eventCreatedAt) && eventCreatedAt > 0 ? eventCreatedAt : Math.floor(Date.now() / 1000);

  return {
    event_id: String(event?.id || `${eventType}:${paymentId}:${Number.isFinite(eventCreatedAt) ? eventCreatedAt : occurredAt}`),
    payment_id: paymentId,
    subscription_id: String(payment.subscription_id || event?.payload?.subscription?.entity?.id || ""),
    user_id: Number(userId),
    event_type: eventType,
    status: String(payment.status || eventType.split(".").at(-1) || "unknown"),
    amount: Number.isFinite(Number(payment.amount)) ? Number(payment.amount) : null,
    currency: payment.currency ? String(payment.currency) : "",
    method: payment.method ? String(payment.method) : "",
    occurred_at: occurredAt,
  };
}
