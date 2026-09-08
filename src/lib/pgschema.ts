export const PG_SCHEMA: string[] = [
  `CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY, email TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL,
    name TEXT DEFAULT '', nickname TEXT DEFAULT '', avatar TEXT DEFAULT '',
    role TEXT DEFAULT 'USER', created_at TIMESTAMPTZ DEFAULT now())`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS nickname TEXT DEFAULT ''`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar TEXT DEFAULT ''`,
  `CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY, user_id INTEGER NOT NULL, expires_at BIGINT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS artworks (
    id SERIAL PRIMARY KEY, title TEXT DEFAULT '', character_name TEXT NOT NULL, character_slug TEXT NOT NULL,
    anime_name TEXT NOT NULL, anime_slug TEXT NOT NULL, description TEXT DEFAULT '', tags TEXT DEFAULT '', gender TEXT DEFAULT '',
    category TEXT DEFAULT '', featured INTEGER DEFAULT 0, published INTEGER DEFAULT 1,
    orig TEXT NOT NULL, thumb TEXT NOT NULL, width INTEGER DEFAULT 0, height INTEGER DEFAULT 0,
    views INTEGER DEFAULT 0, downloads INTEGER DEFAULT 0, created_at TIMESTAMPTZ DEFAULT now())`,
  `ALTER TABLE artworks ADD COLUMN IF NOT EXISTS gender TEXT DEFAULT ''`,
  `CREATE INDEX IF NOT EXISTS idx_art_char ON artworks(character_slug)`,
  `CREATE INDEX IF NOT EXISTS idx_art_anime ON artworks(anime_slug)`,
  `CREATE INDEX IF NOT EXISTS idx_art_pub ON artworks(published)`,
  `CREATE TABLE IF NOT EXISTS collections (
    id SERIAL PRIMARY KEY, user_id INTEGER NOT NULL, name TEXT NOT NULL, created_at TIMESTAMPTZ DEFAULT now())`,
  `CREATE TABLE IF NOT EXISTS saves (
    id SERIAL PRIMARY KEY, user_id INTEGER NOT NULL, collection_id INTEGER NOT NULL, artwork_id INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(), UNIQUE(collection_id, artwork_id))`,
  `CREATE TABLE IF NOT EXISTS takedowns (
    id SERIAL PRIMARY KEY, name TEXT, email TEXT, artwork_url TEXT, reason TEXT, created_at TIMESTAMPTZ DEFAULT now())`,
  `CREATE TABLE IF NOT EXISTS likes (
    id SERIAL PRIMARY KEY, user_id INTEGER NOT NULL, artwork_id INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(), UNIQUE(user_id, artwork_id))`,
  `CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT)`,
  `INSERT INTO settings (key, value) VALUES
    ('site_name','AniPins'),
    ('tagline','Anime artwork for inspiration.'),
    ('instagram_handle','@_anipins_'),
    ('instagram_url','https://www.instagram.com/_anipins_?igsi=dzZzem42bnBha3Y=')
   ON CONFLICT (key) DO NOTHING`,
];
