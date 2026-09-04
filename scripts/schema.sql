CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT DEFAULT '',
  role TEXT DEFAULT 'USER',
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS artworks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT DEFAULT '',
  character_name TEXT NOT NULL,
  character_slug TEXT NOT NULL,
  anime_name TEXT NOT NULL,
  anime_slug TEXT NOT NULL,
  description TEXT DEFAULT '',
  tags TEXT DEFAULT '',
  category TEXT DEFAULT '',
  featured INTEGER DEFAULT 0,
  published INTEGER DEFAULT 1,
  orig TEXT NOT NULL,
  thumb TEXT NOT NULL,
  width INTEGER DEFAULT 0,
  height INTEGER DEFAULT 0,
  views INTEGER DEFAULT 0,
  downloads INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_art_char ON artworks(character_slug);
CREATE INDEX IF NOT EXISTS idx_art_anime ON artworks(anime_slug);
CREATE INDEX IF NOT EXISTS idx_art_pub ON artworks(published);
CREATE TABLE IF NOT EXISTS collections (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  name TEXT NOT NULL,
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
CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT);
INSERT OR IGNORE INTO settings (key, value) VALUES
 ('site_name','AniPins'),
 ('tagline','Anime artwork for inspiration.'),
 ('instagram_handle','@_anipins_'),
 ('instagram_url','https://www.instagram.com/_anipins_?igsi=dzZzem42bnBha3Y=');
