CREATE TABLE IF NOT EXISTS billing_transactions (
  event_id TEXT PRIMARY KEY,
  payment_id TEXT NOT NULL,
  subscription_id TEXT NOT NULL DEFAULT '',
  user_id INTEGER NOT NULL,
  event_type TEXT NOT NULL,
  status TEXT NOT NULL,
  amount BIGINT,
  currency TEXT NOT NULL DEFAULT '',
  method TEXT NOT NULL DEFAULT '',
  occurred_at BIGINT NOT NULL,
  created_at BIGINT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_billing_transactions_user_time
  ON billing_transactions(user_id, occurred_at DESC);
