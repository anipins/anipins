import { NextRequest, NextResponse } from 'next/server';
import { getDb, initDatabase } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    initDatabase();
    const db = getDb();
    const { searchParams } = new URL(request.url);
    const sort = searchParams.get('sort') || 'popular';
    const search = searchParams.get('q');
    const limit = parseInt(searchParams.get('limit') || '100');

    let where = '';
    const params: any[] = [];

    if (search) {
      where = 'WHERE c.name LIKE ?';
      params.push(`%${search}%`);
    }

    let orderBy = 'ORDER BY c.artwork_count DESC, c.name ASC';
    if (sort === 'az') orderBy = 'ORDER BY c.name ASC';
    else if (sort === 'za') orderBy = 'ORDER BY c.name DESC';
    else if (sort === 'newest') orderBy = 'ORDER BY c.created_at DESC';

    const sql = `
      SELECT c.*, a.name as anime_name, a.slug as anime_slug, a.cover_url as anime_cover
      FROM characters c 
      LEFT JOIN anime a ON c.anime_id = a.id 
      ${where} ${orderBy} LIMIT ?
    `;
    const characters = db.prepare(sql).all(...params, limit);

    return NextResponse.json({ characters });
  } catch (error) {
    console.error('Characters error:', error);
    return NextResponse.json({ error: 'Failed to load characters' }, { status: 500 });
  }
}
