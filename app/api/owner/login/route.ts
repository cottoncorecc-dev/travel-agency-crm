import { NextRequest, NextResponse } from 'next/server';
import { authenticateOwner } from '@/lib/db';
import { getClientIp, checkOwnerLoginLimit, clearOwnerLoginLimit, createRateLimitResponse, getRateLimitHeaders } from '@/lib/rateLimit';
import { sanitizeInputString, sanitizeAgent } from '@/lib/security';

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);

  try {
    // Rate limit owner login attempts: 5 per 10 minutes
    const limitResult = checkOwnerLoginLimit(ip);
    if (!limitResult.success) {
      return createRateLimitResponse(
        limitResult,
        `Too many failed Owner login attempts. Access temporarily locked for security. Please try again in ${Math.ceil((limitResult.retryAfterSeconds || 60) / 60)} minutes.`
      );
    }

    const body = await req.json();
    const rawCredential = body?.passcode || body?.password || '';
    const credential = sanitizeInputString(rawCredential, 100);

    if (!credential) {
      return NextResponse.json(
        { error: 'Please enter CRM Owner access credentials.' },
        { status: 400, headers: getRateLimitHeaders(limitResult) }
      );
    }

    const result = await authenticateOwner(credential);

    if (!result.success || !result.session) {
      return NextResponse.json(
        { error: result.error || 'Invalid CRM Owner credentials.' },
        { status: 401, headers: getRateLimitHeaders(limitResult) }
      );
    }

    // Success - clear lockout counter for this IP
    clearOwnerLoginLimit(ip);

    const safeAgent = sanitizeAgent(result.session.agent);

    const response = NextResponse.json({
      success: true,
      token: result.session.token,
      agent: safeAgent,
    });

    // Set secure cookie for owner session
    response.cookies.set('devntom_owner_token', result.session.token, {
      httpOnly: false,
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
      sameSite: 'lax',
    });

    return response;
  } catch (error: any) {
    console.error('Owner login error:', error);
    return NextResponse.json({ error: 'Authentication failed.' }, { status: 500 });
  }
}

