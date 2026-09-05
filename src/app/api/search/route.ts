import { NextRequest, NextResponse } from 'next/server';
import { getDb, initDatabase } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    initDatabase();
    const db = getDb();
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q') || '';

    if (q.length < 2) {
      return NextResponse.json({ characters: [], anime: [], artworks: [] });
    }

    const like = `%${q}%`;

    const characters = db.prepare(`
      SELECT c.id, c.name, c.slug, c.thumbnail_url, a.name as anime_name 
      FROM characters c LEFT JOIN anime a ON c.anime_id=a.id 
      WHERE c.name LIKE ? LIMIT 8
    `).all(like);

    const animeList = db.prepare(`
      SELECT id, name, slug, cover_url, artwork_count 
      FROM anime WHERE name LIKE ? LIMIT 6
    `).all(like);

    const artworks = db.prepare(`
      SELECT a.id, a.title, a.thumbnail_url, c.name as character_name, an.name as anime_name
      FROM artworks a 
      LEFT JOIN characters c ON a.character_id=c.id 
      LEFT JOIN anime an ON a.anime_id=an.id
      WHERE a.is_published=1 AND (a.title LIKE ? OR c.name LIKE ? OR an.name LIKE ?) 
      LIMIT 8
    `).all(like, like, like);

    return NextResponse.json({ characters, anime: animeList, artworks });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
