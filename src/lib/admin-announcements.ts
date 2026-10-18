import { run, USE_D1, USE_PG } from "@/lib/db";

let schemaReady: Promise<void> | null = null;

export function ensureAdminAnnouncementSchema() {
  if (!schemaReady) schemaReady = (async () => {
    if (USE_D1) return; // D1 uses the checked-in 0005 migration.
    if (USE_PG) {
      await run(`CREATE TABLE IF NOT EXISTS admin_announcements (
        id BIGSERIAL PRIMARY KEY, title TEXT NOT NULL, body TEXT NOT NULL DEFAULT '', artwork_id BIGINT,
        created_by BIGINT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        FOREIGN KEY (artwork_id) REFERENCES artworks(id) ON DELETE SET NULL
      )`);
      await run(`CREATE TABLE IF NOT EXISTS admin_announcement_recipients (
        announcement_id BIGINT NOT NULL, user_id BIGINT NOT NULL, read_at TIMESTAMPTZ,
        PRIMARY KEY (announcement_id,user_id),
        FOREIGN KEY (announcement_id) REFERENCES admin_announcements(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )`);
      await run("CREATE INDEX IF NOT EXISTS idx_admin_announcement_recipients_user ON admin_announcement_recipients(user_id, read_at, announcement_id)");
      return;
    }
    await run(`CREATE TABLE IF NOT EXISTS admin_announcements (
      id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, body TEXT NOT NULL DEFAULT '', artwork_id INTEGER,
      created_by INTEGER NOT NULL, created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (artwork_id) REFERENCES artworks(id) ON DELETE SET NULL
    )`);
    await run(`CREATE TABLE IF NOT EXISTS admin_announcement_recipients (
      announcement_id INTEGER NOT NULL, user_id INTEGER NOT NULL, read_at TEXT,
      PRIMARY KEY (announcement_id,user_id),
      FOREIGN KEY (announcement_id) REFERENCES admin_announcements(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`);
    await run("CREATE INDEX IF NOT EXISTS idx_admin_announcement_recipients_user ON admin_announcement_recipients(user_id, read_at, announcement_id)");
  })().catch(error => { schemaReady = null; throw error; });
  return schemaReady;
}
