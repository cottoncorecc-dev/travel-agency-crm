import { NextRequest, NextResponse } from 'next/server';
import { createCompanySignup } from '@/lib/db';
import { getClientIp, checkSignupLimit, createRateLimitResponse, getRateLimitHeaders } from '@/lib/rateLimit';
import { sanitizeInputString, isValidEmail, isValidUsername, validatePasswordStrength } from '@/lib/security';

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);

  try {
    // Rate limit company registrations: 5 per 30 minutes per IP
    const limitResult = checkSignupLimit(ip);
    if (!limitResult.success) {
      return createRateLimitResponse(
        limitResult,
        `Too many registration requests from this network. Please wait ${Math.ceil((limitResult.retryAfterSeconds || 60) / 60)} minutes before trying again.`
      );
    }

    const body = await req.json();
    const companyName = sanitizeInputString(body?.companyName, 120);
    const superAdminName = sanitizeInputString(body?.superAdminName, 100);
    const username = sanitizeInputString(body?.username, 35);
    const email = sanitizeInputString(body?.email, 120);
    const phone = sanitizeInputString(body?.phone, 30);
    const password = typeof body?.password === 'string' ? body.password : '';

    if (!companyName || !superAdminName || !username || !email || !password) {
      return NextResponse.json(
        { error: 'Company Name, Super Admin Full Name, Username, Work Email, and Password are required.' },
        { status: 400, headers: getRateLimitHeaders(limitResult) }
      );
    }

    if (!isValidUsername(username)) {
      return NextResponse.json(
        { error: 'Username must be 3-30 characters long and contain only letters, numbers, underscores, dashes, or dots.' },
        { status: 400 }
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: 'Please enter a valid work email address.' },
        { status: 400 }
      );
    }

    const passCheck = validatePasswordStrength(password);
    if (!passCheck.valid) {
      return NextResponse.json(
        { error: passCheck.reason || 'Password does not meet complexity requirements.' },
        { status: 400 }
      );
    }

    const result = await createCompanySignup({
      companyName,
      superAdminName,
      username,
      email,
      phone,
      password,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Registration failed.' },
        { status: 400, headers: getRateLimitHeaders(limitResult) }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message:
          'Registration submitted successfully! Your company workspace and Super Admin account are pending approval by the CRM Owner.',
        company: result.company,
      },
      { headers: getRateLimitHeaders(limitResult) }
    );
  } catch (error: any) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error during registration.' },
      { status: 500 }
    );
  }
}

