import { NextRequest, NextResponse } from 'next/server';
import { getDb, initDatabase } from '@/lib/db';
import { getSessionFromRequest, isAdmin } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';

export async function GET(request: NextRequest) {
  try {
    initDatabase();
    const db = getDb();
    const { searchParams } = new URL(request.url);
    
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '30');
    const sort = searchParams.get('sort') || 'latest';
    const category = searchParams.get('category');
    const anime = searchParams.get('anime');
    const character = searchParams.get('character');
    const search = searchParams.get('q');
    const featured = searchParams.get('featured');
    const offset = (page - 1) * limit;

    let where = 'WHERE a.is_published = 1';
    const params: any[] = [];

    if (category) {
      where += ' AND a.category = ?';
      params.push(category);
    }
    if (anime) {
      where += ' AND a.anime_id = ?';
      params.push(anime);
    }
    if (character) {
      where += ' AND a.character_id = ?';
      params.push(character);
    }
    if (search) {
      where += ' AND (a.title LIKE ? OR c.name LIKE ? OR an.name LIKE ?)';
      const q = `%${search}%`;
      params.push(q, q, q);
    }
    if (featured === '1') {
      where += ' AND a.is_featured = 1';
    }

    let orderBy = 'ORDER BY a.created_at DESC';
    if (sort === 'trending') orderBy = 'ORDER BY a.view_count DESC, a.like_count DESC';
    else if (sort === 'popular') orderBy = 'ORDER BY a.like_count DESC, a.save_count DESC';
    else if (sort === 'views') orderBy = 'ORDER BY a.view_count DESC';

    const countSql = `SELECT COUNT(*) as total FROM artworks a LEFT JOIN characters c ON a.character_id=c.id LEFT JOIN anime an ON a.anime_id=an.id ${where}`;
    const total = (db.prepare(countSql).get(...params) as any).total;

    const sql = `
      SELECT a.*, c.name as character_name, c.slug as character_slug, 
             an.name as anime_name, an.slug as anime_slug
      FROM artworks a 
      LEFT JOIN characters c ON a.character_id = c.id 
      LEFT JOIN anime an ON a.anime_id = an.id 
      ${where} ${orderBy} LIMIT ? OFFSET ?
    `;
    const artworks = db.prepare(sql).all(...params, limit, offset);

    return NextResponse.json({
      artworks,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit), hasMore: offset + limit < total }
    });
  } catch (error) {
    console.error('Artworks GET error:', error);
    return NextResponse.json({ error: 'Failed to load artworks' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    initDatabase();
    const user = getSessionFromRequest(request);
    if (!isAdmin(user)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { title, description, imageUrl, thumbnailUrl, animeId, characterId, category, orientation, artworkType, tags, isFeatured, isPublished } = body;

    if (!title || !imageUrl) {
      return NextResponse.json({ error: 'Title and image URL required' }, { status: 400 });
    }

    const db = getDb();
    const id = uuidv4();
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '') + '-' + id.slice(0, 8);

    db.prepare(`
      INSERT INTO artworks (id, title, description, image_url, thumbnail_url, character_id, anime_id, category, orientation, artwork_type, tags, is_featured, is_published, uploader_id, published_at, created_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    `).run(id, title, description || '', imageUrl, thumbnailUrl || imageUrl, characterId || null, animeId || null, category || 'Female Characters', orientation || 'portrait', artworkType || 'illustration', JSON.stringify(tags || []), isFeatured ? 1 : 0, isPublished !== false ? 1 : 0, user!.id, new Date().toISOString(), new Date().toISOString());

    // Update counts
    if (animeId) {
      db.prepare('UPDATE anime SET artwork_count = artwork_count + 1 WHERE id = ?').run(animeId);
    }
    if (characterId) {
      db.prepare('UPDATE characters SET artwork_count = artwork_count + 1 WHERE id = ?').run(characterId);
    }

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error('Artwork POST error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
