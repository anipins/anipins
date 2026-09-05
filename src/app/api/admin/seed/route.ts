import { NextRequest, NextResponse } from 'next/server';
import { getDb, initDatabase } from '@/lib/db';
import { ALL_ARTWORKS, MIGRATION_BASE } from '@/lib/migration-data';
import { getSessionFromRequest, isSuperAdmin } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    initDatabase();
    const user = getSessionFromRequest(request);
    if (!isSuperAdmin(user)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const db = getDb();
    let artworkCount = 0;
    let animeCount = 0;
    let characterCount = 0;

    const existingArtworks = db.prepare('SELECT COUNT(*) as count FROM artworks').get() as { count: number };
    if (existingArtworks.count > 0) {
      return NextResponse.json({ message: 'Database already seeded', artworks: existingArtworks.count });
    }

    // Build unique anime map
    const animeMap = new Map<string, string>();
    const characterMap = new Map<string, string>();
    
    const uniqueAnime = new Set(ALL_ARTWORKS.map(a => a.anime));
    const uniqueCharacters = new Map<string, { name: string; anime: string }>();
    
    ALL_ARTWORKS.forEach(a => {
      if (!uniqueCharacters.has(a.character)) {
        uniqueCharacters.set(a.character, { name: a.character, anime: a.anime });
      }
    });

    // Insert anime
    const insertAnime = db.prepare(`INSERT OR IGNORE INTO anime (id, name, slug, cover_url, artwork_count) VALUES (?,?,?,?,?)`);
    for (const animeName of uniqueAnime) {
      const slug = animeName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '');
      const id = `anime-${slug}`;
      const relatedArt = ALL_ARTWORKS.find(a => a.anime === animeName);
      const coverUrl = relatedArt ? `${MIGRATION_BASE}/api/img/o/${relatedArt.thumbnailHash}.jpeg` : '';
      const count = ALL_ARTWORKS.filter(a => a.anime === animeName).length;
      insertAnime.run(id, animeName, slug, coverUrl, count);
      animeMap.set(animeName, id);
      animeCount++;
    }

    // Insert characters
    const insertChar = db.prepare(`INSERT OR IGNORE INTO characters (id, name, slug, anime_id, thumbnail_url, artwork_count) VALUES (?,?,?,?,?,?)`);
    for (const [charName, info] of uniqueCharacters) {
      const slug = charName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '');
      const id = `char-${slug}`;
      const animeId = animeMap.get(info.anime) || null;
      const relatedArt = ALL_ARTWORKS.find(a => a.character === charName);
      const thumbUrl = relatedArt ? `${MIGRATION_BASE}/api/img/t/${relatedArt.thumbnailHash}.jpg` : '';
      const count = ALL_ARTWORKS.filter(a => a.character === charName).length;
      insertChar.run(id, charName, slug, animeId, thumbUrl, count);
      characterMap.set(charName, id);
      characterCount++;
    }

    // Insert artworks
    const insertArt = db.prepare(`
      INSERT OR IGNORE INTO artworks (id, title, image_url, thumbnail_url, character_id, anime_id, category, orientation, artwork_type, is_published, is_featured, is_trending, uploader_id, published_at, created_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    `);
    
    const now = new Date().toISOString();
    for (let i = 0; i < ALL_ARTWORKS.length; i++) {
      const art = ALL_ARTWORKS[i];
      const id = `art-${i + 1}`;
      const imageUrl = `${MIGRATION_BASE}/api/img/o/${art.thumbnailHash}.jpeg`;
      const thumbUrl = `${MIGRATION_BASE}/api/img/t/${art.thumbnailHash}.jpg`;
      const charId = characterMap.get(art.character) || null;
      const animeId = animeMap.get(art.anime) || null;
      const isFeatured = i < 8 ? 1 : 0;
      const isTrending = i < 20 ? 1 : 0;
      const createdAt = new Date(Date.now() - (ALL_ARTWORKS.length - i) * 60000).toISOString();
      
      insertArt.run(id, art.title, imageUrl, thumbUrl, charId, animeId, art.category, art.orientation, 'illustration', 1, isFeatured, isTrending, user?.id || null, createdAt, createdAt);
      artworkCount++;
    }

    // Create featured slides
    const insertSlide = db.prepare(`INSERT OR IGNORE INTO slides (id, artwork_id, title, subtitle, sort_order, is_published) VALUES (?,?,?,?,?,?)`);
    const featuredArts = db.prepare('SELECT id, title, image_url FROM artworks WHERE is_featured=1 LIMIT 8').all() as any[];
    featuredArts.forEach((art: any, i: number) => {
      insertSlide.run(`slide-${i + 1}`, art.id, art.title, 'Featured on AniPins', i + 1, 1);
    });

    return NextResponse.json({
      success: true,
      migrated: {
        artworks: artworkCount,
        anime: animeCount,
        characters: characterCount,
        slides: featuredArts.length,
      }
    });
  } catch (error) {
    console.error('Seed error:', error);
    return NextResponse.json({ error: 'Seed failed', details: String(error) }, { status: 500 });
  }
}
