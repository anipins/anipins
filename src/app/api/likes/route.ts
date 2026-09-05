import { NextRequest, NextResponse } from 'next/server';
import { getDb, initDatabase } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    initDatabase();
    const user = getSessionFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Login required' }, { status: 401 });

    const { artworkId } = await request.json();
    const db = getDb();

    const existing = db.prepare('SELECT id FROM likes WHERE user_id=? AND artwork_id=?').get(user.id, artworkId);
    if (existing) {
      db.prepare('DELETE FROM likes WHERE user_id=? AND artwork_id=?').run(user.id, artworkId);
      db.prepare('UPDATE artworks SET like_count = MAX(0, like_count - 1) WHERE id=?').run(artworkId);
      return NextResponse.json({ liked: false });
    } else {
      db.prepare('INSERT INTO likes (id,user_id,artwork_id) VALUES (?,?,?)').run(uuidv4(), user.id, artworkId);
      db.prepare('UPDATE artworks SET like_count = like_count + 1 WHERE id=?').run(artworkId);
      return NextResponse.json({ liked: true });
    }
  } catch (error) {
    console.error('Like error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    initDatabase();
    const user = getSessionFromRequest(request);
    if (!user) return NextResponse.json({ likes: [] });
    
    const db = getDb();
    const likes = db.prepare('SELECT artwork_id FROM likes WHERE user_id=?').all(user.id) as any[];
    return NextResponse.json({ likes: likes.map(l => l.artwork_id) });
  } catch {
    return NextResponse.json({ likes: [] });
  }
}
