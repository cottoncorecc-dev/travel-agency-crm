import { NextRequest, NextResponse } from 'next/server';
import { authenticateUser } from '@/lib/db';
import { getClientIp, checkLoginLimit, clearLoginLimit, createRateLimitResponse, getRateLimitHeaders } from '@/lib/rateLimit';
import { sanitizeInputString, sanitizeAgent } from '@/lib/security';

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);

  try {
    const body = await req.json();
    const rawUsername = body?.username;
    const rawPassword = body?.password;

    const username = sanitizeInputString(rawUsername, 100);
    const password = typeof rawPassword === 'string' ? rawPassword : '';

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username/Email and Password are required' },
        { status: 400 }
      );
    }

    // Check rate limit for this user + IP
    const limitResult = checkLoginLimit(ip, username);
    if (!limitResult.success) {
      return createRateLimitResponse(
        limitResult,
        `Too many failed login attempts for this account. Access temporarily locked. Please try again in ${Math.ceil((limitResult.retryAfterSeconds || 60) / 60)} minutes.`
      );
    }

    const result = await authenticateUser(username, password);

    if (!result.success || !result.session) {
      return NextResponse.json(
        { error: result.error || 'Authentication failed' },
        {
          status: 401,
          headers: getRateLimitHeaders(limitResult),
        }
      );
    }

    // On successful login, clear the rate limit counter
    clearLoginLimit(ip, username);

    const safeAgent = sanitizeAgent(result.session.agent);

    const response = NextResponse.json({
      success: true,
      agent: safeAgent,
      token: result.session.token,
      expiresAt: result.session.expiresAt,
    });

    // Set secure HTTP-friendly cookie as well
    response.cookies.set('devntom_session_token', result.session.token, {
      httpOnly: false, // Accessible to client for localStorage sync
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

