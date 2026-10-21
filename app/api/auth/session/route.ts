import { NextRequest, NextResponse } from 'next/server';
import { validateSession } from '@/lib/db';
import { sanitizeAgent } from '@/lib/security';

export async function GET(req: NextRequest) {
  try {
    let token = '';
    const authHeader = req.headers.get('Authorization') || req.headers.get('authorization');
    if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
      token = authHeader.substring(7).trim();
    } else {
      const cookie = req.cookies.get('devntom_session_token');
      token = cookie?.value || '';
    }

    if (!token) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const session = await validateSession(token);
    if (!session) {
      const response = NextResponse.json({ authenticated: false }, { status: 401 });
      response.cookies.delete('devntom_session_token');
      return response;
    }

    return NextResponse.json({
      authenticated: true,
      agent: sanitizeAgent(session.agent),
      expiresAt: session.expiresAt,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Session validation error' },
      { status: 500 }
    );
  }
}

