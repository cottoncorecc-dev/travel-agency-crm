import { NextRequest, NextResponse } from 'next/server';
import { destroySession } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    let token = '';
    const authHeader = req.headers.get('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else {
      const cookie = req.cookies.get('devntom_session_token');
      token = cookie?.value || '';
    }

    if (token) {
      await destroySession(token);
    }

    const response = NextResponse.json({ success: true, message: 'Logged out successfully' });
    response.cookies.delete('devntom_session_token');
    return response;
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Logout failed' },
      { status: 500 }
    );
  }
}
