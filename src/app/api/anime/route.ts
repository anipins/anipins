import { NextRequest, NextResponse } from 'next/server';
import { getDb, initDatabase } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    initDatabase();
    const db = getDb();
    const { searchParams } = new URL(request.url);
    const sort = searchParams.get('sort') || 'popular';
    const search = searchParams.get('q');
    const limit = parseInt(searchParams.get('limit') || '50');

    let where = '';
    const params: any[] = [];

    if (search) {
      where = 'WHERE name LIKE ?';
      params.push(`%${search}%`);
    }

    let orderBy = 'ORDER BY artwork_count DESC, name ASC';
    if (sort === 'az') orderBy = 'ORDER BY name ASC';
    else if (sort === 'za') orderBy = 'ORDER BY name DESC';
    else if (sort === 'newest') orderBy = 'ORDER BY created_at DESC';

    const sql = `SELECT * FROM anime ${where} ${orderBy} LIMIT ?`;
    const animeList = db.prepare(sql).all(...params, limit);

    return NextResponse.json({ anime: animeList });
  } catch (error) {
    console.error('Anime error:', error);
    return NextResponse.json({ error: 'Failed to load anime' }, { status: 500 });
  }
}
