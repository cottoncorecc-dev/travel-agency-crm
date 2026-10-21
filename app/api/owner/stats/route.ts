import { NextResponse } from 'next/server';
import { getPlatformStats } from '@/lib/db';

export async function GET() {
  try {
    const stats = await getPlatformStats();
    return NextResponse.json(stats);
  } catch (error: any) {
    console.error('Owner stats error:', error);
    return NextResponse.json({ error: 'Failed to fetch platform stats.' }, { status: 500 });
  }
}
