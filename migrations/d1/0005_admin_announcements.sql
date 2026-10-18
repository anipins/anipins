CREATE TABLE IF NOT EXISTS admin_announcements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  body TEXT NOT NULL DEFAULT '',
  artwork_id INTEGER,
  created_by INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (artwork_id) REFERENCES artworks(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS admin_announcement_recipients (
  announcement_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  read_at TEXT,
  PRIMARY KEY (announcement_id, user_id),
  FOREIGN KEY (announcement_id) REFERENCES admin_announcements(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_admin_announcement_recipients_user
  ON admin_announcement_recipients(user_id, read_at, announcement_id);
