import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = getSessionFromRequest(request);
    if (!user) {
      return NextResponse.json({ user: null });
    }
    return NextResponse.json({ 
      user: { id: user.id, email: user.email, username: user.username, display_name: user.display_name, role: user.role, avatar_url: user.avatar_url, bio: user.bio }
    });
  } catch {
    return NextResponse.json({ user: null });
  }
}
