import { NextRequest, NextResponse } from 'next/server';
import { authenticateUser } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username/Email and Password are required' },
        { status: 400 }
      );
    }

    const result = await authenticateUser(username, password);

    if (!result.success || !result.session) {
      return NextResponse.json(
        { error: result.error || 'Authentication failed' },
        { status: 401 }
      );
    }

    const response = NextResponse.json({
      success: true,
      agent: result.session.agent,
      token: result.session.token,
      expiresAt: result.session.expiresAt,
    });

    // Set secure HTTP-friendly cookie as well
    response.cookies.set('devntom_session_token', result.session.token, {
      httpOnly: false, // Accessible to client for localStorage sync if needed
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
      sameSite: 'lax',
    });

    return response;
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Server error during login' },
      { status: 500 }
    );
  }
}
