CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT DEFAULT '',
  nickname TEXT DEFAULT '',
  avatar TEXT DEFAULT '',
  cover TEXT DEFAULT '',
  bio TEXT DEFAULT '',
  is_public INTEGER DEFAULT 1,
  notify_following INTEGER DEFAULT 1,
  notify_updates INTEGER DEFAULT 1,
  two_factor_secret TEXT DEFAULT '',
  two_factor_pending_secret TEXT DEFAULT '',
  two_factor_enabled INTEGER DEFAULT 0,
  recovery_codes TEXT DEFAULT '',
  role TEXT DEFAULT 'USER',
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS auth_identities (
  provider TEXT NOT NULL,
  provider_subject TEXT NOT NULL,
  user_id INTEGER NOT NULL,
  email TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL,
  PRIMARY KEY (provider, provider_subject),
  UNIQUE (provider, user_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_auth_identities_user ON auth_identities(user_id);
CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  last_seen_at TEXT DEFAULT (datetime('now')),
  ip_address TEXT DEFAULT '',
  user_agent TEXT DEFAULT ''
);
CREATE TABLE IF NOT EXISTS login_challenges (token TEXT PRIMARY KEY, user_id INTEGER NOT NULL, expires_at INTEGER NOT NULL, ip_address TEXT DEFAULT '', user_agent TEXT DEFAULT '');
CREATE TABLE IF NOT EXISTS security_alerts (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, kind TEXT NOT NULL, message TEXT NOT NULL, ip_address TEXT DEFAULT '', user_agent TEXT DEFAULT '', read_at TEXT, created_at TEXT DEFAULT (datetime('now')));
CREATE TABLE IF NOT EXISTS admin_audit_log (id INTEGER PRIMARY KEY AUTOINCREMENT, admin_id INTEGER NOT NULL, action TEXT NOT NULL, target_type TEXT DEFAULT '', target_id TEXT DEFAULT '', detail TEXT DEFAULT '', ip_address TEXT DEFAULT '', created_at TEXT DEFAULT (datetime('now')));
CREATE INDEX IF NOT EXISTS idx_security_alerts_user ON security_alerts(user_id, id);
CREATE INDEX IF NOT EXISTS idx_admin_audit ON admin_audit_log(admin_id, id);
CREATE TABLE IF NOT EXISTS artworks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT DEFAULT '',
  character_name TEXT NOT NULL,
  character_slug TEXT NOT NULL,
  anime_name TEXT NOT NULL,
  anime_slug TEXT NOT NULL,
  description TEXT DEFAULT '',
  tags TEXT DEFAULT '',
  gender TEXT DEFAULT '',
  category TEXT DEFAULT '',
  featured INTEGER DEFAULT 0,
  published INTEGER DEFAULT 1,
  orig TEXT NOT NULL,
  thumb TEXT NOT NULL,
  width INTEGER DEFAULT 0,
  height INTEGER DEFAULT 0,
  views INTEGER DEFAULT 0,
  downloads INTEGER DEFAULT 0,
  content_hash TEXT DEFAULT '',
  perceptual_hash TEXT DEFAULT '',
  creator_name TEXT DEFAULT '',
  source_url TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_art_char ON artworks(character_slug);
CREATE INDEX IF NOT EXISTS idx_art_anime ON artworks(anime_slug);
CREATE INDEX IF NOT EXISTS idx_art_pub ON artworks(published);
CREATE INDEX IF NOT EXISTS idx_art_content_hash ON artworks(content_hash);
CREATE INDEX IF NOT EXISTS idx_art_perceptual_hash ON artworks(perceptual_hash);
CREATE TABLE IF NOT EXISTS collections (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  is_private INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS saves (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  collection_id INTEGER NOT NULL,
  artwork_id INTEGER NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(collection_id, artwork_id)
);
CREATE TABLE IF NOT EXISTS takedowns (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT, email TEXT, artwork_url TEXT, reason TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS likes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  artwork_id INTEGER NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(user_id, artwork_id)
);
CREATE TABLE IF NOT EXISTS content_reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  artwork_id INTEGER NOT NULL,
  reason TEXT NOT NULL,
  details TEXT DEFAULT '',
  status TEXT DEFAULT 'OPEN',
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_content_reports_artwork ON content_reports(artwork_id, status);
CREATE TABLE IF NOT EXISTS push_devices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  token TEXT UNIQUE NOT NULL,
  platform TEXT DEFAULT 'android',
  updated_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_push_devices_user ON push_devices(user_id);
CREATE TABLE IF NOT EXISTS telemetry (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kind TEXT NOT NULL,
  path TEXT DEFAULT '',
  value INTEGER DEFAULT 0,
  detail TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS interactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  artwork_id INTEGER NOT NULL,
  kind TEXT NOT NULL,
  strength INTEGER DEFAULT 1,
  updated_at TEXT DEFAULT (datetime('now')),
  UNIQUE(user_id, artwork_id, kind)
);
CREATE INDEX IF NOT EXISTS idx_interactions_user ON interactions(user_id, updated_at);
CREATE INDEX IF NOT EXISTS idx_interactions_artwork ON interactions(artwork_id);
CREATE TABLE IF NOT EXISTS follows (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  kind TEXT NOT NULL,
  value TEXT NOT NULL,
  label TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(user_id, kind, value)
);
CREATE INDEX IF NOT EXISTS idx_follows_target ON follows(kind, value);
CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  artwork_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  body TEXT DEFAULT '',
  read_at TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(user_id, artwork_id)
);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, read_at, id);
CREATE INDEX IF NOT EXISTS idx_notifications_artwork ON notifications(artwork_id);
CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT);
INSERT OR IGNORE INTO settings (key, value) VALUES
 ('site_name','AniPins'),
 ('tagline','Anime artwork for inspiration.'),
 ('instagram_handle','@_anipins_'),
 ('instagram_url','https://www.instagram.com/_anipins_?igsi=dzZzem42bnBha3Y=');
