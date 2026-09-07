import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'anipins.db');
let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!_db) {
    _db = new Database(DB_PATH);
    _db.pragma('journal_mode = WAL');
    _db.pragma('foreign_keys = ON');
  }
  return _db;
}

export function initDatabase() {
  const db = getDb();
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      username TEXT UNIQUE NOT NULL,
      display_name TEXT,
      avatar_url TEXT,
      bio TEXT,
      password_hash TEXT NOT NULL,
      role TEXT DEFAULT 'user' CHECK(role IN ('user','creator','moderator','admin','super_admin')),
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token TEXT UNIQUE NOT NULL,
      expires_at TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS anime (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      description TEXT,
      cover_url TEXT,
      artwork_count INTEGER DEFAULT 0,
      character_count INTEGER DEFAULT 0,
      is_featured INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS characters (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      anime_id TEXT REFERENCES anime(id) ON DELETE SET NULL,
      aliases TEXT DEFAULT '[]',
      description TEXT,
      thumbnail_url TEXT,
      artwork_count INTEGER DEFAULT 0,
      is_featured INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      sort_order INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS tags (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      usage_count INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS artworks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      image_url TEXT NOT NULL,
      thumbnail_url TEXT,
      character_id TEXT REFERENCES characters(id) ON DELETE SET NULL,
      anime_id TEXT REFERENCES anime(id) ON DELETE SET NULL,
      category TEXT,
      artist TEXT,
      source_url TEXT,
      orientation TEXT DEFAULT 'portrait',
      resolution TEXT,
      artwork_type TEXT DEFAULT 'illustration',
      wallpaper_type TEXT,
      mood TEXT,
      dominant_color TEXT,
      width INTEGER DEFAULT 0,
      height INTEGER DEFAULT 0,
      tags TEXT DEFAULT '[]',
      download_count INTEGER DEFAULT 0,
      view_count INTEGER DEFAULT 0,
      like_count INTEGER DEFAULT 0,
      save_count INTEGER DEFAULT 0,
      comment_count INTEGER DEFAULT 0,
      is_published INTEGER DEFAULT 1,
      is_featured INTEGER DEFAULT 0,
      is_trending INTEGER DEFAULT 0,
      original_id TEXT,
      uploader_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      published_at TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS artwork_tags (
      artwork_id TEXT NOT NULL REFERENCES artworks(id) ON DELETE CASCADE,
      tag_id TEXT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
      PRIMARY KEY (artwork_id, tag_id)
    );

    CREATE TABLE IF NOT EXISTS likes (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      artwork_id TEXT NOT NULL REFERENCES artworks(id) ON DELETE CASCADE,
      created_at TEXT DEFAULT (datetime('now')),
      UNIQUE(user_id, artwork_id)
    );

    CREATE TABLE IF NOT EXISTS saves (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      artwork_id TEXT NOT NULL REFERENCES artworks(id) ON DELETE CASCADE,
      collection_id TEXT REFERENCES collections(id) ON DELETE SET NULL,
      created_at TEXT DEFAULT (datetime('now')),
      UNIQUE(user_id, artwork_id)
    );

    CREATE TABLE IF NOT EXISTS collections (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      description TEXT,
      cover_url TEXT,
      is_public INTEGER DEFAULT 1,
      item_count INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS collection_items (
      id TEXT PRIMARY KEY,
      collection_id TEXT NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
      artwork_id TEXT NOT NULL REFERENCES artworks(id) ON DELETE CASCADE,
      section TEXT DEFAULT 'default',
      sort_order INTEGER DEFAULT 0,
      added_at TEXT DEFAULT (datetime('now')),
      UNIQUE(collection_id, artwork_id)
    );

    CREATE TABLE IF NOT EXISTS follows (
      id TEXT PRIMARY KEY,
      follower_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      following_type TEXT NOT NULL CHECK(following_type IN ('user','character','anime')),
      following_id TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      UNIQUE(follower_id, following_type, following_id)
    );

    CREATE TABLE IF NOT EXISTS comments (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      artwork_id TEXT NOT NULL REFERENCES artworks(id) ON DELETE CASCADE,
      parent_id TEXT REFERENCES comments(id) ON DELETE CASCADE,
      content TEXT NOT NULL,
      is_deleted INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT,
      link TEXT,
      is_read INTEGER DEFAULT 0,
      actor_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS downloads (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      artwork_id TEXT NOT NULL REFERENCES artworks(id) ON DELETE CASCADE,
      format TEXT DEFAULT 'original',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS views (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      artwork_id TEXT NOT NULL REFERENCES artworks(id) ON DELETE CASCADE,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS reports (
      id TEXT PRIMARY KEY,
      reporter_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      reference_id TEXT NOT NULL,
      reason TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS slides (
      id TEXT PRIMARY KEY,
      artwork_id TEXT REFERENCES artworks(id) ON DELETE SET NULL,
      title TEXT,
      subtitle TEXT,
      cta_text TEXT,
      cta_link TEXT,
      image_url TEXT,
      sort_order INTEGER DEFAULT 0,
      is_published INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS site_settings (
      key TEXT PRIMARY KEY,
      value TEXT,
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS search_history (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      query TEXT NOT NULL,
      results_count INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS character_favourites (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      character_id TEXT NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
      created_at TEXT DEFAULT (datetime('now')),
      UNIQUE(user_id, character_id)
    );

    CREATE INDEX IF NOT EXISTS idx_artworks_character ON artworks(character_id);
    CREATE INDEX IF NOT EXISTS idx_artworks_anime ON artworks(anime_id);
    CREATE INDEX IF NOT EXISTS idx_artworks_published ON artworks(is_published);
    CREATE INDEX IF NOT EXISTS idx_artworks_created ON artworks(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_artworks_views ON artworks(view_count DESC);
    CREATE INDEX IF NOT EXISTS idx_artworks_likes ON artworks(like_count DESC);
    CREATE INDEX IF NOT EXISTS idx_artworks_featured ON artworks(is_featured);
    CREATE INDEX IF NOT EXISTS idx_characters_anime ON characters(anime_id);
    CREATE INDEX IF NOT EXISTS idx_characters_slug ON characters(slug);
    CREATE INDEX IF NOT EXISTS idx_anime_slug ON anime(slug);
    CREATE INDEX IF NOT EXISTS idx_likes_user ON likes(user_id);
    CREATE INDEX IF NOT EXISTS idx_saves_user ON saves(user_id);
    CREATE INDEX IF NOT EXISTS idx_follows_follower ON follows(follower_id);
    CREATE INDEX IF NOT EXISTS idx_follows_following ON follows(following_type, following_id);
    CREATE INDEX IF NOT EXISTS idx_comments_artwork ON comments(artwork_id);
    CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read);
    CREATE INDEX IF NOT EXISTS idx_collection_items ON collection_items(collection_id);
  `);

  // Seed super admin
  const adminExists = db.prepare('SELECT id FROM users WHERE email = ?').get('anipins01@gmail.com');
  if (!adminExists) {
    const bcrypt = require('bcryptjs');
    const { v4: uuidv4 } = require('uuid');
    const hash = bcrypt.hashSync('anipins2024!', 12);
    db.prepare(`INSERT INTO users (id, email, username, display_name, role, password_hash) VALUES (?,?,?,?,?,?)`)
      .run(uuidv4(), 'anipins01@gmail.com', 'anipins_admin', 'AniPins Admin', 'super_admin', hash);
  }

  // Seed default settings
  const settingsCount = db.prepare('SELECT COUNT(*) as count FROM site_settings').get() as { count: number };
  if (settingsCount.count === 0) {
    const insertSetting = db.prepare('INSERT OR IGNORE INTO site_settings (key, value) VALUES (?, ?)');
    insertSetting.run('site_name', 'AniPins');
    insertSetting.run('site_tagline', 'Discover. Save. Create. Anime.');
    insertSetting.run('instagram_handle', '_anipins_');
    insertSetting.run('instagram_url', 'https://www.instagram.com/_anipins_?igsi=dzZzem42bnBha3Y=');
  }

  return db;
}
