import { NextRequest, NextResponse } from 'next/server';
import { getDb, initDatabase } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    initDatabase();
    const user = getSessionFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Login required' }, { status: 401 });

    const { artworkId, collectionId } = await request.json();
    const db = getDb();

    const existing = db.prepare('SELECT id FROM saves WHERE user_id=? AND artwork_id=?').get(user.id, artworkId);
    if (existing) {
      db.prepare('DELETE FROM saves WHERE user_id=? AND artwork_id=?').run(user.id, artworkId);
      db.prepare('UPDATE artworks SET save_count = MAX(0, save_count - 1) WHERE id=?').run(artworkId);
      return NextResponse.json({ saved: false });
    } else {
      db.prepare('INSERT INTO saves (id,user_id,artwork_id,collection_id) VALUES (?,?,?,?)').run(uuidv4(), user.id, artworkId, collectionId || null);
      db.prepare('UPDATE artworks SET save_count = save_count + 1 WHERE id=?').run(artworkId);
      return NextResponse.json({ saved: true });
    }
  } catch (error) {
    console.error('Save error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    initDatabase();
    const user = getSessionFromRequest(request);
    if (!user) return NextResponse.json({ saves: [] });
    
    const db = getDb();
    const saves = db.prepare('SELECT artwork_id FROM saves WHERE user_id=?').all(user.id) as any[];
    return NextResponse.json({ saves: saves.map(s => s.artwork_id) });
  } catch {
    return NextResponse.json({ saves: [] });
  }
}
