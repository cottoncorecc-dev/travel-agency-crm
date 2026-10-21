import { NextRequest, NextResponse } from 'next/server';
import { requestPasswordOtp } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const { identifier } = await req.json();

    if (!identifier || !identifier.trim()) {
      return NextResponse.json(
        { error: 'Please enter your account username or registered work email.' },
        { status: 400 }
      );
    }

    const result = await requestPasswordOtp(identifier);

    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Failed to send OTP.' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: `A 6-digit verification code has been dispatched.`,
      maskedEmail: result.maskedEmail,
      // For developer / demo environment convenience, provide code in payload for instant verification testing
      otp: result.otp,
    });
  } catch (error: any) {
    console.error('OTP send error:', error);
    return NextResponse.json({ error: 'Failed to process password reset request.' }, { status: 500 });
  }
}
