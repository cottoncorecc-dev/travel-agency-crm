import { NextRequest, NextResponse } from 'next/server';
import { resetPasswordWithOtp } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const { identifier, otpCode, newPassword } = await req.json();

    if (!identifier || !otpCode || !newPassword) {
      return NextResponse.json(
        { error: 'Identifier, 6-digit OTP code, and new password are required.' },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'New password must be at least 6 characters.' },
        { status: 400 }
      );
    }

    const result = await resetPasswordWithOtp(identifier, otpCode, newPassword);

    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Failed to reset password.' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: 'Password updated successfully! You can now log in with your new credentials.',
    });
  } catch (error: any) {
    console.error('OTP reset error:', error);
    return NextResponse.json({ error: 'Failed to reset password.' }, { status: 500 });
  }
}
