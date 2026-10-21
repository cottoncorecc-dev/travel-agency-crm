import { NextRequest, NextResponse } from 'next/server';
import { getCompanySettings, updateCompanySettings } from '@/lib/db';
import { sanitizeInputString } from '@/lib/security';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const rawCompanyId = searchParams.get('companyId');
    const companyId = rawCompanyId ? sanitizeInputString(rawCompanyId, 60) : 'comp_default';

    const settings = await getCompanySettings(companyId);
    return NextResponse.json(settings);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch company settings' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const rawCompanyId = body?.companyId;
    const companyId = rawCompanyId ? sanitizeInputString(rawCompanyId, 60) : 'comp_default';

    const updates = {
      companyName: body?.companyName ? sanitizeInputString(body.companyName, 120) : undefined,
      tagline: body?.tagline ? sanitizeInputString(body.tagline, 200) : undefined,
      logoUrl: body?.logoUrl ? String(body.logoUrl).trim() : undefined,
      email: body?.email ? sanitizeInputString(body.email, 120) : undefined,
      phone: body?.phone ? sanitizeInputString(body.phone, 30) : undefined,
      whatsapp: body?.whatsapp ? sanitizeInputString(body.whatsapp, 30) : undefined,
      address: body?.address ? sanitizeInputString(body.address, 300) : undefined,
      website: body?.website ? sanitizeInputString(body.website, 120) : undefined,
      taxRegistrationNumber: body?.taxRegistrationNumber
        ? sanitizeInputString(body.taxRegistrationNumber, 100)
        : undefined,
      bankName: body?.bankName ? sanitizeInputString(body.bankName, 100) : undefined,
      accountName: body?.accountName ? sanitizeInputString(body.accountName, 100) : undefined,
      accountNumber: body?.accountNumber ? sanitizeInputString(body.accountNumber, 40) : undefined,
      sortCode: body?.sortCode ? sanitizeInputString(body.sortCode, 20) : undefined,
      iban: body?.iban ? sanitizeInputString(body.iban, 45) : undefined,
      swift: body?.swift ? sanitizeInputString(body.swift, 30) : undefined,
      termsAndConditions:
        typeof body?.termsAndConditions === 'string'
          ? body.termsAndConditions.trim()
          : undefined,
      invoiceFooterNote: body?.invoiceFooterNote
        ? sanitizeInputString(body.invoiceFooterNote, 300)
        : undefined,
      receiptFooterNote: body?.receiptFooterNote
        ? sanitizeInputString(body.receiptFooterNote, 300)
        : undefined,
    };

    // Filter out undefined
    const cleanUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, v]) => v !== undefined)
    );

    const updated = await updateCompanySettings(companyId, cleanUpdates);
    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to update company settings' },
      { status: 500 }
    );
  }
}
