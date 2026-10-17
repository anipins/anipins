-- Bind Better Auth identities to AniPins business/profile IDs without making
-- Better Auth metadata authoritative for admin or subscription privileges.
CREATE TABLE IF NOT EXISTS better_auth_user_link (
  auth_user_id TEXT PRIMARY KEY NOT NULL REFERENCES better_auth_user(id) ON DELETE CASCADE,
  anipins_user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_better_auth_user_link_business_id
  ON better_auth_user_link(anipins_user_id);
