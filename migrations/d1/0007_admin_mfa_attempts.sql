CREATE TABLE IF NOT EXISTS admin_mfa_attempts (
  session_id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  attempt_count INTEGER NOT NULL DEFAULT 0,
  window_started_at INTEGER NOT NULL,
  locked_until INTEGER NOT NULL DEFAULT 0
);
