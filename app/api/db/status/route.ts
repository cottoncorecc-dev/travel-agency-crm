import { NextRequest, NextResponse } from 'next/server';
import { getDatabaseStatus } from '@/lib/db';
import { testAndSetMongoUri, getActiveMongoUri } from '@/lib/mongodb';
import { verifyOwnerAuth, sanitizeInputString } from '@/lib/security';
import { getClientIp, checkRateLimit, createRateLimitResponse } from '@/lib/rateLimit';

export async function GET(req: NextRequest) {
  const ip = getClientIp(req);
  const limit = checkRateLimit(`db_status:${ip}`, 60, 60);
  if (!limit.success) {
    return createRateLimitResponse(limit, 'Too many status checks. Please wait.');
  }

  try {
    const status = await getDatabaseStatus();
    return NextResponse.json({
      ...status,
      activeUri: getActiveMongoUri() ? 'Configured (Active)' : 'Not Set (Using Document Store)',
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Database status error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const limit = checkRateLimit(`db_update:${ip}`, 5, 300);
  if (!limit.success) {
    return createRateLimitResponse(limit, 'Too many database configuration attempts. Please wait.');
  }

  // Require CRM Owner or Super Admin authentication to change DB connection
  const auth = await verifyOwnerAuth(req);
  if (!auth.authorized) {
    return NextResponse.json(
      { error: 'Unauthorized. CRM Owner authorization required to configure database connection.' },
      { status: 401 }
    );
  }

  try {
    const body = await req.json();
    const rawUri = body?.uri;
    const uri = sanitizeInputString(rawUri, 2000);

    if (!uri) {
      return NextResponse.json({ success: false, error: 'Database URI is required.' }, { status: 400 });
    }

    const result = await testAndSetMongoUri(uri);
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    const updatedStatus = await getDatabaseStatus();
    return NextResponse.json({
      success: true,
      status: updatedStatus,
      message: 'MongoDB connection established successfully and synced.',
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error updating MongoDB URI' }, { status: 500 });
  }
}

