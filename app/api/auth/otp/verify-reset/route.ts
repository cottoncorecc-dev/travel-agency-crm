import { NextRequest, NextResponse } from 'next/server';
import { resetPasswordWithOtp } from '@/lib/db';
import { getClientIp, checkOtpVerifyLimit, clearOtpVerifyLimit, createRateLimitResponse, getRateLimitHeaders } from '@/lib/rateLimit';
import { sanitizeInputString, validatePasswordStrength } from '@/lib/security';

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);

  try {
    const body = await req.json();
    const rawIdentifier = body?.identifier;
    const rawOtp = body?.otpCode;
    const rawPassword = body?.newPassword;

    const identifier = sanitizeInputString(rawIdentifier, 120);
    const otpCode = sanitizeInputString(rawOtp, 10);
    const newPassword = typeof rawPassword === 'string' ? rawPassword : '';

    if (!identifier || !otpCode || !newPassword) {
      return NextResponse.json(
        { error: 'Identifier, 6-digit OTP code, and new password are required.' },
        { status: 400 }
      );
    }

    // Rate limit OTP verification attempts to prevent brute forcing 6-digit numbers
    const limitResult = checkOtpVerifyLimit(ip, identifier);
    if (!limitResult.success) {
      return createRateLimitResponse(
        limitResult,
        `Too many failed OTP verification attempts. For security, OTP verification is temporarily locked. Please try again in ${Math.ceil((limitResult.retryAfterSeconds || 60) / 60)} minutes.`
      );
    }

    const passwordCheck = validatePasswordStrength(newPassword);
    if (!passwordCheck.valid) {
      return NextResponse.json(
        { error: passwordCheck.reason || 'Password does not meet security requirements.' },
        { status: 400 }
      );
    }

    const result = await resetPasswordWithOtp(identifier, otpCode, newPassword);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to reset password.' },
        { status: 400, headers: getRateLimitHeaders(limitResult) }
      );
    }

    // Clear verification attempts on successful reset
    clearOtpVerifyLimit(ip, identifier);

    return NextResponse.json({
      success: true,
      message: 'Password updated successfully! You can now log in with your new credentials.',
    });
  } catch (error: any) {
    console.error('OTP reset error:', error);
    return NextResponse.json({ error: 'Failed to reset password.' }, { status: 500 });
  }
}

