export const PG_SCHEMA: string[] = [
  `CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY, email TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL,
    name TEXT DEFAULT '', nickname TEXT DEFAULT '', avatar TEXT DEFAULT '', cover TEXT DEFAULT '', bio TEXT DEFAULT '',
    is_public INTEGER DEFAULT 1, notify_following INTEGER DEFAULT 1, notify_updates INTEGER DEFAULT 1,
    role TEXT DEFAULT 'USER', created_at TIMESTAMPTZ DEFAULT now())`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS nickname TEXT DEFAULT ''`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar TEXT DEFAULT ''`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS cover TEXT DEFAULT ''`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT DEFAULT ''`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS is_public INTEGER DEFAULT 1`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS notify_following INTEGER DEFAULT 1`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS notify_updates INTEGER DEFAULT 1`,
  `CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY, user_id INTEGER NOT NULL, expires_at BIGINT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS artworks (
    id SERIAL PRIMARY KEY, title TEXT DEFAULT '', character_name TEXT NOT NULL, character_slug TEXT NOT NULL,
    anime_name TEXT NOT NULL, anime_slug TEXT NOT NULL, description TEXT DEFAULT '', tags TEXT DEFAULT '', gender TEXT DEFAULT '',
    category TEXT DEFAULT '', featured INTEGER DEFAULT 0, published INTEGER DEFAULT 1,
    orig TEXT NOT NULL, thumb TEXT NOT NULL, width INTEGER DEFAULT 0, height INTEGER DEFAULT 0,
    views INTEGER DEFAULT 0, downloads INTEGER DEFAULT 0, content_hash TEXT DEFAULT '', perceptual_hash TEXT DEFAULT '',
    creator_name TEXT DEFAULT '', source_url TEXT DEFAULT '', created_at TIMESTAMPTZ DEFAULT now())`,
  `ALTER TABLE artworks ADD COLUMN IF NOT EXISTS gender TEXT DEFAULT ''`,
  `ALTER TABLE artworks ADD COLUMN IF NOT EXISTS content_hash TEXT DEFAULT ''`,
  `ALTER TABLE artworks ADD COLUMN IF NOT EXISTS perceptual_hash TEXT DEFAULT ''`,
  `ALTER TABLE artworks ADD COLUMN IF NOT EXISTS creator_name TEXT DEFAULT ''`,
  `ALTER TABLE artworks ADD COLUMN IF NOT EXISTS source_url TEXT DEFAULT ''`,
  `CREATE INDEX IF NOT EXISTS idx_art_char ON artworks(character_slug)`,
  `CREATE INDEX IF NOT EXISTS idx_art_anime ON artworks(anime_slug)`,
  `CREATE INDEX IF NOT EXISTS idx_art_pub ON artworks(published)`,
  `CREATE TABLE IF NOT EXISTS collections (
    id SERIAL PRIMARY KEY, user_id INTEGER NOT NULL, name TEXT NOT NULL, is_private INTEGER DEFAULT 1, created_at TIMESTAMPTZ DEFAULT now())`,
  `ALTER TABLE collections ADD COLUMN IF NOT EXISTS is_private INTEGER DEFAULT 1`,
  `CREATE TABLE IF NOT EXISTS saves (
    id SERIAL PRIMARY KEY, user_id INTEGER NOT NULL, collection_id INTEGER NOT NULL, artwork_id INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(), UNIQUE(collection_id, artwork_id))`,
  `CREATE TABLE IF NOT EXISTS takedowns (
    id SERIAL PRIMARY KEY, name TEXT, email TEXT, artwork_url TEXT, reason TEXT, created_at TIMESTAMPTZ DEFAULT now())`,
  `CREATE TABLE IF NOT EXISTS likes (
    id SERIAL PRIMARY KEY, user_id INTEGER NOT NULL, artwork_id INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(), UNIQUE(user_id, artwork_id))`,
  `CREATE TABLE IF NOT EXISTS interactions (
    id SERIAL PRIMARY KEY, user_id INTEGER NOT NULL, artwork_id INTEGER NOT NULL, kind TEXT NOT NULL,
    strength INTEGER DEFAULT 1, updated_at TIMESTAMPTZ DEFAULT now(), UNIQUE(user_id, artwork_id, kind))`,
  `CREATE TABLE IF NOT EXISTS follows (
    id SERIAL PRIMARY KEY, user_id INTEGER NOT NULL, kind TEXT NOT NULL, value TEXT NOT NULL, label TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(), UNIQUE(user_id, kind, value))`,
  `CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY, user_id INTEGER NOT NULL, artwork_id INTEGER NOT NULL, title TEXT NOT NULL, body TEXT DEFAULT '',
    read_at TIMESTAMPTZ, created_at TIMESTAMPTZ DEFAULT now(), UNIQUE(user_id, artwork_id))`,
  `CREATE TABLE IF NOT EXISTS content_reports (
    id SERIAL PRIMARY KEY, user_id INTEGER, artwork_id INTEGER NOT NULL, reason TEXT NOT NULL, details TEXT DEFAULT '',
    status TEXT DEFAULT 'OPEN', created_at TIMESTAMPTZ DEFAULT now())`,
  `CREATE TABLE IF NOT EXISTS push_devices (
    id SERIAL PRIMARY KEY, user_id INTEGER NOT NULL, token TEXT UNIQUE NOT NULL, platform TEXT DEFAULT 'android',
    updated_at TIMESTAMPTZ DEFAULT now())`,
  `CREATE TABLE IF NOT EXISTS telemetry (
    id SERIAL PRIMARY KEY, kind TEXT NOT NULL, path TEXT DEFAULT '', value INTEGER DEFAULT 0, detail TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT now())`,
  `CREATE INDEX IF NOT EXISTS idx_interactions_user ON interactions(user_id, updated_at)`,
  `CREATE INDEX IF NOT EXISTS idx_follows_target ON follows(kind, value)`,
  `CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, read_at, id)`,
  `CREATE INDEX IF NOT EXISTS idx_push_devices_user ON push_devices(user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_content_reports_artwork ON content_reports(artwork_id, status)`,
  `ALTER TABLE public.users ENABLE ROW LEVEL SECURITY`,
  `ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY`,
  `ALTER TABLE public.saves ENABLE ROW LEVEL SECURITY`,
  `ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY`,
  `ALTER TABLE public.interactions ENABLE ROW LEVEL SECURITY`,
  `ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY`,
  `ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY`,
  `ALTER TABLE public.content_reports ENABLE ROW LEVEL SECURITY`,
  `ALTER TABLE public.push_devices ENABLE ROW LEVEL SECURITY`,
  `REVOKE ALL ON TABLE public.users, public.collections, public.saves, public.likes, public.interactions, public.follows, public.notifications, public.content_reports, public.push_devices FROM anon, authenticated`,
  `CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT)`,
  `INSERT INTO settings (key, value) VALUES
    ('site_name','AniPins'),
    ('tagline','Anime artwork for inspiration.'),
    ('instagram_handle','@_anipins_'),
    ('instagram_url','https://www.instagram.com/_anipins_?igsi=dzZzem42bnBha3Y=')
   ON CONFLICT (key) DO NOTHING`,
];
