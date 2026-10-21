import { NextRequest, NextResponse } from 'next/server';
import { createCompanySignup } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { companyName, superAdminName, username, email, phone, password } = body;

    if (!companyName || !superAdminName || !username || !email || !password) {
      return NextResponse.json(
        { error: 'Company Name, Super Admin Full Name, Username, Work Email, and Password are required.' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long.' },
        { status: 400 }
      );
    }

    const result = await createCompanySignup({
      companyName,
      superAdminName,
      username,
      email,
      phone: phone || '',
      password,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Registration failed.' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message:
        'Registration submitted successfully! Your company workspace and Super Admin account are pending approval by the CRM Owner.',
      company: result.company,
    });
  } catch (error: any) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error during registration.' },
      { status: 500 }
    );
  }
}
