-- D1-side operational tables absent from the old Postgres bootstrap schema.
-- These remain additive so the migration can be applied safely to staging.
CREATE TABLE IF NOT EXISTS mobile_auth_tickets (
  code_hash TEXT PRIMARY KEY NOT NULL,
  user_id INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  used_at INTEGER,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_mobile_auth_tickets_expiry ON mobile_auth_tickets(expires_at);

-- This table exists in the source Supabase database but is absent from the
-- checked-in application schema and currently has zero rows. Keep parity so
-- there is an explicit destination for any future build chunks.
CREATE TABLE IF NOT EXISTS anipins_build_chunks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  build_name TEXT NOT NULL,
  chunk_index INTEGER NOT NULL,
  chunk_data TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_anipins_build_chunks_name_index ON anipins_build_chunks(build_name, chunk_index);
