import { NextRequest, NextResponse } from 'next/server';
import { requestPasswordOtp } from '@/lib/db';
import { getClientIp, checkOtpSendLimit, createRateLimitResponse, getRateLimitHeaders } from '@/lib/rateLimit';
import { sanitizeInputString } from '@/lib/security';

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);

  try {
    const body = await req.json();
    const rawIdentifier = body?.identifier;
    const identifier = sanitizeInputString(rawIdentifier, 120);

    if (!identifier) {
      return NextResponse.json(
        { error: 'Please enter your account username or registered work email.' },
        { status: 400 }
      );
    }

    // Rate limit OTP requests to max 3 per 10 minutes per IP/identifier
    const limitResult = checkOtpSendLimit(ip, identifier);
    if (!limitResult.success) {
      return createRateLimitResponse(
        limitResult,
        `Too many OTP requests for this account. Please wait ${Math.ceil((limitResult.retryAfterSeconds || 60) / 60)} minutes before requesting another code.`
      );
    }

    const result = await requestPasswordOtp(identifier);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to send OTP.' },
        { status: 404, headers: getRateLimitHeaders(limitResult) }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: `A 6-digit verification code has been dispatched.`,
        maskedEmail: result.maskedEmail,
        // For developer / demo environment convenience, provide code in payload for instant verification testing
        otp: result.otp,
      },
      { headers: getRateLimitHeaders(limitResult) }
    );
  } catch (error: any) {
    console.error('OTP send error:', error);
    return NextResponse.json({ error: 'Failed to process password reset request.' }, { status: 500 });
  }
}

