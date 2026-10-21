import { NextRequest, NextResponse } from 'next/server';
import { getInvoiceByToken, signInvoice } from '@/lib/db';
import { getClientIp, checkRateLimit, createRateLimitResponse } from '@/lib/rateLimit';
import { sanitizeInputString } from '@/lib/security';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token') || searchParams.get('id') || '';

    if (!token) {
      return NextResponse.json({ error: 'Invoice signing token is required.' }, { status: 400 });
    }

    const data = await getInvoiceByToken(token);
    if (!data) {
      return NextResponse.json({ error: 'Invoice agreement not found or link has expired.' }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to load invoice agreement' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const rateCheck = checkRateLimit(`sign_${ip}`, 15, 300);
  if (!rateCheck.success) {
    return createRateLimitResponse(rateCheck, 'Too many signing attempts. Please wait.');
  }

  try {
    const body = await req.json();
    const token = sanitizeInputString(body?.token || body?.invoiceId, 100);
    const signerName = sanitizeInputString(body?.signerName, 100);
    const signerEmail = body?.signerEmail ? sanitizeInputString(body.signerEmail, 120) : undefined;
    const agreedToTerms = Boolean(body?.agreedToTerms);
    const signatureType = body?.signatureType === 'drawn' ? 'drawn' : 'typed';
    const signatureData = body?.signatureData ? String(body.signatureData).slice(0, 50000) : undefined;

    if (!token) {
      return NextResponse.json({ error: 'Missing invoice signing token.' }, { status: 400 });
    }

    if (!signerName) {
      return NextResponse.json({ error: 'Please enter the legal name of the signer.' }, { status: 400 });
    }

    if (!agreedToTerms) {
      return NextResponse.json(
        { error: 'You must review and check the box agreeing to the Terms & Conditions.' },
        { status: 400 }
      );
    }

    const result = await signInvoice(token, {
      signerName,
      signerEmail,
      agreedToTerms: true,
      signatureType,
      signatureData,
      ipAddress: ip,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Failed to sign agreement.' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: 'Agreement signed and confirmed successfully! Booking has been verified.',
      invoice: result.invoice,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Error processing digital signature' },
      { status: 500 }
    );
  }
}
