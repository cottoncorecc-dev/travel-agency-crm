import { NextRequest, NextResponse } from 'next/server';
import { getPlatformStats } from '@/lib/db';
import { verifyOwnerAuth } from '@/lib/security';

export async function GET(req: NextRequest) {
  try {
    const auth = await verifyOwnerAuth(req);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error || 'Unauthorized. CRM Owner access required.' }, { status: 401 });
    }

    const stats = await getPlatformStats();
    return NextResponse.json(stats);
  } catch (error: any) {
    console.error('Owner stats error:', error);
    return NextResponse.json({ error: 'Failed to fetch platform stats.' }, { status: 500 });
  }
}

